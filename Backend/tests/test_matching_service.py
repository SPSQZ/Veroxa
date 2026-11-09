"""
Integration tests for MatchingService — the full pipeline.

Uses HashingEmbedder (no model download) with MatchingConfig(enable_embeddings=False).
Tests verify end-to-end behavior of the matching pipeline.

Run with: pytest tests/test_matching_service.py -v
"""

import pytest
import numpy as np

from matching.schemas import Product, DisputeInput, EvidenceItem
from matching.matching_service import MatchingService
from matching.config import MatchingConfig
from matching.embedding_service import HashingEmbedder


# ── Test fixture ──────────────────────────────────────────────────────────────

def build_service() -> MatchingService:
    """Create a MatchingService with the test embedder (no download needed)."""
    cfg = MatchingConfig(
        enable_embeddings=False,
        top_k=3,
        catalog_cache_path=":memory:",
    )
    return MatchingService(config=cfg, embedder=HashingEmbedder())


# ── The critical test: model mismatch must always escalate ────────────────────

class TestCriticalMismatch:
    def test_xm5_vs_xm4_is_mismatch_detected(self):
        """
        CORE HACKATHON DEMO TEST:
        Sony WH-1000XM5 ordered, WH-1000XM4 received.
        Descriptions are semantically similar.
        Model number is definitively different.
        Expected: MISMATCH_DETECTED, not MATCH.
        """
        ordered = Product(
            product_id="SONY-XM5",
            title="Sony WH-1000XM5 Wireless Headphones",
            brand="Sony",
            model="WH-1000XM5",
            attributes={"color": "Black", "quantity": 1},
        )
        received = Product(
            title="Sony WH-1000XM4 Wireless Headphones",
            brand="Sony",
            model="WH-1000XM4",
            attributes={"color": "Black", "quantity": 1},
        )
        result = build_service().analyze(
            DisputeInput(
                dispute_id="DSP-TEST-001",
                ordered_product=ordered,
                received_product=received,
                buyer_claim="I received the XM4 instead of XM5",
            )
        )
        assert result.result == "MISMATCH_DETECTED"
        assert result.recommendation == "FLAG_MISMATCH"
        assert result.requires_human_review is True
        assert any(c.attribute == "model" for c in result.mismatched_attributes)
        assert any(c.severity == "critical" for c in result.mismatched_attributes)

    def test_nike_dunk_vs_air_force_1(self):
        """
        Real dispute scenario: Buyer ordered Nike Dunk Low, got Nike Air Force 1.
        SKU mismatch is critical.
        """
        ordered = Product(
            title="Nike Dunk Low Retro Panda Black White",
            brand="Nike",
            sku="DD1391-100",
            model="Dunk-Low",
            attributes={"color": "Black/White", "size": "US 10"},
        )
        received = Product(
            title="Nike Air Force 1 Triple White",
            brand="Nike",
            sku="CW2288-111",
            model="Air-Force-1",
            attributes={"color": "Triple White", "size": "US 10"},
        )
        result = build_service().analyze(
            DisputeInput(
                dispute_id="DSP-TEST-002",
                ordered_product=ordered,
                received_product=received,
                buyer_claim="Wrong shoe model received",
            )
        )
        assert result.result == "MISMATCH_DETECTED"
        assert any(c.attribute in ("sku", "model") for c in result.mismatched_attributes)


# ── Insufficient evidence tests ───────────────────────────────────────────────

class TestInsufficientEvidence:
    def test_no_received_product_requests_evidence(self):
        ordered = Product(title="Sony WH-1000XM5", model="WH-1000XM5")
        result = build_service().analyze(
            DisputeInput(
                dispute_id="DSP-TEST-003",
                ordered_product=ordered,
                # No received_product
            )
        )
        assert result.result == "INSUFFICIENT_EVIDENCE"
        assert result.recommendation == "REQUEST_EVIDENCE"
        assert result.requires_human_review is True

    def test_missing_attributes_are_unverified_not_match(self):
        """
        PRINCIPLE: missing info is UNVERIFIED, never MATCH.
        A buyer not providing photo of accessories ≠ accessories present.
        """
        ordered = Product(
            title="Headphones with Case",
            model="XM5",
            attributes={"accessories": ["Carrying case", "USB-C cable"]},
        )
        received = Product(
            title="Headphones",
            model="XM5",
            # No attributes — buyer didn't confirm accessories
        )
        result = build_service().analyze(
            DisputeInput(
                dispute_id="DSP-TEST-004",
                ordered_product=ordered,
                received_product=received,
            )
        )
        # Accessories should be UNVERIFIED since received product didn't mention them
        assert any(
            c.status == "UNVERIFIED" for c in result.unverified_attributes
        )


