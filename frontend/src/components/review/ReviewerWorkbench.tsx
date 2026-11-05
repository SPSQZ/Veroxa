import React from 'react';
import type { DisputeCase, SuggestedOutcome } from '../../types/dispute';
import { EscrowBadge } from '../common/Badge';
import { AttributeMatrix } from './AttributeMatrix';
import { EvidenceViewer } from './EvidenceViewer';
import { RecommendationCard } from './RecommendationCard';
import { EscrowTimeline } from './EscrowTimeline';
import { ActionControls } from './ActionControls';
import { User, Store, DollarSign, Calendar, Tag } from 'lucide-react';

interface ReviewerWorkbenchProps {
  dispute: DisputeCase;
  onConfirm: (caseId: string, reviewerName?: string) => void;
  onOverride: (
    caseId: string,
    outcome: SuggestedOutcome,
    reason: string,
    category: string,
    reviewerName?: string
  ) => void;
  onRequestEvidence: (
    caseId: string,
    target: 'buyer' | 'seller' | 'both',
    items: string[],
    notes: string,
    reviewerName?: string
  ) => void;
}

export const ReviewerWorkbench: React.FC<ReviewerWorkbenchProps> = ({
  dispute,
  onConfirm,
  onOverride,
  onRequestEvidence,
}) => {
  return (
    <div className="space-y-6">
      
      {/* CASE METADATA HERO BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 lg:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-800 text-indigo-400 font-bold border border-slate-700">
                {dispute.id}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs font-mono text-slate-400">Order #{dispute.orderId}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-slate-500" />
                {new Date(dispute.orderDate).toLocaleDateString()}
              </span>
              <EscrowBadge state={dispute.escrowState} />
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              {dispute.itemTitle}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Buyer: <strong className="text-slate-200">{dispute.buyerName}</strong></span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1.5">
                <Store className="w-3.5 h-3.5 text-emerald-400" />
                <span>Seller: <strong className="text-slate-200">{dispute.sellerName}</strong></span>
              </div>
              <span className="text-slate-600">|</span>
              <div className="flex items-center space-x-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Category: <strong className="text-slate-200 capitalize">{dispute.category.replace('_', ' ')}</strong></span>
              </div>
            </div>
          </div>

          {/* Escrow Value Box */}
          <div className="flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Locked Escrow Vault</span>
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 flex items-center">
              <DollarSign className="w-6 h-6 -mr-1" />
              {dispute.escrowAmount.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
              Smart Escrow Simulation
            </span>
          </div>

        </div>

        {/* STATEMENTS ROW */}
        <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Buyer Statement */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-sky-400 font-semibold mb-1.5">
              <span className="flex items-center space-x-1">
                <User className="w-3.5 h-3.5" />
                <span>Buyer Claim Narrative</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Requested: {dispute.requestedResolution}</span>
            </div>
            <p className="text-slate-300 leading-relaxed italic">
              "{dispute.buyerStatement}"
            </p>
          </div>

          {/* Seller Statement */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex items-center justify-between text-emerald-400 font-semibold mb-1.5">
              <span className="flex items-center space-x-1">
                <Store className="w-3.5 h-3.5" />
                <span>Seller Rebuttal & Statement</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Response Logged</span>
            </div>
            <p className="text-slate-300 leading-relaxed italic">
              {dispute.sellerStatement ? `"${dispute.sellerStatement}"` : 'No formal statement submitted yet.'}
            </p>
          </div>
        </div>

      </div>

      {/* CORE WORKBENCH SPLIT GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Comparison Matrix & Evidence Dock (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          <AttributeMatrix attributes={dispute.attributes} />
          <EvidenceViewer evidence={dispute.evidence} />
        </div>

        {/* RIGHT COLUMN: AI Proposal Card & Timeline (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          <RecommendationCard recommendation={dispute.recommendation} />
          <EscrowTimeline timeline={dispute.timeline} />
        </div>

      </div>

      {/* HUMAN-IN-THE-LOOP ACTION CONTROLS */}
      <ActionControls
        dispute={dispute}
        onConfirm={onConfirm}
        onOverride={onOverride}
        onRequestEvidence={onRequestEvidence}
      />

    </div>
  );
};
