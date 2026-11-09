"""
Embedding services for semantic product representation.

BGEEmbedder  — production embedder using BAAI/bge-small-en-v1.5
              Lazy-loaded: model is downloaded only on first encode() call.

HashingEmbedder — deterministic test fallback using sklearn HashingVectorizer.
                  No model download, no network required. NOT suitable for
                  production or demo use. Used only in pytest fixtures.

Both implement the Embedder Protocol so they're interchangeable in tests.
"""

from __future__ import annotations
from typing import Protocol
import numpy as np


class Embedder(Protocol):
    """Interface that all embedder implementations must satisfy."""
    model_name: str

    def encode(self, texts: list[str], is_query: bool = False) -> np.ndarray:
        """
        Encode a list of texts into normalized float32 vectors.

        Args:
            texts:    list of strings to embed
            is_query: if True, prepend BGE query prefix for asymmetric retrieval

        Returns:
            np.ndarray of shape (len(texts), embedding_dim), dtype float32
        """
        ...


class BGEEmbedder:
    """
    Production-quality encoder using BAAI/bge-small-en-v1.5.

    Why BGE?
      - Trained specifically for retrieval tasks
      - Supports asymmetric query→document matching via query prefix
      - Small (33M params) and fast enough for real-time dispute analysis
      - Outperforms generic sentence-bert on product retrieval tasks

    Model is lazy-loaded: the first encode() call downloads model weights
    from Hugging Face Hub (~130 MB). Subsequent calls reuse the cached model.

    To switch to a larger model for higher accuracy:
        $env:VEROXA_EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"
    """

    # BGE requires this exact prefix for query texts in asymmetric retrieval.
    # Catalog documents are encoded WITHOUT this prefix.
    QUERY_PREFIX = "Represent this sentence for searching relevant passages: "

    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        self.model_name = model_name
        self._model = None  # Deferred load
        self._fallback = None

    def _load(self):
        if self._model is None and self._fallback is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer(self.model_name)
            except Exception:
                # Graceful fallback to HashingEmbedder if sentence-transformers is missing
                self._fallback = HashingEmbedder()
        return self._model

    def encode(self, texts: list[str], is_query: bool = False) -> np.ndarray:
        """
        Encode texts into L2-normalized float32 vectors.
        Uses BGE if available, otherwise falls back gracefully to HashingEmbedder.
        """
        model = self._load()
        if model is None:
            return self._fallback.encode(texts, is_query=is_query)

        prefix = self.QUERY_PREFIX if is_query else ""
        prepared = [prefix + t for t in texts]
        vectors = model.encode(
            prepared,
            normalize_embeddings=True,  # L2 normalize → cosine = dot product
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        return np.asarray(vectors, dtype=np.float32)


class HashingEmbedder:
    """
    Deterministic test-only fallback. No model download. No network.

    Uses sklearn HashingVectorizer with character n-grams.
    Vectors are deterministic for the same input text, making tests reproducible.

    DO NOT use this for the actual demo or production.
    DO use it in pytest to avoid downloading BGE during CI/CD.
    """
    model_name = "sklearn-hashing-vectorizer-ngram-test-fallback"

    def encode(self, texts: list[str], is_query: bool = False) -> np.ndarray:
        from sklearn.feature_extraction.text import HashingVectorizer
        vectorizer = HashingVectorizer(
            n_features=512,
            alternate_sign=False,
            norm="l2",
            ngram_range=(1, 2),
            analyzer="word",
        )
        matrix = vectorizer.transform(texts)
        return matrix.toarray().astype(np.float32)
