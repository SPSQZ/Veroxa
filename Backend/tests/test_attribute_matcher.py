"""
Unit tests for attribute_matcher.py

Run with: pytest tests/test_attribute_matcher.py -v
No model download required — pure Python only.
"""

import pytest
from matching.schemas import Product
from matching.attribute_matcher import compare_products, _values_equal


# ── _values_equal tests ───────────────────────────────────────────────────────

class TestValuesEqual:
    def test_identical_strings(self):
        assert _values_equal("Black", "Black") is True

    def test_case_insensitive(self):
        # normalize_text converts to lowercase
        assert _values_equal("Black", "black") is True

    def test_unicode_normalization(self):
        # Full-width characters should normalize
        assert _values_equal("WH-1000XM5", "WH‑1000XM5") is True

    def test_different_strings(self):
        assert _values_equal("Black", "Silver") is False

    def test_different_numbers(self):
        assert _values_equal(128, 256) is False

    def test_equal_numbers(self):
        assert _values_equal(1, 1) is True

    def test_list_order_independent(self):
        # Accessory lists should match regardless of order
        assert _values_equal(["USB-C cable", "Carrying case"], ["Carrying case", "USB-C cable"]) is True

    def test_list_different_elements(self):
        assert _values_equal(["USB-C cable", "Carrying case"], ["USB-C cable"]) is False

    def test_minor_typo_matches(self):
        # 96% threshold catches minor typos
        assert _values_equal("Blakc", "Black") is True  # 1-char swap

    def test_different_models_no_match(self):
        # WH-1000XM5 vs WH-1000XM4 — clearly different despite similarity
        assert _values_equal("WH-1000XM5", "WH-1000XM4") is False


# ── compare_products tests ────────────────────────────────────────────────────

class TestCompareProducts:
    def test_no_received_returns_empty(self):
        ordered = Product(title="Sony XM5", model="WH-1000XM5")
        comparisons, score, coverage = compare_products(ordered, None)
        assert comparisons == []
        assert score is None
        assert coverage == 0.0

    def test_perfect_match(self):
        ordered = Product(
            title="Sony WH-1000XM5",
            brand="Sony",
            model="WH-1000XM5",
            attributes={"color": "Black", "quantity": 1},
        )
        received = Product(
            title="Sony WH-1000XM5 Wireless Headphones",
            brand="Sony",
            model="WH-1000XM5",
            attributes={"color": "Black", "quantity": 1},
        )
        comparisons, score, coverage = compare_products(ordered, received)
        assert all(c.status == "MATCH" for c in comparisons)
        assert score == 1.0
        assert coverage == 1.0

    def test_model_mismatch_is_critical(self):
        ordered = Product(title="Sony XM5", brand="Sony", model="WH-1000XM5")
        received = Product(title="Sony XM4", brand="Sony", model="WH-1000XM4")
        comparisons, score, coverage = compare_products(ordered, received)
        model_comp = next(c for c in comparisons if c.attribute == "model")
        assert model_comp.status == "MISMATCH"
        assert model_comp.severity == "critical"

    def test_missing_attribute_is_unverified_not_match(self):
        """
        DESIGN PRINCIPLE: missing information is UNVERIFIED, never MATCH.
        A buyer not providing accessory info ≠ accessories present.
        """
        ordered = Product(
            title="Headphones",
            model="XM5",
            attributes={"color": "Black", "accessories": ["Carrying case", "USB-C cable"]},
        )
        received = Product(title="Headphones", model="XM5")  # No attributes
        comparisons, score, coverage = compare_products(ordered, received)
        # color and accessories should be UNVERIFIED (received has neither)
        unverified = [c for c in comparisons if c.status == "UNVERIFIED"]
        assert len(unverified) >= 1
        assert all(c.attribute not in ("model",) for c in unverified)

    def test_sku_mismatch_is_critical(self):
        ordered = Product(title="Camera", sku="CAM-A1")
        received = Product(title="Camera", sku="CAM-A2")
        comparisons, _, _ = compare_products(ordered, received)
        sku_comp = next(c for c in comparisons if c.attribute == "sku")
        assert sku_comp.status == "MISMATCH"
        assert sku_comp.severity == "critical"

    def test_accessory_subset_is_mismatch(self):
        """Receiving fewer accessories than listed is a mismatch."""
        ordered = Product(
            title="Headphones",
            model="XM5",
            attributes={"accessories": ["Carrying case", "USB-C cable", "Audio cable"]},
        )
        received = Product(
            title="Headphones",
            model="XM5",
            attributes={"accessories": ["USB-C cable"]},
        )
        comparisons, _, _ = compare_products(ordered, received)
        acc_comp = next(c for c in comparisons if c.attribute == "accessories")
        assert acc_comp.status == "MISMATCH"

    def test_coverage_calculation(self):
        """Coverage = fraction of attributes that could be compared."""
        ordered = Product(
            title="Phone",
            model="Z",
            attributes={"color": "Black", "storage": "256GB"},
        )
        received = Product(title="Phone", model="Z")
        comparisons, _, coverage = compare_products(ordered, received)
        # model can be compared, color and storage cannot
        verified = sum(1 for c in comparisons if c.status != "UNVERIFIED")
        total = len(comparisons)
        assert coverage == pytest.approx(verified / total)

    def test_evidence_ids_attached_to_comparisons(self):
        ordered = Product(title="Laptop", model="LT-16")
        received = Product(title="Laptop", model="LT-16")
        evidence_ids = ["EV-001", "EV-002"]
        comparisons, _, _ = compare_products(ordered, received, evidence_ids)
        for c in comparisons:
            assert c.evidence_ids == evidence_ids