# ── Match tests ───────────────────────────────────────────────────────────────

class TestMatch:
    def test_same_product_paraphrased_title(self):
        """
        Paraphrased listing title should still match.
        "Sony WH-1000XM5" ≈ "Sony XM5 Wireless Headphones"
        """
        ordered = Product(
            title="Sony WH-1000XM5",
            brand="Sony",
            model="WH-1000XM5",
            attributes={"color": "Black"},
        )
        received = Product(
            title="Sony XM5 Wireless Noise-Cancelling Headphones",
            brand="Sony",
            model="WH-1000XM5",
            attributes={"color": "Black"},
        )
        result = build_service().analyze(
            DisputeInput(
                dispute_id="DSP-TEST-005",
                ordered_product=ordered,
                received_product=received,
            )
        )
        # Model matches exactly → should not be MISMATCH_DETECTED
        assert result.result != "MISMATCH_DETECTED"
        assert all(
            c.attribute != "model" for c in result.mismatched_attributes
        )


# ── Catalog retrieval tests ───────────────────────────────────────────────────

class TestCatalogRetrieval:
    def test_retrieval_uses_received_product_not_ordered(self):
        """
        DESIGN TEST: When searching the catalog, we should use the RECEIVED
        product text (to find what was actually sent), not the ordered product.
        Result: XM4 catalog entry should rank higher than XM5.
        """
        ordered = Product(
            product_id="XM5",
            title="Sony WH-1000XM5",
            brand="Sony",
            model="WH-1000XM5",
        )
        received = Product(
            title="Sony WH-1000XM4",
            brand="Sony",
            model="WH-1000XM4",
        )
        catalog = [
            Product(product_id="XM5-CAT", title="Sony WH-1000XM5", brand="Sony", model="WH-1000XM5"),
            Product(product_id="XM4-CAT", title="Sony WH-1000XM4", brand="Sony", model="WH-1000XM4"),
        ]
        result = build_service().analyze(
            DisputeInput(
                dispute_id="DSP-TEST-006",
                ordered_product=ordered,
                received_product=received,
                catalog=catalog,
            )
        )
        # The top candidate should be XM4 (what was received)
        assert result.candidates[0].product_id == "XM4-CAT"

    def test_evidence_ids_appear_in_comparisons(self):
        ordered = Product(title="Laptop", model="LT-16")
        received = Product(title="Laptop", model="LT-16")
        evidence = [EvidenceItem(evidence_id="EV-999", source="buyer", evidence_type="image")]
        result = build_service().analyze(
            DisputeInput(
                dispute_id="DSP-TEST-007",
                ordered_product=ordered,
                received_product=received,
                evidence=evidence,
            )
        )
        all_comparisons = (
            result.mismatched_attributes
            + result.unverified_attributes
            + [
                type("C", (), {"evidence_ids": result.evidence_references})()
            ]
        )
        # Evidence references should be populated
        assert len(result.evidence_references) == 1
        assert result.evidence_references[0]["evidence_id"] == "EV-999"


# ── Safety guarantee tests ────────────────────────────────────────────────────

class TestSafetyGuarantees:
    def test_requires_human_review_always_true(self):
        """DESIGN GUARANTEE: No automatic financial decision is ever made."""
        scenarios = [
            # Perfect match
            DisputeInput(
                dispute_id="S1",
                ordered_product=Product(title="X", model="M1"),
                received_product=Product(title="X", model="M1"),
            ),
            # Clear mismatch
            DisputeInput(
                dispute_id="S2",
                ordered_product=Product(title="X", model="M1"),
                received_product=Product(title="X", model="M2"),
            ),
            # No received product
            DisputeInput(
                dispute_id="S3",
                ordered_product=Product(title="X", model="M1"),
            ),
        ]
        service = build_service()
        for scenario in scenarios:
            result = service.analyze(scenario)
            assert result.requires_human_review is True, (
                f"requires_human_review was False for dispute {scenario.dispute_id}"
            )
