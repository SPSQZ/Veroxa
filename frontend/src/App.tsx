import { useState } from 'react';
import { useDisputes } from './services/disputeStore';
import { Header } from './components/common/Header';
import { ReviewerWorkbench } from './components/review/ReviewerWorkbench';
import { CaseQueue } from './components/review/CaseQueue';
import { BuyerDisputeForm } from './components/intake/BuyerDisputeForm';
import { SellerResponsePortal } from './components/intake/SellerResponsePortal';
import { ListFilter, LayoutDashboard, CheckCircle2 } from 'lucide-react';
import type { DisputeCase } from './types/dispute';

export function App() {
  const {
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
  } = useDisputes();

  const [currentView, setCurrentView] = useState<'reviewer' | 'buyer' | 'seller'>('reviewer');
  const [reviewerSubView, setReviewerSubView] = useState<'workbench' | 'queue'>('workbench');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleConfirm = (caseId: string, reviewerName?: string) => {
    confirmRecommendation(caseId, reviewerName);
    showToast('Decision confirmed: Escrow state transitioned in smart escrow simulation!');
  };

  const handleOverride = (
    caseId: string,
    outcome: any,
    reason: string,
    category: string,
    reviewerName?: string
  ) => {
    overrideDecision(caseId, outcome, reason, category, reviewerName);
    showToast('Human Override Committed: Recorded in immutable case audit trail.');
  };

  const handleRequestEvidence = (
    caseId: string,
    target: 'buyer' | 'seller' | 'both',
    items: string[],
    notes: string,
    reviewerName?: string
  ) => {
    requestMoreEvidence(caseId, target, items, notes, reviewerName);
    showToast(`Evidence request dispatched to ${target.toUpperCase()}; escrow placed in AWAITING_EVIDENCE.`);
  };

  const handleBuyerSubmit = (newCase: DisputeCase) => {
    createDispute(newCase);
    setCurrentView('reviewer');
    setReviewerSubView('workbench');
    showToast(`Dispute ${newCase.id} created & analyzed by semantic matcher!`);
  };

  const handleSellerResponseSubmit = (caseId: string, statement: string) => {
    submitSellerResponse(caseId, statement);
    showToast(`Seller rebuttal recorded for ${caseId}.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* GLOBAL HEADER & SCENARIO TOOLBAR */}
      <Header
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        cases={cases}
        selectedCaseId={selectedCaseId}
        onSelectCase={(id) => {
          selectCase(id);
          if (currentView === 'reviewer') setReviewerSubView('workbench');
        }}
        onReset={() => {
          resetToDefaults();
          showToast('Data reset to original 4 benchmark synthetic scenarios.');
        }}
      />

      {/* TOAST NOTIFICATION BANNER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl border border-indigo-400/40 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* REVIEWER WORKBENCH / QUEUE */}
        {currentView === 'reviewer' && (
          <div className="space-y-6">
            
            {/* Reviewer Sub-navigation Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setReviewerSubView('workbench')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    reviewerSubView === 'workbench'
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Case Inspection Workbench ({activeCase?.id.split('-').pop()})</span>
                </button>

                <button
                  onClick={() => setReviewerSubView('queue')}
                  className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    reviewerSubView === 'queue'
                      ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  <span>Dispute Queue & Metrics ({cases.length})</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Simulated Escrow Engine Online</span>
              </div>
            </div>

            {/* Sub-view Content */}
            {reviewerSubView === 'workbench' ? (
              <ReviewerWorkbench
                dispute={activeCase}
                onConfirm={handleConfirm}
                onOverride={handleOverride}
                onRequestEvidence={handleRequestEvidence}
              />
            ) : (
              <CaseQueue
                cases={cases}
                selectedCaseId={selectedCaseId}
                onSelectCase={(id) => selectCase(id)}
                onOpenWorkbench={() => setReviewerSubView('workbench')}
              />
            )}

          </div>
        )}

        {/* BUYER DISPUTE INTAKE FORM */}
        {currentView === 'buyer' && (
          <BuyerDisputeForm
            onSubmit={handleBuyerSubmit}
            onCancel={() => setCurrentView('reviewer')}
          />
        )}

        {/* SELLER REBUTTAL PORTAL */}
        {currentView === 'seller' && (
          <SellerResponsePortal
            cases={cases}
            selectedCaseId={selectedCaseId}
            onSelectCase={(id) => selectCase(id)}
            onSubmitResponse={handleSellerResponseSubmit}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-400 font-mono">
        Veroxa • Semantic Product-Matching Escrow Bot • Member 3 Frontend & Reviewer Experience Prototype
      </footer>

    </div>
  );
}

export default App;
