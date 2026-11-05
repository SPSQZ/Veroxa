export type EscrowState = 
  | 'HELD'
  | 'AWAITING_EVIDENCE'
  | 'UNDER_REVIEW'
  | 'RETURN_IN_PROGRESS'
  | 'RELEASED'
  | 'REFUNDED';

export interface EscrowStateConfig {
  label: string;
  badgeClass: string;
  description: string;
  iconName: string;
}

export const ESCROW_STATE_CONFIGS: Record<EscrowState, EscrowStateConfig> = {
  HELD: {
    label: 'Funds Held in Escrow',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Buyer payment is safely locked in smart escrow pending inspection.',
    iconName: 'Lock',
  },
  AWAITING_EVIDENCE: {
    label: 'Awaiting Evidence',
    badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    description: 'Additional documentation or photos requested from buyer or seller.',
    iconName: 'FileQuestion',
  },
  UNDER_REVIEW: {
    label: 'Under Active Review',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    description: 'AI semantic matching completed. Awaiting reviewer verification.',
    iconName: 'SearchCheck',
  },
  RETURN_IN_PROGRESS: {
    label: 'Return in Progress',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Return label issued; escrow held until return delivery is verified.',
    iconName: 'Truck',
  },
  RELEASED: {
    label: 'Funds Released to Seller',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Dispute closed in seller’s favor; payout released.',
    iconName: 'CheckCircle2',
  },
  REFUNDED: {
    label: 'Refund Issued to Buyer',
    badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    description: 'Dispute resolved in buyer’s favor; funds returned from escrow.',
    iconName: 'RotateCcw',
  },
};

