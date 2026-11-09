"""
MatchingService — the main orchestrator for the Veroxa matching engine.

This is the single entry point for all dispute analysis.
Call analyze(request) and get back a fully-structured MatchingResult.

Pipeline:
  1. Normalize all product text and attributes
  2. Build catalog index (BGE embeddings + BM25)
  3. Retrieve top-K catalog candidates using the RECEIVED product + buyer claim
  4. Compare ordered vs received attributes (exact + fuzzy)
  5. Run CLIP image comparison (if enabled and images provided)
  6. Run OCR on evidence images (if enabled)
  7. Apply confidence and decision engine
  8. Generate human-readable explanations
  9. Return structured MatchingResult

Integration for Member 2 (backend):
    from matching import MatchingService, DisputeInput, Product

    service = MatchingService()
    result = service.analyze(DisputeInput(
        dispute_id="DSP-1001",
        ordered_product=Product(title="...", model="...", ...),
        received_product=Product(title="...", model="...", ...),
        buyer_claim="I received the wrong model.",
    ))
    # result is a Pydantic model — call result.model_dump() for dict/JSON
"""

from __future__ import annotations
import time

from .config import MatchingConfig
from .schemas import (
    Product, DisputeInput, MatchingResult, CandidateMatch
)
from .embedding_service import BGEEmbedder, HashingEmbedder, Embedder
from .retrieval import HybridRetriever
from .catalog_cache import SQLiteEmbeddingCache
from .attribute_matcher import compare_products
from .confidence import decide


