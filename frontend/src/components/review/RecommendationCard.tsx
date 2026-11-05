import React from 'react';
import type { AiRecommendation } from '../../types/dispute';
import { OutcomeBadge } from '../common/Badge';
import { Sparkles, AlertTriangle, ShieldCheck, FileText, Cpu, Clock } from 'lucide-react';

interface RecommendationCardProps {
  recommendation: AiRecommendation;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation }) => {
  const {
    suggestedOutcome,
    confidenceScore,
    isLowConfidence,
    semanticSimilarityScore,
    reasoningSummary,
    policyCitations,
    uncertaintyNotes,
    modelVersion,
    generatedAt,
  } = recommendation;

  const getScoreColor = () => {
    if (confidenceScore >= 85) return 'text-emerald-400 bg-emerald-500';
    if (confidenceScore >= 70) return 'text-sky-400 bg-sky-500';
    return 'text-amber-400 bg-amber-500';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 tracking-wider uppercase">
              AI Recommendation & Policy Citations
            </h3>
            <p className="text-xs text-slate-400">
              Evidence-grounded proposal • Model v{modelVersion}
            </p>
          </div>
        </div>

        <OutcomeBadge outcome={suggestedOutcome} />
      </div>

      <div className="p-4 sm:p-5 space-y-4 flex-1">
        
        {/* LOW-CONFIDENCE AMBER / RED ESCALATION WARNING BANNER */}
        {isLowConfidence && (
          <div className="p-4 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-200 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs space-y-1">
              <h4 className="font-bold uppercase tracking-wider text-amber-300">
                Low-Confidence Alert: Manual Review Enforced
              </h4>
              <p className="text-amber-200/90 leading-relaxed">
                Matching confidence ({confidenceScore}%) is below the safety threshold (70%). The system has detected ambiguous or contradictory evidence. Automated settlement recommendation is suspended; a qualified human reviewer must examine the case artifacts.
              </p>
              {uncertaintyNotes && (
                <p className="text-amber-300 font-mono text-[11px] pt-1">
                  <strong>Uncertainty Driver:</strong> {uncertaintyNotes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* METRICS ROW: Confidence Meter + Semantic Score */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          
          {/* Confidence Meter */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Confidence Score</span>
              <span className={`text-base font-extrabold font-mono ${getScoreColor().split(' ')[0]}`}>
                {confidenceScore}%
              </span>
            </div>
            
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getScoreColor().split(' ')[1]}`}
                style={{ width: `${confidenceScore}%` }}
              />
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 font-mono">
              <span>0% Ambiguous</span>
              <span>70% Min Human Gate</span>
              <span>100% Deterministic</span>
            </div>
          </div>

          {/* Semantic Similarity Score */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 font-medium">Listing vs Claim Similarity</span>
              <span className="text-sm font-bold font-mono text-indigo-400">
                {(semanticSimilarityScore * 100).toFixed(0)}% Match
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Cosine similarity vector between listing description and buyer physical discrepancy statements.
            </p>
            <div className="flex items-center space-x-1 text-[10px] text-slate-500 mt-2 font-mono">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              <span>Multi-attribute validation active</span>
            </div>
          </div>

        </div>

        {/* REASONING SUMMARY */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Evidence-Grounded Recommendation Synthesis</span>
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {reasoningSummary}
          </p>
        </div>

        {/* POLICY CITATIONS LIST */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <span>Marketplace Policy Rules Cited</span>
          </h4>

          <div className="space-y-2">
            {policyCitations.map((cite) => (
              <div
                key={cite.id}
                className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-semibold text-indigo-300">
                    {cite.section}: {cite.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {cite.relevanceScore}% Policy Match
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {cite.clauseSummary}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Audit Stamp Footer */}
      <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/50 flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono gap-2">
        <div className="flex items-center space-x-1.5">
          <Cpu className="w-3 h-3 text-slate-400" />
          <span>Engine: {modelVersion}</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>Analyzed: {new Date(generatedAt).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
};
