import type { EscrowState } from './escrow';

export type DisputeCategory = 
  | 'not_as_described'
  | 'wrong_item'
  | 'missing_parts'
  | 'counterfeit'
  | 'damaged';

export type MatchStatus = 'match' | 'mismatch' | 'unverified' | 'partial';

export interface AttributeComparison {
  name: string;
  listedValue: string;
  receivedValue: string;
  status: MatchStatus;
  confidence: number;
  notes?: string;
}

export type EvidenceType = 'photo' | 'receipt' | 'chat_log' | 'policy_clause' | 'video';

export interface EvidenceItem {
  id: string;
  title: string;
  type: EvidenceType;
  url: string;
  submittedBy: 'buyer' | 'seller' | 'system';
  timestamp: string;
  notes?: string;
  tags?: string[];
  aiAnnotation?: string;
}

export type SuggestedOutcome = 
  | 'REFUND_BUYER'
  | 'RELEASE_SELLER'
  | 'PARTIAL_REFUND'
  | 'REQUEST_MORE_EVIDENCE'
  | 'MANUAL_REVIEW';

export interface PolicyCitation {
  id: string;
  section: string;
  title: string;
  clauseSummary: string;
  relevanceScore: number;
}

export interface AiRecommendation {
  suggestedOutcome: SuggestedOutcome;
  confidenceScore: number; // 0 to 100
  isLowConfidence: boolean;
  semanticSimilarityScore: number; // 0 to 1
  reasoningSummary: string;
  mismatchedAttributes: string[];
  matchedAttributes: string[];
  policyCitations: PolicyCitation[];
  uncertaintyNotes?: string;
  modelVersion: string;
  generatedAt: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: 'buyer' | 'seller' | 'ai_system' | 'reviewer' | 'escrow_system';
  actorName: string;
  action: string;
  description: string;
  fromState?: EscrowState;
  toState?: EscrowState;
  notes?: string;
}

export interface ReviewerDecision {
  outcome: SuggestedOutcome;
  reviewerId: string;
  reviewerName: string;
  decidedAt: string;
  isOverride: boolean;
  overrideReason?: string;
  overrideCategory?: string;
  notes: string;
}

export interface DisputeCase {
  id: string;
  orderId: string;
  orderDate: string;
  escrowAmount: number;
  currency: string;
  itemTitle: string;
  itemSku: string;
  itemCategory: string;
  buyerName: string;
  buyerEmail: string;
  sellerName: string;
  sellerEmail: string;
  category: DisputeCategory;
  buyerStatement: string;
  sellerStatement?: string;
  requestedResolution: string;
  escrowState: EscrowState;
  attributes: AttributeComparison[];
  evidence: EvidenceItem[];
  recommendation: AiRecommendation;
  timeline: TimelineEvent[];
  reviewerDecision?: ReviewerDecision;
}
