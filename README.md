# Veroxa: Semantic Product-Matching Escrow Bot

[![GitHub branch](https://img.shields.io/badge/branch-main-indigo.svg)](https://github.com/SPSQZ/Veroxa)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6.svg)](https://www.typescriptlang.org/)

An evidence-led assistant and adjudication console that compares buyer dispute claims against original marketplace listings, order facts, photos, messages, and return terms to resolve disputes fairly before an escrow release or refund decision.

> **Golden Design Principle:**  
> *The bot recommends; it does not silently make irreversible financial decisions. Every recommendation links directly back to the evidence and marketplace policy used, requiring authorized human sign-off for smart escrow release.*

---

## Member 3: Frontend & Reviewer Experience Lead

This repository contains the client-side architecture and interactive reviewer experience designed to eliminate cognitive fatigue and provide an **evidence-first review workflow**.

### Key Deliverables Implemented

1. **Reviewer Inspection Workbench (`/review/:caseId`):**
   * **Semantic Attribute Matrix:** Side-by-side comparison of original listing specifications against claimed/received item attributes (Silhouette, SKU, Colorway, Size, Accessories, Condition) with live `MATCH`, `MISMATCH`, and `UNVERIFIED` tags.
   * **Multi-Modal Evidence Dock:** Tabbed viewer featuring:
     * *Visual & OCR Proof:* Zoomable lightbox image viewer with computer-vision anomaly overlays.
     * *Chat Logs:* Authenticated buyer/seller pre-dispute message excerpts.
     * *Marketplace Return Policy:* Direct section-level citations and policy relevance scores.
   * **AI Recommendation & Citations Card:** Advisory verdict banner, dynamic confidence meter, semantic similarity metric, model version audit stamp, and uncertainty drivers.
   * **Chronological Escrow Timeline:** Immutable audit log tracking state transitions from order creation through dispute intake, AI generation, and reviewer actions.
   * **Human-in-the-Loop Adjudication Controls:**
     * `Confirm & Execute`: Adopts AI recommendation and transitions simulated smart escrow states (`HELD`, `UNDER_REVIEW`, `REFUNDED`, `RELEASED`).
     * `Request Evidence`: Dispatches itemized requests to buyer, seller, or both, placing escrow in `AWAITING_EVIDENCE`.
     * `Override AI`: Mandatory modal requiring structured override categories and immutable justification audit notes.

2. **Dispute Queue & Metrics Dashboard (`/review`):**
   * High-level operational metrics: Locked Escrow Value, Active Case Volume, Human Escalations, and Average Confidence.
   * Filterable dispute table (All, Under Review, Escalated / Low Confidence, Resolved) with search by SKU, case ID, or user.

3. **Buyer Dispute Intake Wizard (`/dispute/new`):**
   * Step-by-step submission flow capturing order facts, dispute categories (`Not as described`, `Wrong item`, `Missing parts`, `Counterfeit`, `Damaged`), narrative statements, and drag-and-drop evidence proof.

4. **Seller Rebuttal Portal (`/dispute/:id/respond`):**
   * Dedicated interface for sellers to review buyer accusations, submit counter-statements, and attach warehouse packing records.

5. **Resilience & State Handling:**
   * **Low-Confidence Warning Banner:** Prominent amber/red banner when confidence is below 70% or evidence is contradictory, enforcing human escalation.
   * **Zero-Dependency Mock Data Engine:** 4 pre-configured synthetic cases for live judging demos:
     * `CASE-8091`: Clear Mismatch (Nike Dunk Panda vs. Air Force 1 White — 94% Confidence Refund).
     * `CASE-8092`: Missing Essential Accessory (Sony WH-1000XM5 without travel case — 86% Partial Refund).
     * `CASE-8093`: Ambiguous Dial Authenticity (Vintage Omega Seamaster — 44% Low Confidence, Mandatory Human Escalation).
     * `CASE-8094`: Counterfeit Replica Suspected (Gucci GG Marmont Bag — 89% Zero-Tolerance Refund).

---

## Repository Structure

```text
Veroxa/
├── README.md                      # Project overview and setup instructions
├── .gitattributes
├── LICENSE
└── frontend/                      # Client-side React 18 + Vite + Tailwind v4 application
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tsconfig.app.json
    ├── index.html
    └── src/
        ├── main.tsx               # Application entrypoint
        ├── App.tsx                # Master view router & toast notifications
        ├── index.css              # Tailwind CSS styles
        ├── types/
        │   ├── dispute.ts         # Types for disputes, evidence, AI recommendations
        │   └── escrow.ts          # Simulated escrow states & badge configurations
        ├── services/
        │   ├── mockData.ts        # 4 balanced synthetic benchmark scenarios
        │   └── disputeStore.ts    # Reactive state store with local persistence
        └── components/
            ├── common/
            │   ├── Header.tsx     # Brand banner, view switcher, demo scenario selector
            │   └── Badge.tsx      # Escrow state, match status, and outcome badges
            ├── review/
            │   ├── ReviewerWorkbench.tsx  # Core 3-panel reviewer workspace
            │   ├── CaseQueue.tsx          # Dispute queue and operational metrics
            │   ├── AttributeMatrix.tsx    # Side-by-side spec comparison table
            │   ├── EvidenceViewer.tsx     # Photos, OCR, chat logs, and policy tabs
            │   ├── RecommendationCard.tsx # AI confidence gauge & citations
            │   ├── EscrowTimeline.tsx     # Chronological audit & state change log
            │   └── ActionControls.tsx     # Confirm, Request Evidence, and Override modal
            └── intake/
                ├── BuyerDisputeForm.tsx   # Multi-step dispute intake wizard
                └── SellerResponsePortal.tsx # Seller rebuttal submission interface
```

---

## Quick Start (Local Setup)

### Prerequisites
* **Node.js** (v18+ or v20+)
* **npm** (v9+)

### Installation & Run

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:5173/` (or the URL shown in terminal).

### Production Build
To test the production build:
```bash
npm run build
npm run preview
```

---

## Evaluation Benchmark Coverage

| Metric | Target | Frontend Implementation |
| :--- | :--- | :--- |
| **Evidence Traceability** | 100% | Every recommendation card displays clickable policy citations and matched evidence artifacts. |
| **Human Escalation** | Gate at $<70\%$ | Cases with confidence below 70% (e.g. Case #8093) automatically disable automatic proposals and render an amber escalation alert. |
| **Escrow Auditability** | 100% | All state transitions (`HELD` $\rightarrow$ `REFUNDED` / `RELEASED`) and reviewer overrides require mandatory rationale and are appended to the timeline. |