class MatchingService:
    """
    Stateless (after initialization) dispute matching service.

    Thread-safe: multiple FastAPI workers can share one instance.
    The embedded retriever holds catalog state; re-index on catalog change.
    """

    def __init__(
        self,
        config: MatchingConfig | None = None,
        embedder: Embedder | None = None,
    ):
        self.config = config or MatchingConfig()

        # Allow injecting a test embedder (e.g. HashingEmbedder) so tests
        # don't require model download.
        if embedder is None:
            if self.config.enable_embeddings:
                embedder = BGEEmbedder(self.config.embedding_model)
            else:
                # enable_embeddings=False → caller must supply an embedder
                raise ValueError(
                    "enable_embeddings=False requires an explicit test embedder. "
                    "Pass embedder=HashingEmbedder() for offline testing."
                )

        self.embedder = embedder
        self.retriever = HybridRetriever(
            embedder,
            cache=SQLiteEmbeddingCache(self.config.catalog_cache_path),
        )

    def analyze(self, request: DisputeInput) -> MatchingResult:
        """
        Run the complete matching pipeline for one dispute.

        Args:
            request: DisputeInput with ordered + received products + evidence

        Returns:
            MatchingResult with verdict, confidence, attribute diffs, explanations
        """
        started = time.perf_counter()

        # ── 1. Build catalog index ────────────────────────────────────────────
        # If a catalog is provided, use it. Otherwise, use only the ordered
        # product as the single catalog entry (for simple two-product disputes).
        catalog = request.catalog if request.catalog else [request.ordered_product]
        self.retriever.index(catalog)

        # ── 2. Retrieve catalog candidates ────────────────────────────────────
        # IMPORTANT: Query with the RECEIVED product + buyer claim.
        # We want to find the catalog product that matches what was actually
        # received, not confirm that the ordered product is in the catalog.
        query_product = request.received_product or request.ordered_product
        query = " ".join(
            part for part in [query_product.searchable_text(), request.buyer_claim]
            if part
        )
        candidates = self.retriever.search(query, self.config.top_k)

        # ── 3. CLIP image comparison (optional) ───────────────────────────────
        image_similarity: float | None = None
        multimodal_warnings: list[str] = []

        if (
            self.config.enable_clip
            and request.received_product
            and request.ordered_product.image_path
            and request.received_product.image_path
        ):
            try:
                from .multimodal import CLIPImageComparator
                image_similarity = CLIPImageComparator(self.config.clip_model).similarity(
                    request.ordered_product.image_path,
                    request.received_product.image_path,
                )
            except Exception as exc:
                multimodal_warnings.append(
                    f"CLIP image comparison unavailable: {type(exc).__name__}: {exc}"
                )

        # ── 4. OCR on evidence images (optional) ──────────────────────────────
        ocr_extractions: list[dict[str, str]] = []

        if self.config.enable_ocr:
            try:
                from .multimodal import OCRService
                ocr_service = OCRService()
                for ev in request.evidence:
                    if ev.image_path:
                        extracted = ocr_service.extract(ev.image_path)
                        ocr_extractions.append({
                            "evidence_id": ev.evidence_id,
                            "source": ev.source,
                            "text": extracted[:4000],  # Truncate for safety
                        })
            except Exception as exc:
                multimodal_warnings.append(
                    f"OCR service unavailable: {type(exc).__name__}: {exc}"
                )

        # ── 5. Attribute comparison ───────────────────────────────────────────
        evidence_ids = [e.evidence_id for e in request.evidence]
        comparisons, attr_score, coverage = compare_products(
            request.ordered_product,
            request.received_product,
            evidence_ids,
        )

        # ── 6. Compute hybrid confidence score ────────────────────────────────
        # Semantic component: top candidate's cosine similarity to received product
        top_semantic = candidates[0].semantic_score if candidates else 0.0
        attr_component = attr_score if attr_score is not None else 0.0

        # Hybrid formula: 35% semantic + 65% attribute
        raw_confidence = (
            self.config.semantic_weight * top_semantic
            + self.config.attribute_weight * attr_component
        )
        # Penalty for low coverage — we're less confident when many attrs are unverified
        confidence = raw_confidence * coverage if request.received_product else 0.0

        # ── 7. Apply decision policy ──────────────────────────────────────────
        result, recommendation, requires_review, reasons = decide(
            comparisons=comparisons,
            confidence=confidence,
            coverage=coverage,
            has_received_product=request.received_product is not None,
            high_threshold=self.config.high_confidence,
            medium_threshold=self.config.medium_confidence,
        )

        # ── 8. Build explanation list ─────────────────────────────────────────
        matched_attrs = [c.attribute for c in comparisons if c.status == "MATCH"]
        mismatched = [c for c in comparisons if c.status == "MISMATCH"]
        unverified = [c for c in comparisons if c.status == "UNVERIFIED"]

        explanations: list[str] = list(reasons)
        for c in mismatched + unverified:
            if c.explanation not in explanations:
                explanations.append(c.explanation)

        if image_similarity is not None:
            explanations.append(
                f"CLIP visual similarity score: {image_similarity:.3f}. "
                "This is supporting evidence only — image similarity does not "
                "establish product identity or authenticity."
            )

        for warning in multimodal_warnings:
            explanations.append(f"[System warning] {warning}")

        # ── 9. Enrich candidate scores with attribute comparison ──────────────
        for candidate in candidates:
            # Find the catalog product this candidate refers to
            matching_product = next(
                (
                    p for p in catalog
                    if p.product_id == candidate.product_id
                    and p.title == candidate.title
                ),
                None,
            )
            if matching_product and request.ordered_product:
                _, cand_attr, _ = compare_products(
                    request.ordered_product, matching_product
                )
                candidate.attribute_score = cand_attr
                candidate.hybrid_score = round(
                    0.35 * candidate.semantic_score
                    + 0.65 * (cand_attr or 0.0),
                    4,
                )

        # ── 10. Build evidence references ─────────────────────────────────────
        evidence_refs = [
            {
                "evidence_id": e.evidence_id,
                "type": e.evidence_type,
                "source": e.source,
            }
            for e in request.evidence
        ]

        elapsed_ms = (time.perf_counter() - started) * 1000

        return MatchingResult(
            dispute_id=request.dispute_id,
            result=result,
            recommendation=recommendation,
            confidence_score=round(float(confidence), 4),
            semantic_similarity=round(float(top_semantic), 4),
            attribute_score=round(float(attr_component), 4) if attr_score is not None else None,
            image_similarity=round(image_similarity, 4) if image_similarity is not None else None,
            matched_attributes=matched_attrs,
            mismatched_attributes=mismatched,
            unverified_attributes=unverified,
            candidates=candidates,
            explanations=explanations,
            evidence_references=evidence_refs,
            ocr_extractions=ocr_extractions,
            multimodal_warnings=multimodal_warnings,
            requires_human_review=requires_review,
            model_metadata={
                "embedding_model": self.embedder.model_name,
                "engine_version": "2.0.0",
                "retrieval_method": "BGE + BM25 + Reciprocal Rank Fusion",
                "attribute_weight": str(self.config.attribute_weight),
                "semantic_weight": str(self.config.semantic_weight),
            },
            latency_ms=round(elapsed_ms, 2),
        )
