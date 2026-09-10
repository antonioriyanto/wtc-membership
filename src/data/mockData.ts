import { Store, Member, Voucher, Transaction, LoyaltyConfig, SupportTicket, Campaign, AuditLog } from '../types';

export const initialLoyaltyConfig: LoyaltyConfig = {
  currencyToPointRatio: 10000,
  tiers: [
    { name: 'BLUE', minPoints: 0, benefits: ['Additional 10% Discount', 'Watch Services Discount', 'Watch Club Sticker Pack'] },
    { name: 'SILVER', minPoints: 5000, benefits: ['Additional 15% Discount', 'Free Battery Replacement', 'Birthday Gift'] },
    { name: 'GOLD', minPoints: 15000, benefits: ['Additional 20% Discount', 'Priority Service', 'Exclusive Event Invites'] }
  ]
};

// Start with empty arrays to prevent frontend from seeding dummy data
export const initialStores: Store[] = [
  {
    id: 'PUR',
    code: 'PUR',
    name: 'Puri Jakarta',
    location: 'Lantai G, Puri Indah Mall',
    type: 'STORE',
    isActive: true
  }
];
export const initialMembers: Member[] = [];
export const initialVouchers: Voucher[] = [];
export const initialTransactions: Transaction[] = [];
export const initialSupportTickets: SupportTicket[] = [];
export const initialCampaigns: Campaign[] = [];
export const initialAuditLogs: AuditLog[] = [];
