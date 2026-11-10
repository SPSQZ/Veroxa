# Veroxa — Safety and Limitations Report

## Project overview
Veroxa is a semantic product-matching and escrow-dispute support project. The matching workflow compares product information and produces a structured result intended to support dispute review.

## Safety-oriented design observations
- The matching result includes a human-review requirement. The reviewed code sets `requires_human_review` to `true`, so the automated result should be treated as decision support rather than a final dispute ruling.
- The confidence decision logic considers critical, major and minor mismatches, low confidence, and insufficient evidence.
- Evidence references and a recommendation are included in the structured matching result.

## Known limitations from the code reviewed
1. **Human review remains necessary.** Automated similarity is not proof that two products are identical or that a buyer or seller is at fault.
2. **Conflicting evidence integration needs verification.** The reviewed `MatchingService.analyze()` call does not pass `has_conflicting_evidence` into the confidence decision function. The conflict-handling branch therefore may not be exercised through the main service path.
3. **Configurable weights need alignment.** The reviewed matching service uses fixed hybrid-score weights (semantic 0.35 and attributes 0.65). Confirm that these remain aligned with `MatchingConfig` if configuration values are changed.
4. **Performance claims must come from measured runs.** Do not present latency, accuracy, or benchmark results unless they are generated from a reproducible run and retained with the test environment details.
5. **Audit persistence is not confirmed.** The reviewed code snippets do not establish that audit events are being written to a durable database or log store. The supplied audit JSON is an illustrative template, not evidence of live logging.
6. **Demo dependencies and imports need checking.** The demo script may need import-path or package-export adjustments to match the repository's actual structure.

## Safe use recommendations
- Keep a human reviewer in the loop for every dispute outcome.
- Show the evidence and reasons behind a recommendation.
- Allow reviewers to override automated recommendations and record why.
- Test missing, incomplete, contradictory, and misleading product descriptions.
- Avoid using synthetic test data as if it were real marketplace evidence.
- Do not expose private customer information in demo materials or logs.

## Scope note
This report is based on the code excerpts reviewed for this contribution. It is not a full security audit, legal assessment, or certification of the complete repository. Re-check these statements against the final integrated code before submission.
