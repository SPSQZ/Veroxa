import React from 'react';
import { Shield, Sparkles, RefreshCw, UserCheck, ShoppingBag, Store } from 'lucide-react';
import type { DisputeCase } from '../../types/dispute';

interface HeaderProps {
  currentView: 'reviewer' | 'buyer' | 'seller';
  onViewChange: (view: 'reviewer' | 'buyer' | 'seller') => void;
  cases: DisputeCase[];
  selectedCaseId: string;
  onSelectCase: (id: string) => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  cases,
  selectedCaseId,
  onSelectCase,
  onReset,
}) => {
  const totalLocked = cases.reduce((acc, c) => acc + (c.escrowState === 'HELD' || c.escrowState === 'UNDER_REVIEW' || c.escrowState === 'AWAITING_EVIDENCE' ? c.escrowAmount : 0), 0);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand & Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-sky-400 via-indigo-300 to-emerald-400 bg-clip-text text-transparent">
                VEROXA
              </span>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                Escrow AI Sentinel
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Semantic Product-Matching & Evidence-Led Dispute Resolution
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
          <button
            onClick={() => onViewChange('reviewer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'reviewer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Reviewer Workbench</span>
          </button>

          <button
            onClick={() => onViewChange('buyer')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'buyer'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buyer Dispute Intake</span>
          </button>

          <button
            onClick={() => onViewChange('seller')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              currentView === 'seller'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Seller Response</span>
          </button>
        </div>

        {/* Scenario Switcher Toolbar & Reset */}
        <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-1.5 bg-slate-950/70 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400 text-[11px] hidden lg:inline">Demo Scenario:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => onSelectCase(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer max-w-[180px] truncate"
            >
              {cases.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.id.split('-').pop()} - {c.itemTitle.slice(0, 24)}...
                </option>
              ))}
            </select>
          </div>

          <div className="hidden xl:flex items-center px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
            <span>Escrow Locked: ${totalLocked.toFixed(2)}</span>
          </div>

          <button
            onClick={onReset}
            title="Reset Mock Data to Default Scenarios"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </header>
  );
};
