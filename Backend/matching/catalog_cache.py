"""
SQLite-backed embedding cache for catalog products.

Why cache?
  Generating embeddings for a large catalog is slow.
  If the same product text appears again, we reuse its stored vector.
  This makes repeated /matching/analyze calls fast after the first warm-up.

Storage key: SHA-256(model_name + ":" + SHA-256(document_text))
  Keyed by both the model name and document hash so that:
    - Switching embedding models invalidates old entries automatically.
    - Identical product texts across different catalogs share one entry.

pgvector upgrade path:
  To migrate to PostgreSQL + pgvector, implement a PGVectorCache class
  with the same .get() and .put() interface and pass it to HybridRetriever.
  No other code changes are needed.
"""

import hashlib
import json
import sqlite3
import threading
import numpy as np


class SQLiteEmbeddingCache:
    """
    Thread-safe SQLite cache for embedding vectors.

    Safe for use with FastAPI's async workers because:
      - check_same_thread=False allows cross-thread access
      - A threading.Lock() serializes all reads and writes
    """

    def __init__(self, path: str = "./matching_catalog_cache.db"):
        self.path = path
        self._lock = threading.Lock()
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.execute("""
            CREATE TABLE IF NOT EXISTS catalog_embeddings (
                cache_key     TEXT PRIMARY KEY,
                model_name    TEXT NOT NULL,
                document_hash TEXT NOT NULL,
                vector_json   TEXT NOT NULL,
                created_at    TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        self._conn.commit()

    @staticmethod
    def _doc_hash(document: str) -> str:
        return hashlib.sha256(document.encode("utf-8")).hexdigest()

    @staticmethod
    def _cache_key(model_name: str, document: str) -> str:
        doc_hash = hashlib.sha256(document.encode("utf-8")).hexdigest()
        combined = f"{model_name}:{doc_hash}"
        return hashlib.sha256(combined.encode("utf-8")).hexdigest()

    def get(self, model_name: str, document: str) -> np.ndarray | None:
        """Return cached vector or None if not cached."""
        key = self._cache_key(model_name, document)
        with self._lock:
            row = self._conn.execute(
                "SELECT vector_json FROM catalog_embeddings WHERE cache_key = ?",
                (key,),
            ).fetchone()
        if row is None:
            return None
        return np.asarray(json.loads(row[0]), dtype=np.float32)

    def put(self, model_name: str, document: str, vector: np.ndarray) -> None:
        """Store a vector in the cache."""
        key = self._cache_key(model_name, document)
        doc_hash = self._doc_hash(document)
        payload = json.dumps(np.asarray(vector, dtype=np.float32).tolist())
        with self._lock:
            self._conn.execute(
                """INSERT OR REPLACE INTO catalog_embeddings
                   (cache_key, model_name, document_hash, vector_json)
                   VALUES (?, ?, ?, ?)""",
                (key, model_name, doc_hash, payload),
            )
            self._conn.commit()

    def close(self) -> None:
        with self._lock:
            self._conn.close()
