"""
Unit tests for confidence.py — the decision engine.

Run with: pytest tests/test_confidence.py -v
No model download required.
"""

import pytest
from matching.schemas import AttributeComparison
from matching.confidence import decide


def make_comparison(
    attribute: str,
    status: str,
    severity: str = "minor",
) -> AttributeComparison:
    return AttributeComparison(
        attribute=attribute,
        expected="X",
        observed="Y" if status == "MISMATCH" else "X",
        status=status,
        severity=severity,
        explanation=f"Test: {attribute} is {status}",
    )


class TestDecide:
    def test_no_received_product_requests_evidence(self):
        result, rec, review, reasons = decide(
            comparisons=[],
            confidence=0.90,
            coverage=1.0,
            has_received_product=False,
        )
        assert result == "INSUFFICIENT_EVIDENCE"
        assert rec == "REQUEST_EVIDENCE"
        assert review is True

    def test_critical_mismatch_overrides_high_confidence(self):
        """
        CORE TEST: A model mismatch must escalate even when semantic
        similarity is high. High confidence cannot hide a critical conflict.
        """
        comparisons = [
            make_comparison("model", "MISMATCH", "critical"),
            make_comparison("brand", "MATCH"),
            make_comparison("color", "MATCH"),
        ]
        # Pass high confidence — should still be MISMATCH_DETECTED
        result, rec, review, reasons = decide(
            comparisons=comparisons,
            confidence=0.95,  # Very high — but model is mismatched!
            coverage=1.0,
            has_received_product=True,
        )
        assert result == "MISMATCH_DETECTED"
        assert rec == "FLAG_MISMATCH"
        assert review is True

    def test_sku_mismatch_is_critical_override(self):
        comparisons = [
            make_comparison("sku", "MISMATCH", "critical"),
            make_comparison("brand", "MATCH"),
        ]
        result, rec, _, _ = decide(
            comparisons=comparisons,
            confidence=0.98,
            coverage=1.0,
            has_received_product=True,
        )
        assert result == "MISMATCH_DETECTED"
        assert rec == "FLAG_MISMATCH"

    def test_major_mismatch_flags_dispute(self):
        comparisons = [
            make_comparison("brand", "MISMATCH", "major"),
            make_comparison("model", "MATCH", "informational"),
        ]
        result, rec, _, _ = decide(
            comparisons=comparisons,
            confidence=0.72,
            coverage=1.0,
            has_received_product=True,
        )
        assert result == "MISMATCH_DETECTED"
        assert rec == "FLAG_MISMATCH"

    def test_low_confidence_escalates(self):
        comparisons = [
            make_comparison("brand", "MATCH"),
            make_comparison("color", "MATCH"),
        ]
        result, rec, review, reasons = decide(
            comparisons=comparisons,
            confidence=0.60,  # Below medium threshold (0.70)
            coverage=0.80,
            has_received_product=True,
        )
        assert result == "MANUAL_REVIEW"
        assert rec == "ESCALATE"
        assert review is True

    def test_conflicting_evidence_escalates(self):
        comparisons = [make_comparison("model", "MATCH")]
        result, rec, _, _ = decide(
            comparisons=comparisons,
            confidence=0.90,
            coverage=1.0,
            has_received_product=True,
            has_conflicting_evidence=True,
        )
        assert result == "MANUAL_REVIEW"
        assert rec == "ESCALATE"

    def test_high_confidence_full_coverage_matches(self):
        comparisons = [
            make_comparison("model", "MATCH", "informational"),
            make_comparison("brand", "MATCH", "informational"),
            make_comparison("color", "MATCH", "informational"),
        ]
        result, rec, review, _ = decide(
            comparisons=comparisons,
            confidence=0.92,  # Above high threshold (0.85)
            coverage=1.0,
            has_received_product=True,
        )
        assert result == "MATCH"
        assert rec == "DRAFT_MATCH"
        assert review is True  # Always True — human must confirm

    def test_medium_confidence_manual_review(self):
        comparisons = [make_comparison("color", "MATCH")]
        result, rec, _, _ = decide(
            comparisons=comparisons,
            confidence=0.75,  # Between medium (0.70) and high (0.85)
            coverage=0.90,
            has_received_product=True,
        )
        assert result == "MANUAL_REVIEW"

    def test_low_coverage_manual_review(self):
        comparisons = [
            make_comparison("color", "MATCH"),
            make_comparison("model", "UNVERIFIED"),
            make_comparison("brand", "UNVERIFIED"),
        ]
        result, rec, _, _ = decide(
            comparisons=comparisons,
            confidence=0.90,  # High confidence...
            coverage=0.33,    # ...but low coverage
            has_received_product=True,
        )
        assert result == "MANUAL_REVIEW"

    def test_requires_human_review_always_true(self):
        """DESIGN GUARANTEE: requires_human_review must always be True."""
        for confidence in [0.0, 0.5, 0.75, 0.90, 1.0]:
            _, _, review, _ = decide(
                comparisons=[],
                confidence=confidence,
                coverage=1.0,
                has_received_product=True,
            )
            assert review is True, f"review was False at confidence={confidence}"
