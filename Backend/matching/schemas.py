"""
Pydantic v2 data contracts for the Veroxa Matching Engine.

These schemas define the API contract between:
  - Member 1 (AI engine) ← this module
  - Member 2 (backend) calls analyze()
  - Member 3 (frontend) displays MatchingResult

Do NOT add business logic here — keep schemas as pure data containers.
"""

from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field, ConfigDict


# ── Product ──────────────────────────────────────────────────────────────────

class Product(BaseModel):
    """
    Represents either an ordered (listed) product or a received product.

    Use `attributes` for any extra fields that don't map to the top-level
    named fields (e.g. storage, screen_size, connectivity).
    """
    model_config = ConfigDict(extra="allow")

    product_id: str | None = None
    title: str
    description: str = ""
    brand: str | None = None
    category: str | None = None
    sku: str | None = None
    model: str | None = None
    attributes: dict[str, Any] = Field(default_factory=dict)
    image_path: str | None = None  # local path or URL for CLIP comparison

    def flattened_attributes(self) -> dict[str, Any]:
        """
        Merge top-level named fields into the attributes dict for comparison.
        Named fields (brand, model, sku, category) take precedence.
        """
        merged = dict(self.attributes)
        for key in ("brand", "category", "sku", "model"):
            value = getattr(self, key)
            if value is not None:
                merged[key] = value
        return merged

    def searchable_text(self) -> str:
        """
        Produce a single normalized string for embedding generation.
        Includes title, description, and all attributes.
        """
        parts = [self.title, self.description]
        for key, value in sorted(self.flattened_attributes().items()):
            if value is not None:
                parts.append(f"{key}: {value}")
        return " | ".join(str(p) for p in parts if p)


# ── Evidence ─────────────────────────────────────────────────────────────────

class EvidenceItem(BaseModel):
    """
    A single piece of dispute evidence submitted by buyer, seller, or system.
    Every AI finding should trace back to at least one EvidenceItem.
    """
    evidence_id: str
    evidence_type: Literal["image", "text", "ocr", "document", "chat"] = "text"
    source: str  # e.g. "buyer_upload", "seller_submission", "system"
    text: str | None = None          # Extracted text content
    image_path: str | None = None    # Local path or URL for CLIP/OCR
    observed_at: str | None = None   # ISO 8601 timestamp


# ── Dispute Input ─────────────────────────────────────────────────────────────

class DisputeInput(BaseModel):
    """
    The complete input to the matching engine for one dispute.

    ordered_product  — what the buyer purchased (from the listing)
    received_product — what actually arrived (from buyer's evidence)
    catalog          — optional product catalog for retrieval ranking
    evidence         — submitted evidence items (photos, chat logs, etc.)
    """
    dispute_id: str
    ordered_product: Product
    received_product: Product | None = None  # None = no received product info yet
    buyer_claim: str = ""
    catalog: list[Product] = Field(default_factory=list)
    evidence: list[EvidenceItem] = Field(default_factory=list)


# ── Comparison Results ────────────────────────────────────────────────────────

class AttributeComparison(BaseModel):
    """
    Result of comparing one attribute between ordered and received product.

    status values:
        MATCH      — both sides agree
        MISMATCH   — values differ (may trigger escalation if severity=critical)
        UNVERIFIED — one or both sides are missing; never treated as MATCH
    """
    attribute: str
    expected: Any = None   # From ordered product
    observed: Any = None   # From received product
    status: Literal["MATCH", "MISMATCH", "UNVERIFIED"]
    severity: Literal["critical", "major", "minor", "informational"] = "minor"
    explanation: str
    evidence_ids: list[str] = Field(default_factory=list)


class CandidateMatch(BaseModel):
    """
    One catalog product returned by retrieval, with its ranking scores.

    IMPORTANT: A high retrieval score does NOT mean the received product IS
    this catalog item. It means the product is semantically similar.
    Attribute comparison is what determines the actual verdict.
    """
    product_id: str | None = None
    title: str
    semantic_score: float    # Cosine similarity [0, 1]
    bm25_score: float        # Normalized BM25 score [0, 1]
    rrf_score: float         # Reciprocal Rank Fusion score
    attribute_score: float | None = None   # Set after attribute comparison
    hybrid_score: float | None = None      # 0.35*semantic + 0.65*attribute


# ── Matching Result ───────────────────────────────────────────────────────────

class MatchingResult(BaseModel):
    """
    Full output of the matching engine for one dispute.

    result values:
        MATCH                — no critical mismatch found (reviewer still required)
        MISMATCH_DETECTED    — critical attribute conflict found
        MANUAL_REVIEW        — insufficient confidence or conflicting evidence
        INSUFFICIENT_EVIDENCE — not enough product info to make any comparison

    recommendation values:
        DRAFT_MATCH      — suggest releasing funds (pending reviewer approval)
        FLAG_MISMATCH    — flag for refund consideration
        ESCALATE         — route to senior reviewer
        REQUEST_EVIDENCE — ask parties for more information

    DESIGN PRINCIPLE:
        The engine recommends; it never autonomously moves money.
        requires_human_review is ALWAYS True — it is structurally impossible
        for this engine to release or refund without human confirmation.
    """
    dispute_id: str
    engine_version: str = "2.0.0"
    retrieval_method: str = "BGE + BM25 + Reciprocal Rank Fusion"

    # ── Core verdict ──────────────────────────────────────────────────────────
    result: Literal[
        "MATCH", "MISMATCH_DETECTED", "MANUAL_REVIEW", "INSUFFICIENT_EVIDENCE"
    ]
    recommendation: Literal[
        "DRAFT_MATCH", "FLAG_MISMATCH", "ESCALATE", "REQUEST_EVIDENCE"
    ]
    confidence_score: float          # Hybrid score [0, 1]
    requires_human_review: bool = True  # Always True — by design

    # ── Scores ────────────────────────────────────────────────────────────────
    semantic_similarity: float | None = None
    attribute_score: float | None = None
    image_similarity: float | None = None   # CLIP, if available

    # ── Attribute-level findings ──────────────────────────────────────────────
    matched_attributes: list[str] = Field(default_factory=list)
    mismatched_attributes: list[AttributeComparison] = Field(default_factory=list)
    unverified_attributes: list[AttributeComparison] = Field(default_factory=list)

    # ── Retrieval results ─────────────────────────────────────────────────────
    candidates: list[CandidateMatch] = Field(default_factory=list)

    # ── Explanations and evidence ─────────────────────────────────────────────
    explanations: list[str] = Field(default_factory=list)
    evidence_references: list[dict[str, str]] = Field(default_factory=list)
    ocr_extractions: list[dict[str, str]] = Field(default_factory=list)
    multimodal_warnings: list[str] = Field(default_factory=list)

    # ── Metadata ──────────────────────────────────────────────────────────────
    model_metadata: dict[str, str] = Field(default_factory=dict)
    latency_ms: float = 0.0
