import React, { useState } from 'react';
import type { DisputeCase } from '../../types/dispute';
import { Store, User, UploadCloud, CheckCircle2, MessageSquare } from 'lucide-react';

interface SellerResponsePortalProps {
  cases: DisputeCase[];
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  onSubmitResponse: (caseId: string, statement: string) => void;
}

export const SellerResponsePortal: React.FC<SellerResponsePortalProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onSubmitResponse,
}) => {
  const currentCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const [statement, setStatement] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!statement.trim()) return;

    onSubmitResponse(currentCase.id, statement);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setStatement('');
    }, 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Seller Escrow Rebuttal & Evidence Portal
            </h2>
            <p className="text-xs text-slate-400">
              Respond to buyer claims, provide packout proof, or agree to settlement terms before escrow release.
            </p>
          </div>
        </div>

        {/* Case Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">Select Case:</span>
          <select
            value={currentCase.id}
            onChange={(e) => onSelectCase(e.target.value)}
            className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                {c.id} ({c.sellerName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Details & Response Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Buyer Claim Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1.5">
              <User className="w-4 h-4" />
              <span>Buyer's Filed Claim</span>
            </span>
            <span className="text-xs font-mono text-slate-400">Order #{currentCase.orderId}</span>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-200">{currentCase.itemTitle}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Category: <span className="text-indigo-400 font-mono">{currentCase.category}</span>
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 leading-relaxed italic">
            "{currentCase.buyerStatement}"
          </div>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Buyer Requested:</span>
            <span className="font-semibold text-rose-400 font-mono">{currentCase.requestedResolution}</span>
          </div>
        </div>

        {/* Seller Response Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4" />
              <span>Submit Formal Rebuttal</span>
            </span>
            <span className="text-xs font-mono text-slate-500">
              Escrow: ${currentCase.escrowAmount.toFixed(2)}
            </span>
          </div>

          {isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Seller response successfully recorded and added to audit timeline!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Seller Explanation / Counter-Statement:
              </label>
              <textarea
                rows={5}
                required
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                placeholder="Provide your defense, warehouse dispatch logs, or serial records..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500 placeholder-slate-600 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Attach Packing Slip / Proof Photo:
              </label>
              <div className="border border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 bg-slate-950/60 text-center cursor-pointer">
                <UploadCloud className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <span className="text-slate-400 text-xs">Drop warehouse photos here</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold transition-all shadow-lg shadow-emerald-600/20"
            >
              Log Seller Statement to Escrow Case
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
