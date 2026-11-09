"""
FastAPI router for the Veroxa AI Product Matching Engine.

Exposes:  POST /matching/analyze
Auth:     X-Matching-API-Key header (compare_digest to prevent timing attacks)

Integration for Member 2:
  Add these two lines to Backend/main.py:

      from matching.api import router as matching_router
      app.include_router(matching_router)

  Then set the environment variable before starting the server:
      $env:VEROXA_MATCHING_API_KEY = "your-long-random-secret"

  The endpoint will appear in the Swagger docs at http://localhost:8000/docs
  under the "AI Product Matching" section.
"""

import os
import secrets

from fastapi import APIRouter, Header, HTTPException

from .schemas import DisputeInput, MatchingResult
from .matching_service import MatchingService

router = APIRouter(
    prefix="/matching",
    tags=["AI Product Matching"],
)

# Singleton service instance — initialized once on first request.
# BGE model is downloaded and cached on the first call.
_service: MatchingService | None = None


def get_service() -> MatchingService:
    """Return the shared MatchingService, creating it on first use."""
    global _service
    if _service is None:
        try:
            _service = MatchingService()
        except Exception as exc:
            raise HTTPException(
                status_code=503,
                detail=(
                    f"Matching engine unavailable: {exc}. "
                    "Ensure sentence-transformers is installed and "
                    "VEROXA_ENABLE_EMBEDDINGS=true."
                ),
            ) from exc
    return _service


def _authenticate(api_key: str | None) -> None:
    """
    Validate the API key using constant-time comparison.
    compare_digest prevents timing attacks that could reveal the key length.
    """
    configured_key = os.getenv("VEROXA_MATCHING_API_KEY", "")
    if not configured_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "Matching endpoint is not configured. "
                "Set the VEROXA_MATCHING_API_KEY environment variable before use."
            ),
        )
    if not api_key or not secrets.compare_digest(api_key, configured_key):
        raise HTTPException(
            status_code=401,
            detail="Invalid or missing X-Matching-API-Key header.",
        )


@router.post("/analyze", response_model=MatchingResult, summary="Analyze a product dispute")
def analyze_dispute(
    payload: DisputeInput,
    x_matching_api_key: str | None = Header(default=None),
) -> MatchingResult:
    """
    Run the semantic product matching engine on a dispute.

    Accepts ordered product, received product, buyer claim, and optional
    catalog + evidence items. Returns a structured verdict with:
    - result: MATCH / MISMATCH_DETECTED / MANUAL_REVIEW / INSUFFICIENT_EVIDENCE
    - confidence_score: hybrid semantic + attribute score [0, 1]
    - mismatched_attributes: detailed per-field comparison
    - explanations: human-readable reasoning
    - requires_human_review: always True (design guarantee)

    **Important**: This endpoint recommends only. No funds are moved.
    All financial actions require human reviewer confirmation.
    """
    _authenticate(x_matching_api_key)
    try:
        return get_service().analyze(payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/health", summary="Check matching engine health")
def health_check():
    """Returns engine version and configuration status."""
    configured = bool(os.getenv("VEROXA_MATCHING_API_KEY", ""))
    return {
        "status": "ok" if configured else "unconfigured",
        "engine_version": "2.0.0",
        "api_key_configured": configured,
        "embedding_model": os.getenv("VEROXA_EMBEDDING_MODEL", "BAAI/bge-small-en-v1.5"),
        "clip_enabled": os.getenv("VEROXA_ENABLE_CLIP", "false"),
        "ocr_enabled": os.getenv("VEROXA_ENABLE_OCR", "false"),
    }
