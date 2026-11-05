import React, { useState } from 'react';
import type { DisputeCase, SuggestedOutcome } from '../../types/dispute';
import { CheckCircle2, ShieldAlert, FileQuestion, X, AlertTriangle } from 'lucide-react';

interface ActionControlsProps {
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

export const ActionControls: React.FC<ActionControlsProps> = ({
  dispute,
  onConfirm,
  onOverride,
  onRequestEvidence,
}) => {
  const [isOverrideOpen, setIsOverrideOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  // Override Form State
  const [overrideOutcome, setOverrideOutcome] = useState<SuggestedOutcome>('RELEASE_SELLER');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideCategory, setOverrideCategory] = useState('Counter-Evidence Accepted');

  // Request Evidence Form State
  const [evidenceTarget, setEvidenceTarget] = useState<'buyer' | 'seller' | 'both'>('buyer');
  const [selectedItems, setSelectedItems] = useState<string[]>([
    'High-resolution macro photo of serial/model tag',
  ]);
  const [requestNotes, setRequestNotes] = useState('');

  const evidenceOptions = [
    'High-resolution macro photo of serial/model tag',
    'Carrier shipping weight receipt & postal label',
    'Unboxing video or uncut packaging footage',
    'Third-party authorized dealer inspection document',
    'Original purchase invoice with matching order timestamp',
  ];

  const handleToggleItem = (item: string) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleConfirmOverride = () => {
    if (!overrideReason.trim()) return;
    onOverride(dispute.id, overrideOutcome, overrideReason, overrideCategory);
    setIsOverrideOpen(false);
    setOverrideReason('');
  };

  const handleConfirmRequest = () => {
    if (selectedItems.length === 0) return;
    onRequestEvidence(dispute.id, evidenceTarget, selectedItems, requestNotes);
    setIsRequestOpen(false);
    setRequestNotes('');
  };

  const isResolved = dispute.escrowState === 'RELEASED' || dispute.escrowState === 'REFUNDED';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        
        <div>
          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <span>Human Reviewer Adjudication Authority</span>
            {isResolved && (
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                CASE RESOLVED
              </span>
            )}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {isResolved
              ? 'Final financial decision recorded in escrow audit log. No further automated actions permitted.'
              : 'The AI proposal is advisory only. Explicit human reviewer approval is required to mutate escrow vault states.'}
          </p>
        </div>

        {/* Action Buttons */}
        {!isResolved && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Request More Evidence */}
            <button
              onClick={() => setIsRequestOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 text-xs font-semibold transition-all shadow-sm"
            >
              <FileQuestion className="w-4 h-4 text-sky-400" />
              <span>Request Evidence</span>
            </button>

            {/* Override Recommendation */}
            <button
              onClick={() => setIsOverrideOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold transition-all shadow-sm"
            >
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Override AI</span>
            </button>

            {/* Confirm Proposal */}
            <button
              onClick={() => onConfirm(dispute.id)}
              className="flex-1 md:flex-none flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/25"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Execute</span>
            </button>
          </div>
        )}

      </div>

      {/* OVERRIDE MODAL */}
      {isOverrideOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  Override AI Recommendation
                </h3>
              </div>
              <button
                onClick={() => setIsOverrideOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  New Adjudication Outcome:
                </label>
                <select
                  value={overrideOutcome}
                  onChange={(e) => setOverrideOutcome(e.target.value as SuggestedOutcome)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="RELEASE_SELLER">Release Escrow to Seller (Deny Claim)</option>
                  <option value="REFUND_BUYER">Refund Buyer Escrow (Approve Claim)</option>
                  <option value="PARTIAL_REFUND">Issue Partial Settlement Refund</option>
                  <option value="REQUEST_MORE_EVIDENCE">Hold for In-Depth Third-Party Audit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Policy Override Justification Category:
                </label>
                <select
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Counter-Evidence Validated">Counter-Evidence Validated</option>
                  <option value="Image Quality Disqualification">Image Quality Disqualification</option>
                  <option value="Seller Return Policy Exemption">Seller Return Policy Exemption</option>
                  <option value="Buyer Abuse History / Pattern Detected">Buyer Abuse History / Pattern Detected</option>
                  <option value="Discretionary Good-Faith Settlement">Discretionary Good-Faith Settlement</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Mandatory Reviewer Audit Justification Note:
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why the AI model recommendation is being superseded. This rationale will be permanently stored in the dispute audit trail..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600 leading-relaxed"
                />
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                <strong>Compliance Notice:</strong> Overriding an AI recommendation logs your reviewer ID and reason into the immutable case history.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsOverrideOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={!overrideReason.trim()}
                  onClick={handleConfirmOverride}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                >
                  Confirm & Commit Override
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST EVIDENCE MODAL */}
      {isRequestOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2 text-sky-400">
                <FileQuestion className="w-5 h-5" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                  Request Additional Evidence
                </h3>
              </div>
              <button
                onClick={() => setIsRequestOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Recipient of Request:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['buyer', 'seller', 'both'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEvidenceTarget(t)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all ${
                        evidenceTarget === t
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Select Required Evidence Items:
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {evidenceOptions.map((item) => (
                    <label
                      key={item}
                      className="flex items-center space-x-2 p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item)}
                        onChange={() => handleToggleItem(item)}
                        className="rounded border-slate-700 text-sky-600 focus:ring-0"
                      />
                      <span className="text-slate-300 text-xs">{item}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Specific Instructions / Deadline:
                </label>
                <textarea
                  rows={2}
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="e.g. Please provide a clear, glare-free photo of the underside serial tag within 48 hours to prevent escrow release..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-sky-500 placeholder-slate-600 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsRequestOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  disabled={selectedItems.length === 0}
                  onClick={handleConfirmRequest}
                  className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                >
                  Issue Evidence Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
