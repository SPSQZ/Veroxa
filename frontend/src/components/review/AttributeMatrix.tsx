import React from 'react';
import type { AttributeComparison } from '../../types/dispute';
import { MatchStatusBadge } from '../common/Badge';
import { Layers, AlertCircle, Info } from 'lucide-react';

interface AttributeMatrixProps {
  attributes: AttributeComparison[];
}

export const AttributeMatrix: React.FC<AttributeMatrixProps> = ({ attributes }) => {
  const mismatchCount = attributes.filter((a) => a.status === 'mismatch').length;
  const matchCount = attributes.filter((a) => a.status === 'match').length;
  const unverifiedCount = attributes.filter((a) => a.status === 'unverified').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Card Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Semantic Attribute Comparison Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Cross-examination of original listing metadata against buyer claimed / received proof
            </p>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400">
            {mismatchCount} Mismatches
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {matchCount} Matches
          </span>
          {unverifiedCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
              {unverifiedCount} Unverified
            </span>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[11px] tracking-wider font-semibold">
              <th className="py-3 px-4 w-1/4">Disputed Attribute</th>
              <th className="py-3 px-4 w-1/4">Original Listing Specification</th>
              <th className="py-3 px-4 w-1/4">Claimed / Received Physical State</th>
              <th className="py-3 px-4 w-1/4 text-right">Verification Signal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-normal">
            {attributes.map((attr, idx) => (
              <tr
                key={idx}
                className={`transition-colors ${
                  attr.status === 'mismatch'
                    ? 'bg-rose-950/15 hover:bg-rose-950/25'
                    : attr.status === 'unverified'
                    ? 'bg-amber-950/15 hover:bg-amber-950/25'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Attribute Name */}
                <td className="py-3.5 px-4 font-semibold text-slate-200">
                  <div className="flex items-center space-x-1.5">
                    {attr.status === 'mismatch' && (
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                    )}
                    <span>{attr.name}</span>
                  </div>
                </td>

                {/* Listed Value */}
                <td className="py-3.5 px-4 text-slate-300">
                  <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-[11px]">
                    {attr.listedValue}
                  </div>
                </td>

                {/* Received Value */}
                <td className="py-3.5 px-4 text-slate-300">
                  <div
                    className={`p-2 rounded-lg border font-mono text-[11px] ${
                      attr.status === 'mismatch'
                        ? 'bg-rose-950/30 border-rose-500/30 text-rose-200 font-semibold'
                        : attr.status === 'unverified'
                        ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    {attr.receivedValue}
                  </div>
                  {attr.notes && (
                    <div className="mt-1.5 flex items-start space-x-1 text-[11px] text-slate-400 italic">
                      <Info className="w-3 h-3 text-slate-500 mt-0.5 flex-shrink-0" />
                      <span>{attr.notes}</span>
                    </div>
                  )}
                </td>

                {/* Signal Badge */}
                <td className="py-3.5 px-4 text-right align-top">
                  <div className="inline-block">
                    <MatchStatusBadge status={attr.status} confidence={attr.confidence} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
