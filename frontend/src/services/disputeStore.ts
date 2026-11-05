import { useState, useEffect } from 'react';
import type { DisputeCase, SuggestedOutcome } from '../types/dispute';
import type { EscrowState } from '../types/escrow';
import { INITIAL_DISPUTE_CASES } from './mockData';

const STORAGE_KEY = 'veroxa_disputes_v1';

export function getStoredDisputes(): DisputeCase[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load stored disputes', e);
  }
  return INITIAL_DISPUTE_CASES;
}

export function saveStoredDisputes(cases: DisputeCase[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
  } catch (e) {
    console.error('Failed to persist disputes', e);
  }
}

export function useDisputes() {
  const [cases, setCases] = useState<DisputeCase[]>(() => getStoredDisputes());
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');

  useEffect(() => {
    saveStoredDisputes(cases);
  }, [cases]);

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const selectCase = (id: string) => {
    setSelectedCaseId(id);
  };

  const resetToDefaults = () => {
    setCases(INITIAL_DISPUTE_CASES);
    setSelectedCaseId(INITIAL_DISPUTE_CASES[0].id);
    localStorage.removeItem(STORAGE_KEY);
  };

  const confirmRecommendation = (caseId: string, reviewerName: string = 'Senior Dispute Specialist Sarah') => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        
        const rec = c.recommendation.suggestedOutcome;
        let nextEscrow: EscrowState = 'UNDER_REVIEW';
        if (rec === 'REFUND_BUYER') nextEscrow = 'REFUNDED';
        else if (rec === 'RELEASE_SELLER') nextEscrow = 'RELEASED';
        else if (rec === 'PARTIAL_REFUND') nextEscrow = 'REFUNDED';
        else if (rec === 'REQUEST_MORE_EVIDENCE') nextEscrow = 'AWAITING_EVIDENCE';

        const now = new Date().toISOString();
        const newTimelineEvent = {
          id: `TL-REV-${Date.now()}`,
          timestamp: now,
          actor: 'reviewer' as const,
          actorName: reviewerName,
          action: 'Recommendation Confirmed',
          description: `Reviewer confirmed AI recommendation (${rec}). Escrow state transitioned to ${nextEscrow}.`,
          fromState: c.escrowState,
          toState: nextEscrow,
        };

        return {
          ...c,
          escrowState: nextEscrow,
          reviewerDecision: {
            outcome: rec,
            reviewerId: 'REV-408',
            reviewerName,
            decidedAt: now,
            isOverride: false,
            notes: `Confirmed AI recommendation based on cited evidence.`,
          },
          timeline: [...c.timeline, newTimelineEvent],
        };
      })
    );
  };

  const overrideDecision = (
    caseId: string,
    outcome: SuggestedOutcome,
    reason: string,
    overrideCategory: string,
    reviewerName: string = 'Senior Dispute Specialist Sarah'
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        let nextEscrow: EscrowState = 'UNDER_REVIEW';
        if (outcome === 'REFUND_BUYER') nextEscrow = 'REFUNDED';
        else if (outcome === 'RELEASE_SELLER') nextEscrow = 'RELEASED';
        else if (outcome === 'PARTIAL_REFUND') nextEscrow = 'REFUNDED';
        else if (outcome === 'REQUEST_MORE_EVIDENCE') nextEscrow = 'AWAITING_EVIDENCE';

        const now = new Date().toISOString();
        const newTimelineEvent = {
          id: `TL-OVR-${Date.now()}`,
          timestamp: now,
          actor: 'reviewer' as const,
          actorName: reviewerName,
          action: 'Manual Override Applied',
          description: `Human reviewer overrode AI proposal (${c.recommendation.suggestedOutcome} -> ${outcome}). Category: "${overrideCategory}". Justification: ${reason}`,
          fromState: c.escrowState,
          toState: nextEscrow,
        };

        return {
          ...c,
          escrowState: nextEscrow,
          reviewerDecision: {
            outcome,
            reviewerId: 'REV-408',
            reviewerName,
            decidedAt: now,
            isOverride: true,
            overrideCategory,
            overrideReason: reason,
            notes: reason,
          },
          timeline: [...c.timeline, newTimelineEvent],
        };
      })
    );
  };

  const requestMoreEvidence = (
    caseId: string,
    target: 'buyer' | 'seller' | 'both',
    requestedItems: string[],
    notes: string,
    reviewerName: string = 'Senior Dispute Specialist Sarah'
  ) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;

        const now = new Date().toISOString();
        const newTimelineEvent = {
          id: `TL-REQ-${Date.now()}`,
          timestamp: now,
          actor: 'reviewer' as const,
          actorName: reviewerName,
          action: 'Evidence Requested',
          description: `Reviewer requested additional documentation from ${target.toUpperCase()}: ${requestedItems.join(', ')}. Details: ${notes}`,
          fromState: c.escrowState,
          toState: 'AWAITING_EVIDENCE' as EscrowState,
        };

        return {
          ...c,
          escrowState: 'AWAITING_EVIDENCE',
          timeline: [...c.timeline, newTimelineEvent],
        };
      })
    );
  };

  const createDispute = (newCase: DisputeCase) => {
    setCases((prev) => [newCase, ...prev]);
    setSelectedCaseId(newCase.id);
  };

  const submitSellerResponse = (caseId: string, statement: string) => {
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const now = new Date().toISOString();
        const event = {
          id: `TL-SLR-${Date.now()}`,
          timestamp: now,
          actor: 'seller' as const,
          actorName: `${c.sellerName} (Seller)`,
          action: 'Seller Response Received',
          description: statement,
        };
        return {
          ...c,
          sellerStatement: statement,
          timeline: [...c.timeline, event],
        };
      })
    );
  };

  return {
    cases,
    activeCase,
    selectedCaseId,
    selectCase,
    resetToDefaults,
    confirmRecommendation,
    overrideDecision,
    requestMoreEvidence,
    createDispute,
    submitSellerResponse,
  };
}
