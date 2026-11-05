import React from 'react';
import type { EscrowState } from '../../types/escrow';
import { ESCROW_STATE_CONFIGS } from '../../types/escrow';
import type { MatchStatus, SuggestedOutcome } from '../../types/dispute';
import { Lock, FileQuestion, SearchCheck, Truck, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';

interface EscrowBadgeProps {
  state: EscrowState;
  className?: string;
}

export const EscrowBadge: React.FC<EscrowBadgeProps> = ({ state, className = '' }) => {
  const config = ESCROW_STATE_CONFIGS[state] || ESCROW_STATE_CONFIGS.UNDER_REVIEW;
  
  const getIcon = () => {
    switch (state) {
      case 'HELD': return <Lock className="w-3.5 h-3.5 mr-1.5" />;
      case 'AWAITING_EVIDENCE': return <FileQuestion className="w-3.5 h-3.5 mr-1.5" />;
      case 'UNDER_REVIEW': return <SearchCheck className="w-3.5 h-3.5 mr-1.5" />;
      case 'RETURN_IN_PROGRESS': return <Truck className="w-3.5 h-3.5 mr-1.5" />;
      case 'RELEASED': return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />;
      case 'REFUNDED': return <RotateCcw className="w-3.5 h-3.5 mr-1.5" />;
      default: return <Lock className="w-3.5 h-3.5 mr-1.5" />;
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide border ${config.badgeClass} ${className}`}>
      {getIcon()}
      {config.label}
    </span>
  );
};

export const MatchStatusBadge: React.FC<{ status: MatchStatus; confidence?: number }> = ({ status, confidence }) => {
  switch (status) {
    case 'match':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" />
          MATCH {confidence ? `(${confidence}%)` : ''}
        </span>
      );
    case 'mismatch':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
          <AlertTriangle className="w-3 h-3 mr-1 text-rose-400" />
          MISMATCH {confidence ? `(${confidence}%)` : ''}
        </span>
      );
    case 'unverified':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <HelpCircle className="w-3 h-3 mr-1 text-amber-400" />
          UNVERIFIED
        </span>
      );
    case 'partial':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-500/10 text-sky-400 border border-sky-500/30">
          PARTIAL
        </span>
      );
  }
};

export const OutcomeBadge: React.FC<{ outcome: SuggestedOutcome }> = ({ outcome }) => {
  switch (outcome) {
    case 'REFUND_BUYER':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-rose-500/15 text-rose-300 border border-rose-500/40">
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          PROPOSAL: REFUND BUYER
        </span>
      );
    case 'RELEASE_SELLER':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
          PROPOSAL: RELEASE ESCROW TO SELLER
        </span>
      );
    case 'PARTIAL_REFUND':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-sky-500/15 text-sky-300 border border-sky-500/40">
          PROPOSAL: PARTIAL REFUND / ACCESSORY SETTLEMENT
        </span>
      );
    case 'MANUAL_REVIEW':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />
          HUMAN REVIEW REQUIRED
        </span>
      );
    case 'REQUEST_MORE_EVIDENCE':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold tracking-wide bg-purple-500/15 text-purple-300 border border-purple-500/40">
          PROPOSAL: REQUEST MORE EVIDENCE
        </span>
      );
  }
};
