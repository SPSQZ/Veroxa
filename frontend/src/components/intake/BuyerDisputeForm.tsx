import React, { useState } from 'react';
import type { DisputeCase, DisputeCategory } from '../../types/dispute';
import { ShoppingBag, UploadCloud, ArrowRight } from 'lucide-react';

interface BuyerDisputeFormProps {
  onSubmit: (newCase: DisputeCase) => void;
  onCancel: () => void;
}

export const BuyerDisputeForm: React.FC<BuyerDisputeFormProps> = ({ onSubmit, onCancel }) => {
  const [orderId, setOrderId] = useState('ORD-91044');
  const [itemTitle, setItemTitle] = useState('Apple iPad Pro 11-inch M4 256GB Wi-Fi Space Black');
  const [category, setCategory] = useState<DisputeCategory>('not_as_described');
  const [amount, setAmount] = useState('899.00');
  const buyerName = 'Jordan Vance';
  const buyerEmail = 'jordan.vance@techlead.com';
  const sellerName = 'Prime Gadgets Hub';
  const [statement, setStatement] = useState(
    'The listing stated Apple iPad Pro M4 (2024), but upon opening the sealed package and checking Settings > General > About, the serial number reveals it is an iPad Pro 11-inch 3rd Gen (M1 chip from 2021). The screen is standard LCD without OLED tandem display.'
  );
  const [requestedResolution, setRequestedResolution] = useState('Full Refund ($899.00) & Prepaid Return Label');
  const uploadedPhotos = [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newId = `DSP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();

    const createdCase: DisputeCase = {
      id: newId,
      orderId,
      orderDate: now,
      escrowAmount: parseFloat(amount) || 500,
      currency: 'USD',
      itemTitle,
      itemSku: 'APL-IPD-PRO-M4',
      itemCategory: 'Computers & Tablets',
      buyerName,
      buyerEmail,
      sellerName,
      sellerEmail: 'support@gadgetshub.com',
      category,
      buyerStatement: statement,
      requestedResolution,
      escrowState: 'UNDER_REVIEW',
      attributes: [
        {
          name: 'Processor Chipset',
          listedValue: 'Apple M4 SoC (Tandem OLED)',
          receivedValue: 'Apple M1 SoC (Liquid Retina)',
          status: 'mismatch',
          confidence: 97,
          notes: 'Serial verification confirms 3rd Generation iPad Pro rather than M4.',
        },
        {
          name: 'Storage Capacity',
          listedValue: '256 GB',
          receivedValue: '128 GB',
          status: 'mismatch',
          confidence: 94,
        },
        {
          name: 'Enclosure Color',
          listedValue: 'Space Black',
          receivedValue: 'Space Gray',
          status: 'mismatch',
          confidence: 88,
        },
      ],
      evidence: [
        {
          id: `EV-${Date.now()}-1`,
          title: 'Buyer Settings Screen Serial Proof',
          type: 'photo',
          url: uploadedPhotos[0] || 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
          submittedBy: 'buyer',
          timestamp: now,
          tags: ['Serial Proof', 'Settings OCR'],
          notes: 'OCR scan of iPad About screen indicates Model A2377 (M1).',
          aiAnnotation: 'Chip architecture mismatch detected with 97% confidence.',
        },
        {
          id: `EV-${Date.now()}-2`,
          title: 'Marketplace Policy §4.2: Hardware Specification Discrepancy',
          type: 'policy_clause',
          url: '#',
          submittedBy: 'system',
          timestamp: now,
          tags: ['Hardware Policy'],
          notes: 'Significant processor generation downgrade entitles buyer to full escrow reversal upon return.',
        },
      ],
      recommendation: {
        suggestedOutcome: 'REFUND_BUYER',
        confidenceScore: 93,
        isLowConfidence: false,
        semanticSimilarityScore: 0.28,
        reasoningSummary: 'Material specification mismatch: Received item hardware architecture (Apple M1) deviates substantially from the advertised Apple M4. Immediate buyer return authorization and escrow refund recommended.',
        mismatchedAttributes: ['Processor Chipset', 'Storage Capacity', 'Enclosure Color'],
        matchedAttributes: [],
        policyCitations: [
          {
            id: 'POL-402',
            section: 'Section 4.2',
            title: 'Critical Hardware Discrepancies',
            clauseSummary: 'Delivering earlier silicon generations or lower capacity models constitutes non-conforming tender; escrow is returned to buyer.',
            relevanceScore: 96,
          },
        ],
        modelVersion: 'veroxa-semantic-match-v1.4',
        generatedAt: now,
      },
      timeline: [
        {
          id: `TL-${Date.now()}-1`,
          timestamp: now,
          actor: 'escrow_system',
          actorName: 'Escrow Smart Contract',
          action: 'Escrow Locked',
          description: `$${amount} held in escrow vault for Order #${orderId}.`,
          fromState: 'HELD',
          toState: 'HELD',
        },
        {
          id: `TL-${Date.now()}-2`,
          timestamp: now,
          actor: 'buyer',
          actorName: `${buyerName} (Buyer)`,
          action: 'Dispute Submitted',
          description: `Filed dispute under category "${category}". Uploaded serial evidence.`,
          fromState: 'HELD',
          toState: 'UNDER_REVIEW',
        },
        {
          id: `TL-${Date.now()}-3`,
          timestamp: now,
          actor: 'ai_system',
          actorName: 'Veroxa AI Engine',
          action: 'Automated Match Generated',
          description: 'Semantic vector similarity calculated (0.28). Recommended: REFUND_BUYER (93% Confidence).',
        },
      ],
    };

    onSubmit(createdCase);
  };

  return (
    <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
      <div className="flex items-center space-x-3 pb-6 border-b border-slate-800">
        <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold text-slate-100">
            Submit Marketplace Escrow Dispute
          </h2>
          <p className="text-xs text-slate-400">
            Upload your claim and photos. Veroxa's semantic matcher will compare your claim with the seller's original listing.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
        
        {/* ROW 1: Order ID & Amount */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Order Identifier</label>
            <input
              type="text"
              required
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Escrowed Order Value ($ USD)</label>
            <input
              type="number"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

        {/* ROW 2: Listing Item Title */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">Purchased Listing Item Title</label>
          <input
            type="text"
            required
            value={itemTitle}
            onChange={(e) => setItemTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 font-sans"
          />
        </div>

        {/* ROW 3: Category & Remedy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Dispute Classification</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DisputeCategory)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
            >
              <option value="not_as_described">Item Significantly Not as Described</option>
              <option value="wrong_item">Completely Wrong Item / Model Received</option>
              <option value="missing_parts">Missing Essential Parts or Accessories</option>
              <option value="counterfeit">Suspected Counterfeit / Fake Item</option>
              <option value="damaged">Damaged in Transit / Non-Functional</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Requested Escrow Resolution</label>
            <input
              type="text"
              required
              value={requestedResolution}
              onChange={(e) => setRequestedResolution(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        {/* ROW 4: Statement */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Detailed Statement of Discrepancy
          </label>
          <textarea
            rows={4}
            required
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="Explain specifically what is different from what was advertised in the listing..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500 leading-relaxed placeholder-slate-600"
          />
        </div>

        {/* ROW 5: Evidence Upload Dropzone */}
        <div>
          <label className="block text-slate-300 font-semibold mb-1">
            Supporting Evidence & Photos
          </label>
          <div className="border-2 border-dashed border-slate-800 hover:border-sky-500/50 rounded-2xl p-6 bg-slate-950/60 text-center transition-colors cursor-pointer">
            <UploadCloud className="w-8 h-8 text-sky-400 mx-auto mb-2" />
            <p className="text-slate-300 font-medium">Drag & drop photo proofs or click to browse</p>
            <p className="text-slate-500 text-[11px] mt-1">
              Supports JPG, PNG, WEBP (Max 25MB). OCR and visual embedding will analyze tags automatically.
            </p>
          </div>

          {uploadedPhotos.length > 0 && (
            <div className="mt-3 flex items-center space-x-3">
              {uploadedPhotos.map((p, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-700">
                  <img src={p} alt="Upload preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 inset-x-0 bg-slate-950/80 text-[9px] text-center text-sky-400 py-0.5 font-mono">
                    Sample
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-sky-500/25 transition-all"
          >
            <span>Submit Dispute to Escrow Bot</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </form>
    </div>
  );
};
