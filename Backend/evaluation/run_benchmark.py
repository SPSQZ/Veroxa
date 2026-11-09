"""
Benchmark runner for the Veroxa Semantic Product Matching Engine.

Runs all 30 labelled test cases and reports:
  - Per-case pass/fail and latency
  - Overall fixture agreement (accuracy on labelled cases)
  - False-match rate: cases where MATCH was returned but expected MISMATCH
  - Escalation recall: fraction of review-required cases that were escalated
  - Mean and P95 latency

Usage:
    # With test embedder (no download):
    python evaluation/run_benchmark.py

    # With real BGE model (downloads ~130MB on first run):
    python evaluation/run_benchmark.py --model

NOTE: Synthetic fixture agreement is NOT the same as real-world accuracy.
These are deterministic labelled cases used to verify the engine logic.
Real-world accuracy requires human-labelled dispute data.
"""

import sys
import json
import argparse
import time
from pathlib import Path

# Allow running from Backend/ directory
sys.path.insert(0, str(Path(__file__).parent.parent))

from matching import Product, DisputeInput, MatchingService
from matching.config import MatchingConfig
from matching.embedding_service import HashingEmbedder


# ANSI colors for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"


def load_cases(path: Path) -> list[dict]:
    return json.loads(path.read_text(encoding="utf-8"))


def run_benchmark(use_real_model: bool = False) -> None:
    print(f"\n{BOLD}{'='*65}{RESET}")
    print(f"{BOLD}  Veroxa Semantic Product Matching Engine — Benchmark{RESET}")
    print(f"{BOLD}{'='*65}{RESET}")

    # Initialize service
    if use_real_model:
        print(f"\n{BLUE}Loading BGE model (may download ~130MB on first run)...{RESET}")
        cfg = MatchingConfig(catalog_cache_path=":memory:")
        service = MatchingService(config=cfg)
        print(f"{GREEN}BGE model loaded.{RESET}")
    else:
        print(f"\n{YELLOW}Using HashingEmbedder (test mode — no model download){RESET}")
        cfg = MatchingConfig(enable_embeddings=False, catalog_cache_path=":memory:")
        service = MatchingService(config=cfg, embedder=HashingEmbedder())

    # Load test cases
    cases_path = Path(__file__).parent / "benchmark_cases.json"
    cases = load_cases(cases_path)
    print(f"\nLoaded {len(cases)} benchmark cases from {cases_path.name}\n")

    # Header
    print(f"{'ID':<8} {'Test Name':<45} {'Expected':<25} {'Actual':<25} {'Pass':<6} {'ms'}")
    print("-" * 130)

    rows = []
    for case in cases:
        ordered = Product(**case["ordered"])
        received = Product(**case["received"]) if case.get("received") else None
        dispute = DisputeInput(
            dispute_id=case["id"],
            ordered_product=ordered,
            received_product=received,
        )

        result = service.analyze(dispute)
        passed = result.result == case["expected"]

        status_color = GREEN if passed else RED
        pass_str = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"

        name_truncated = case["name"][:44]
        print(
            f"{case['id']:<8} "
            f"{name_truncated:<45} "
            f"{case['expected']:<25} "
            f"{result.result:<25} "
            f"{pass_str:<15} "
            f"{result.latency_ms:.1f}"
        )

        rows.append({
            "id": case["id"],
            "name": case["name"],
            "expected": case["expected"],
            "actual": result.result,
            "passed": passed,
            "latency_ms": result.latency_ms,
            "requires_human_review": result.requires_human_review,
        })

    # ── Summary metrics ───────────────────────────────────────────────────────
    total = len(rows)
    passed_count = sum(r["passed"] for r in rows)
    accuracy = passed_count / total if total else 0

    # False-match rate: cases where MATCH returned but expected MISMATCH_DETECTED
    false_matches = [
        r for r in rows
        if r["actual"] == "MATCH" and r["expected"] == "MISMATCH_DETECTED"
    ]
    false_match_rate = len(false_matches) / total if total else 0

    # Escalation recall: of cases that SHOULD be reviewed (not MATCH),
    # how many were correctly escalated (not returned as MATCH)?
    should_review = [r for r in rows if r["expected"] != "MATCH"]
    correctly_escalated = [
        r for r in should_review if r["actual"] != "MATCH"
    ]
    escalation_recall = (
        len(correctly_escalated) / len(should_review) if should_review else 1.0
    )

    # Safety check: requires_human_review must always be True
    safety_violations = [r for r in rows if not r["requires_human_review"]]

    latencies = [r["latency_ms"] for r in rows]
    mean_latency = sum(latencies) / len(latencies) if latencies else 0
    latencies_sorted = sorted(latencies)
    p95_idx = int(0.95 * len(latencies_sorted))
    p95_latency = latencies_sorted[min(p95_idx, len(latencies_sorted) - 1)]

    print(f"\n{BOLD}{'='*65}{RESET}")
    print(f"{BOLD}  Results Summary{RESET}")
    print(f"{BOLD}{'='*65}{RESET}")

    acc_color = GREEN if accuracy >= 0.90 else (YELLOW if accuracy >= 0.75 else RED)
    fm_color = GREEN if false_match_rate < 0.05 else RED
    esc_color = GREEN if escalation_recall >= 1.0 else (YELLOW if escalation_recall >= 0.95 else RED)
    safety_color = GREEN if not safety_violations else RED

    print(f"\n  Fixture Agreement:    {acc_color}{accuracy:.1%}{RESET} ({passed_count}/{total})")
    print(f"  False-Match Rate:     {fm_color}{false_match_rate:.1%}{RESET} ({len(false_matches)} cases)")
    print(f"  Escalation Recall:    {esc_color}{escalation_recall:.1%}{RESET} ({len(correctly_escalated)}/{len(should_review)})")
    print(f"  Safety Violations:    {safety_color}{len(safety_violations)}{RESET} (requires_human_review=False)")
    print(f"  Mean Latency:         {mean_latency:.1f} ms")
    print(f"  P95 Latency:          {p95_latency:.1f} ms")

    if false_matches:
        print(f"\n  {RED}False matches (MATCH returned for MISMATCH cases):{RESET}")
        for r in false_matches:
            print(f"    - {r['id']}: {r['name']}")

    if safety_violations:
        print(f"\n  {RED}CRITICAL: requires_human_review=False in:{RESET}")
        for r in safety_violations:
            print(f"    - {r['id']}: {r['name']}")

    print(f"\n  {YELLOW}NOTE: Synthetic fixture agreement ≠ real-world accuracy.{RESET}")
    print(f"  {YELLOW}These cases verify engine logic, not production performance.{RESET}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run Veroxa matching engine benchmark"
    )
    parser.add_argument(
        "--model",
        action="store_true",
        help="Use real BGE embeddings (downloads model on first run)",
    )
    args = parser.parse_args()
    run_benchmark(use_real_model=args.model)
