import React, { useState } from 'react';
import type { DisputeCase } from '../../types/dispute';
import { EscrowBadge, OutcomeBadge } from '../common/Badge';
import { Search, ArrowUpRight, DollarSign, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface CaseQueueProps {
  cases: DisputeCase[];
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  onOpenWorkbench: () => void;
}

export const CaseQueue: React.FC<CaseQueueProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onOpenWorkbench,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'under_review' | 'escalated' | 'resolved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCases = cases.filter((c) => {
    // Tab filter
    if (filterTab === 'under_review' && c.escrowState !== 'UNDER_REVIEW' && c.escrowState !== 'HELD') return false;
    if (filterTab === 'escalated' && !c.recommendation.isLowConfidence && c.recommendation.confidenceScore >= 70) return false;
    if (filterTab === 'resolved' && c.escrowState !== 'REFUNDED' && c.escrowState !== 'RELEASED') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.id.toLowerCase().includes(q) ||
        c.itemTitle.toLowerCase().includes(q) ||
        c.buyerName.toLowerCase().includes(q) ||
        c.sellerName.toLowerCase().includes(q) ||
        c.orderId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalEscrow = cases.reduce((acc, c) => acc + c.escrowAmount, 0);
  const escalatedCount = cases.filter((c) => c.recommendation.isLowConfidence || c.recommendation.confidenceScore < 70).length;
  const avgConfidence = Math.round(
    cases.reduce((acc, c) => acc + c.recommendation.confidenceScore, 0) / cases.length
  );

  return (
    <div className="space-y-6">
      
      {/* METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Escrow Under Dispute</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            ${totalEscrow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Protected by smart contract</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Active Disputes</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-100">
            {cases.length} Cases
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Cross-examined by AI sentinel</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Human Escalations</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {escalatedCount} Cases
          </div>
          <span className="text-[10px] text-amber-400/80 font-mono">Requires human intervention</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Average AI Confidence</span>
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-sky-400">
            {avgConfidence}%
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Safety gate active (&ge;70%)</span>
        </div>

      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Tabs */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium w-full md:w-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'all'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Disputes ({cases.length})
          </button>

          <button
            onClick={() => setFilterTab('under_review')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'under_review'
                ? 'bg-indigo-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Under Review
          </button>

          <button
            onClick={() => setFilterTab('escalated')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'escalated'
                ? 'bg-amber-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Escalated / Low Conf ({escalatedCount})
          </button>

          <button
            onClick={() => setFilterTab('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filterTab === 'resolved'
                ? 'bg-emerald-600 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Resolved
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search dispute, SKU, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

      </div>

      {/* DISPUTE QUEUE TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
                <th className="py-3.5 px-4">Case Identifier</th>
                <th className="py-3.5 px-4">Disputed Item & Category</th>
                <th className="py-3.5 px-4">Parties</th>
                <th className="py-3.5 px-4">Escrow Value</th>
                <th className="py-3.5 px-4">State & Proposal</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                const isLow = c.recommendation.isLowConfidence || c.recommendation.confidenceScore < 70;

                return (
                  <tr
                    key={c.id}
                    onClick={() => {
                      onSelectCase(c.id);
                      onOpenWorkbench();
                    }}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-950/30 hover:bg-indigo-950/40'
                        : isLow
                        ? 'bg-amber-950/10 hover:bg-amber-950/20'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Case ID */}
                    <td className="py-4 px-4 font-mono font-bold text-slate-200">
                      <div className="flex items-center space-x-1.5">
                        {isLow && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-pulse" />
                        )}
                        <span>{c.id}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                        Order #{c.orderId}
                      </div>
                    </td>

                    {/* Disputed Item */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="font-semibold text-slate-200 truncate">{c.itemTitle}</div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                        Category: {c.category.replace('_', ' ')}
                      </div>
                    </td>

                    {/* Parties */}
                    <td className="py-4 px-4">
                      <div className="text-slate-300">
                        <strong className="text-sky-400 font-medium">{c.buyerName}</strong>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        vs <strong className="text-emerald-400 font-medium">{c.sellerName}</strong>
                      </div>
                    </td>

                    {/* Escrow Value */}
                    <td className="py-4 px-4 font-mono font-bold text-emerald-400 text-sm">
                      ${c.escrowAmount.toFixed(2)}
                    </td>

                    {/* Escrow State & Recommendation */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <EscrowBadge state={c.escrowState} />
                        <div>
                          <OutcomeBadge outcome={c.recommendation.suggestedOutcome} />
                        </div>
                      </div>
                    </td>

                    {/* Inspect Button */}
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCase(c.id);
                          onOpenWorkbench();
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white font-semibold transition-all border border-indigo-500/30 text-xs shadow-sm"
                      >
                        <span>Inspect</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No disputes match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
