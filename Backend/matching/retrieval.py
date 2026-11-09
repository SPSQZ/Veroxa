"""
Hybrid retrieval: BM25 + Dense (cosine) similarity + Reciprocal Rank Fusion.

Why hybrid retrieval?
  Dense (embedding) retrieval is great for semantic similarity but can miss
  exact product codes like "WH-1000XM5" or "DD1391-100".

  BM25 keyword retrieval is great for exact terms but misses paraphrases.

  Combining them with RRF gives us the best of both worlds:
    - "noise cancelling wireless headphones" → found by dense retrieval
    - "WH-1000XM5 DD1391-100" → found by BM25
    - Both fused by RRF → correct product ranked #1

Reciprocal Rank Fusion (RRF):
  RRF(d) = Σ_i  1 / (k + rank_i(d))
  where k=60 is a smoothing constant that prevents top-ranked documents from
  dominating the fusion and gives mid-ranked documents fair credit.
"""

from __future__ import annotations
import math
from collections import Counter, defaultdict
from typing import TYPE_CHECKING

import numpy as np

from .schemas import CandidateMatch, Product
from .normalizer import normalize_text
from .embedding_service import Embedder
from .catalog_cache import SQLiteEmbeddingCache

if TYPE_CHECKING:
    pass


class SimpleBM25:
    """
    Pure-Python BM25 implementation. No external BM25 dependency.

    BM25 is a probabilistic retrieval function that improves on TF-IDF by:
      - Saturating term frequency (extra occurrences give diminishing returns)
      - Normalizing for document length (long documents don't dominate)

    Parameters:
        k1 = 1.5  — term frequency saturation
        b  = 0.75 — document length normalization strength
    """

    def __init__(
        self,
        tokenized_corpus: list[list[str]],
        k1: float = 1.5,
        b: float = 0.75,
    ):
        self.k1 = k1
        self.b = b
        self.docs = tokenized_corpus
        self.lengths = [len(doc) for doc in tokenized_corpus]
        self.avgdl = sum(self.lengths) / max(1, len(self.lengths))
        self.tf = [Counter(doc) for doc in tokenized_corpus]
        n = len(tokenized_corpus)
        # Document frequency for each term
        df = Counter(token for doc in tokenized_corpus for token in set(doc))
        # IDF using Robertson-Spärck Jones smoothing
        self.idf = {
            term: math.log(1 + (n - freq + 0.5) / (freq + 0.5))
            for term, freq in df.items()
        }

    def get_scores(self, query_tokens: list[str]) -> np.ndarray:
        """Return BM25 scores for all documents in the corpus."""
        scores = []
        for tf_counts, dl in zip(self.tf, self.lengths):
            score = 0.0
            for token in query_tokens:
                freq = tf_counts.get(token, 0)
                if freq > 0:
                    idf = self.idf.get(token, 0.0)
                    # BM25 term weight formula
                    numerator = freq * (self.k1 + 1)
                    denominator = freq + self.k1 * (
                        1 - self.b + self.b * dl / max(self.avgdl, 1)
                    )
                    score += idf * numerator / denominator
            scores.append(score)
        return np.asarray(scores, dtype=np.float32)


class HybridRetriever:
    """
    Retrieves top-K catalog products using BGE embeddings + BM25 + RRF.

    Usage:
        retriever = HybridRetriever(embedder, cache=cache)
        retriever.index(catalog_products)   # Build index
        candidates = retriever.search(query, top_k=5)
    """

    RRF_K = 60  # Standard RRF smoothing constant

    def __init__(
        self,
        embedder: Embedder,
        rrf_k: int = RRF_K,
        cache: SQLiteEmbeddingCache | None = None,
    ):
        self.embedder = embedder
        self.rrf_k = rrf_k
        self.cache = cache or SQLiteEmbeddingCache()
        self.products: list[Product] = []
        self.documents: list[str] = []
        self.doc_vectors: np.ndarray | None = None
        self.bm25: SimpleBM25 | None = None

    def index(self, products: list[Product]) -> None:
        """
        Build the retrieval index from a list of catalog products.

        Embeddings are generated once and cached. Subsequent calls with the
        same products reuse cached vectors.
        """
        self.products = products
        self.documents = [p.searchable_text() for p in products]

        # Build BM25 index
        tokenized = [normalize_text(d).split() for d in self.documents]
        self.bm25 = SimpleBM25(tokenized) if tokenized else None

        # Build dense index (with caching)
        if products:
            # Check cache for each document
            cached: list[np.ndarray | None] = [
                self.cache.get(self.embedder.model_name, doc)
                for doc in self.documents
            ]
            # Encode only the documents not in cache
            missing_indices = [i for i, v in enumerate(cached) if v is None]
            if missing_indices:
                missing_docs = [self.documents[i] for i in missing_indices]
                generated = self.embedder.encode(missing_docs, is_query=False)
                for local_i, global_i in enumerate(missing_indices):
                    cached[global_i] = generated[local_i]
                    self.cache.put(
                        self.embedder.model_name,
                        self.documents[global_i],
                        generated[local_i],
                    )
            # Stack all vectors into a matrix for fast cosine scoring
            self.doc_vectors = np.vstack(cached).astype(np.float32)
        else:
            self.doc_vectors = None

    def search(self, query: str, top_k: int = 5) -> list[CandidateMatch]:
        """
        Search the indexed catalog and return top-K candidates ranked by RRF.

        Args:
            query:  Concatenation of received-product text + buyer claim
            top_k:  Number of candidates to return

        Returns:
            List of CandidateMatch objects sorted by RRF score (highest first).

        IMPORTANT: Returns the candidates semantically closest to the RECEIVED
        product + claim, not the ordered product. We're trying to identify what
        was actually received, not confirm what was ordered.
        """
        if not self.products or self.doc_vectors is None:
            return []

        # Dense retrieval: cosine similarity (vectors are already L2-normalized)
        query_vector = self.embedder.encode([query], is_query=True)[0]
        dense_scores = np.dot(self.doc_vectors, query_vector)

        # Sparse retrieval: BM25
        query_tokens = normalize_text(query).split()
        bm25_scores = (
            self.bm25.get_scores(query_tokens)
            if self.bm25
            else np.zeros(len(self.products), dtype=np.float32)
        )

        # Rank by each method
        dense_ranking = np.argsort(-dense_scores).tolist()
        bm25_ranking = np.argsort(-bm25_scores).tolist()

        # Reciprocal Rank Fusion
        rrf: dict[int, float] = defaultdict(float)
        for ranking in (dense_ranking, bm25_ranking):
            for rank, idx in enumerate(ranking, start=1):
                rrf[idx] += 1.0 / (self.rrf_k + rank)

        # Select top-K by RRF score
        top_indices = sorted(rrf, key=lambda i: rrf[i], reverse=True)[:top_k]

        # Normalize BM25 scores to [0, 1] for reporting
        max_bm25 = float(np.max(bm25_scores)) if len(bm25_scores) > 0 else 0.0

        return [
            CandidateMatch(
                product_id=self.products[i].product_id,
                title=self.products[i].title,
                semantic_score=float(np.clip(dense_scores[i], 0.0, 1.0)),
                bm25_score=float(bm25_scores[i] / max_bm25) if max_bm25 > 0 else 0.0,
                rrf_score=float(rrf[i]),
            )
            for i in top_indices
        ]
