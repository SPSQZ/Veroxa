"""
Veroxa illustrative live-case demo.

Run from the Backend directory after confirming package exports and dependencies.
This is a draft demonstration script based on the reviewed code excerpts.
It uses synthetic product/dispute information only.
"""

from matching.matching_service import MatchingService
from matching.schemas import DisputeInput, Product
from matching.embedder import HashingEmbedder


def main() -> None:
    # Synthetic example only — not a real marketplace dispute.
    service = MatchingService(embedder=HashingEmbedder())

    dispute = DisputeInput(
        buyer_product=Product(
            title="Apple iPhone 13, 128GB, Midnight",
            description="Apple smartphone, 128GB storage, Midnight colour",
        ),
        seller_product=Product(
            title="iPhone 13 128 GB Midnight",
            description="Apple iPhone 13 smartphone with 128GB storage in Midnight",
        ),
    )

    result = service.analyze(dispute)

    print("=== VEROXA SYNTHETIC CASE DEMO ===")
    print("Verdict:", getattr(result, "verdict", "not available"))
    print("Recommendation:", getattr(result, "recommendation", "not available"))
    print("Confidence:", getattr(result, "confidence", "not available"))
    print("Latency:", getattr(result, "latency_ms", "not available"))
    print("Human review required:", getattr(result, "requires_human_review", True))
    print("Evidence references:", getattr(result, "evidence_references", []))


if __name__ == "__main__":
    main()
