"""
MatchingConfig — all tuneable parameters in one place.

Every value can be overridden via environment variable so you can
experiment without touching Python code.

Example:
    $env:VEROXA_ATTRIBUTE_WEIGHT = "0.75"
    uvicorn main:app --reload
"""

from dataclasses import dataclass
import os


@dataclass(frozen=True)
class MatchingConfig:
    # ── Embedding model ──────────────────────────────────────────────────────
    # BGE small is fast and accurate for product matching.
    # Switch to BAAI/bge-base-en-v1.5 for higher accuracy at the cost of speed.
    embedding_model: str = os.getenv(
        "VEROXA_EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5"
    )

    # ── Retrieval ────────────────────────────────────────────────────────────
    # Number of top catalog candidates to rank and return
    top_k: int = int(os.getenv("VEROXA_TOP_K", "5"))

    # ── Hybrid scoring weights (must sum to 1.0) ─────────────────────────────
    # Attributes carry more weight than semantic similarity because
    # an exact model mismatch is more important than similar descriptions.
    semantic_weight: float = float(os.getenv("VEROXA_SEMANTIC_WEIGHT", "0.35"))
    attribute_weight: float = float(os.getenv("VEROXA_ATTRIBUTE_WEIGHT", "0.65"))

    # ── Confidence thresholds ────────────────────────────────────────────────
    # >= high_confidence AND coverage >= 0.80 → MATCH (reviewer still required)
    # >= medium_confidence             → MANUAL_REVIEW
    # < medium_confidence              → MANUAL_REVIEW (escalate)
    high_confidence: float = float(os.getenv("VEROXA_HIGH_CONFIDENCE", "0.85"))
    medium_confidence: float = float(os.getenv("VEROXA_MEDIUM_CONFIDENCE", "0.70"))

    # ── Embedding cache ──────────────────────────────────────────────────────
    # SQLite path for caching catalog embeddings.
    # Use ":memory:" in tests to avoid writing to disk.
    catalog_cache_path: str = os.getenv(
        "VEROXA_CATALOG_CACHE_PATH", "./matching_catalog_cache.db"
    )

    # ── Feature flags ────────────────────────────────────────────────────────
    # Set VEROXA_ENABLE_EMBEDDINGS=false to use a test embedder (no download).
    enable_embeddings: bool = (
        os.getenv("VEROXA_ENABLE_EMBEDDINGS", "true").lower() == "true"
    )

    # Optional CLIP image comparison (requires torch + transformers)
    enable_clip: bool = os.getenv("VEROXA_ENABLE_CLIP", "false").lower() == "true"
    clip_model: str = os.getenv(
        "VEROXA_CLIP_MODEL", "openai/clip-vit-base-patch32"
    )

    # Optional Tesseract OCR (requires pytesseract + tesseract binary)
    enable_ocr: bool = os.getenv("VEROXA_ENABLE_OCR", "false").lower() == "true"
