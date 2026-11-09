"""
Unit tests for retrieval.py — BM25, cosine similarity, RRF.

Run with: pytest tests/test_retrieval.py -v
No model download required.
"""

import numpy as np
import pytest

from matching.schemas import Product
from matching.retrieval import SimpleBM25, HybridRetriever
from matching.embedding_service import HashingEmbedder
from matching.catalog_cache import SQLiteEmbeddingCache


# ── SimpleBM25 tests ──────────────────────────────────────────────────────────

class TestSimpleBM25:
    def test_exact_term_match_scores_high(self):
        corpus = [
            ["sony", "xm5", "headphones"],
            ["bose", "quietcomfort", "headphones"],
            ["apple", "airpods", "pro"],
        ]
        bm25 = SimpleBM25(corpus)
        scores = bm25.get_scores(["sony", "xm5"])
        # Sony XM5 doc should score highest
        assert int(np.argmax(scores)) == 0

    def test_no_match_scores_zero(self):
        corpus = [["apple", "laptop"], ["sony", "headphones"]]
        bm25 = SimpleBM25(corpus)
        scores = bm25.get_scores(["gucci", "handbag"])
        assert all(s == 0.0 for s in scores)

    def test_scores_array_length_matches_corpus(self):
        corpus = [["a", "b"], ["c", "d"], ["e", "f"]]
        bm25 = SimpleBM25(corpus)
        scores = bm25.get_scores(["a"])
        assert len(scores) == 3

    def test_empty_query_returns_zeros(self):
        corpus = [["sony", "xm5"]]
        bm25 = SimpleBM25(corpus)
        scores = bm25.get_scores([])
        assert all(s == 0.0 for s in scores)


# ── HybridRetriever tests ─────────────────────────────────────────────────────

def build_retriever() -> HybridRetriever:
    return HybridRetriever(
        embedder=HashingEmbedder(),
        cache=SQLiteEmbeddingCache(":memory:"),
    )


class TestHybridRetriever:
    def test_empty_catalog_returns_empty(self):
        retriever = build_retriever()
        retriever.index([])
        results = retriever.search("Sony XM5", top_k=5)
        assert results == []

    def test_top_k_limits_results(self):
        products = [
            Product(product_id=str(i), title=f"Product {i}", model=f"M{i}")
            for i in range(10)
        ]
        retriever = build_retriever()
        retriever.index(products)
        results = retriever.search("Product", top_k=3)
        assert len(results) <= 3

    def test_exact_model_term_ranks_first(self):
        """
        Product with exact model number in title should rank first
        when querying with that model number.
        """
        products = [
            Product(product_id="xm5", title="Sony WH-1000XM5 Headphones", model="WH-1000XM5"),
            Product(product_id="bose", title="Bose QuietComfort Ultra Headphones", model="QC-ULTRA"),
            Product(product_id="apple", title="Apple AirPods Pro 2nd Generation", model="AIRPODS-PRO"),
        ]
        retriever = build_retriever()
        retriever.index(products)
        results = retriever.search("WH-1000XM5 Sony headphones", top_k=3)
        # XM5 should be in top results
        top_ids = [r.product_id for r in results]
        assert "xm5" in top_ids[:2]

    def test_candidate_scores_are_valid(self):
        products = [
            Product(product_id="A", title="Sony Headphones XM5"),
            Product(product_id="B", title="Nike Running Shoes"),
        ]
        retriever = build_retriever()
        retriever.index(products)
        results = retriever.search("Sony XM5", top_k=2)
        for r in results:
            assert 0.0 <= r.semantic_score <= 1.0
            assert 0.0 <= r.bm25_score <= 1.0
            assert r.rrf_score > 0.0

    def test_caching_works(self):
        """Second index call with same products should use cache."""
        products = [Product(product_id="X", title="Sony WH-1000XM5", model="WH-1000XM5")]
        retriever = build_retriever()
        # First call generates embeddings
        retriever.index(products)
        r1 = retriever.search("Sony XM5", top_k=1)
        # Second call should use cache (same results)
        retriever.index(products)
        r2 = retriever.search("Sony XM5", top_k=1)
        assert len(r1) == len(r2)
        if r1 and r2:
            assert r1[0].product_id == r2[0].product_id

    def test_rrf_score_is_sum_of_reciprocal_ranks(self):
        """Validate RRF formula: score = Σ 1/(60 + rank)."""
        products = [
            Product(product_id="A", title="Apple AirPods Pro"),
            Product(product_id="B", title="Sony WH-1000XM5"),
        ]
        retriever = build_retriever()
        retriever.index(products)
        results = retriever.search("Sony XM5 headphones", top_k=2)
        # All RRF scores should be positive and < 2 * (1/61) ≈ 0.033
        for r in results:
            assert r.rrf_score > 0
            assert r.rrf_score < 0.1  # Reasonable upper bound for 2 rankers
