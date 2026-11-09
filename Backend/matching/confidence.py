"""
Confidence engine and decision policy for the matching engine.

This module translates raw scores into a structured verdict with an explicit
escalation decision. The design philosophy:

  1. HARD CONFLICTS override all scores.
     If model or SKU mismatches → MISMATCH_DETECTED, always.
     A 95% semantic similarity score cannot hide a model number conflict.

  2. INSUFFICIENT EVIDENCE is distinct from LOW CONFIDENCE.
     - Insufficient evidence: we can't even compare (no received product,
       or fewer than 50% of attributes verified)
     - Low confidence: we compared but the numbers don't add up

  3. HUMAN REVIEW is the default for uncertainty.
     When in doubt, escalate. Never silently approve.

  4. requires_human_review is structurally always True.
     The engine recommends; it cannot autonomously release or refund funds.
"""

from .schemas import AttributeComparison


def decide(
    comparisons: list[AttributeComparison],
    confidence: float,
    coverage: float,
    has_received_product: bool,
    has_conflicting_evidence: bool = False,
    high_threshold: float = 0.85,
    medium_threshold: float = 0.70,
) -> tuple[str, str, bool, list[str]]:
    """
    Apply the matching decision policy.

    Args:
        comparisons:              Attribute comparison results
        confidence:               Hybrid confidence score [0, 1]
        coverage:                 Fraction of attributes verified [0, 1]
        has_received_product:     Whether received product info was provided
        has_conflicting_evidence: Whether evidence contradicts itself
        high_threshold:           Confidence >= this → MATCH (if coverage ok)
        medium_threshold:         Confidence >= this → medium confidence zone

    Returns:
        (result, recommendation, requires_human_review, reasons)

        result:         "MATCH" | "MISMATCH_DETECTED" | "MANUAL_REVIEW" | "INSUFFICIENT_EVIDENCE"
        recommendation: "DRAFT_MATCH" | "FLAG_MISMATCH" | "ESCALATE" | "REQUEST_EVIDENCE"
        requires_human_review: always True (by design)
        reasons:        list of human-readable explanation strings
    """
    reasons: list[str] = []

    # ── Rule 1: No received product information ───────────────────────────────
    # If we don't know what was received, we can't compare anything.
    if not has_received_product:
        return (
            "INSUFFICIENT_EVIDENCE",
            "REQUEST_EVIDENCE",
            True,
            ["No received product information was provided. Evidence required from buyer."],
        )

    # ── Rule 2: Insufficient attribute coverage ───────────────────────────────
    # If fewer than 50% of attributes could be verified, we don't have enough
    # information to make a meaningful comparison.
    if coverage < 0.50 and not comparisons:
        return (
            "INSUFFICIENT_EVIDENCE",
            "REQUEST_EVIDENCE",
            True,
            [
                f"Only {coverage:.0%} of product attributes could be verified. "
                "Additional product details are required to assess this dispute."
            ],
        )

    # ── Rule 3: HARD CONFLICT — critical attribute mismatch ───────────────────
    # Critical fields (model, SKU) carry definitive dispute weight.
    # A model mismatch means wrong product was sent — full stop.
    # Semantic similarity is irrelevant here.
    critical_mismatches = [
        c for c in comparisons
        if c.status == "MISMATCH" and c.severity == "critical"
    ]
    if critical_mismatches:
        for c in critical_mismatches:
            reasons.append(c.explanation)
        reasons.append(
            "Critical product identifier mismatch detected. "
            "High semantic similarity does not override a model/SKU conflict."
        )
        return "MISMATCH_DETECTED", "FLAG_MISMATCH", True, reasons

    # ── Rule 4: Conflicting evidence ──────────────────────────────────────────
    # Buyer and seller evidence contradict each other.
    # Only a human can resolve contradictions between parties.
    if has_conflicting_evidence:
        return (
            "MANUAL_REVIEW",
            "ESCALATE",
            True,
            ["Evidence from buyer and seller conflict. Human inspection required."],
        )

    # ── Rule 5: Major attribute mismatches ────────────────────────────────────
    # Non-critical but significant mismatches (brand, storage, size, quantity)
    major_mismatches = [
        c for c in comparisons
        if c.status == "MISMATCH" and c.severity == "major"
    ]
    if major_mismatches:
        for c in major_mismatches:
            reasons.append(c.explanation)
        return "MISMATCH_DETECTED", "FLAG_MISMATCH", True, reasons

    # ── Rule 5.5: Any minor attribute mismatches (color, condition, etc.) ────
    # Even a minor mismatch must prevent an automated MATCH verdict.
    minor_mismatches = [
        c for c in comparisons
        if c.status == "MISMATCH"
    ]
    if minor_mismatches:
        for c in minor_mismatches:
            reasons.append(c.explanation)
        return "MANUAL_REVIEW", "ESCALATE", True, reasons

    # ── Rule 6: Low confidence ────────────────────────────────────────────────
    if confidence < medium_threshold:
        reasons.append(
            f"Matching confidence ({confidence:.1%}) is below the review threshold "
            f"({medium_threshold:.0%}). Case routed to human reviewer."
        )
        return "MANUAL_REVIEW", "ESCALATE", True, reasons

    # ── Rule 7: Medium confidence or insufficient coverage ────────────────────
    if confidence < high_threshold or coverage < 0.80:
        reasons.append(
            f"Confidence ({confidence:.1%}) or coverage ({coverage:.0%}) requires "
            "additional reviewer verification."
        )
        return "MANUAL_REVIEW", "ESCALATE", True, reasons

    # ── Rule 8: High confidence match ────────────────────────────────────────
    # All attributes verified, no mismatches, high confidence.
    # Still requires human reviewer sign-off before any financial action.
    reasons.append(
        f"No critical mismatches detected. Confidence: {confidence:.1%}, "
        f"coverage: {coverage:.0%}. Human reviewer approval required before action."
    )
    return "MATCH", "DRAFT_MATCH", True, reasons
