import { Member, Transaction, SupportTicket, StoreBranch, LoyaltyConfig, Voucher, Campaign, AuditLog } from '../types';

export const initialLoyaltyConfig: any = {
  
  tiers: [
    { name: 'BLUE', minPoints: 0, benefits: ['Additional 10% Discount', 'Watch Services Discount', 'Watch Club Sticker Pack'] },
    { name: 'SILVER', minPoints: 5000, benefits: ['Additional 15% Discount', 'Free Battery Replacement', 'Birthday Gift'] },
    { name: 'GOLD', minPoints: 15000, benefits: ['Additional 20% Discount', 'Priority Service', 'Exclusive Event Invites'] }
  ]
};

// Start with empty arrays to prevent frontend from seeding dummy data
export const initialStores: any[] = [
  { id: 'PUR', code: 'PUR', name: 'Puri Indah Mall Jakarta', location: 'Lantai G, Puri Indah Mall, Jakarta Barat', type: 'STORE', isActive: true, phone: '021-5822765' },
  { id: 'KLP', code: 'KLP', name: 'Kelapa Gading', location: 'Lantai 1, Mall Kelapa Gading, Jakarta Utara', type: 'STORE', isActive: true, phone: '021-4529731' },
  { id: 'SEN', code: 'SEN', name: 'Senayan City', location: 'Lantai 2, Senayan City, Jakarta Pusat', type: 'STORE', isActive: true, phone: '021-72781423' },
  { id: 'KOT', code: 'KOT', name: 'Kota Kasablanka', location: 'Lantai UG, Kota Kasablanka, Jakarta Selatan', type: 'STORE', isActive: true, phone: '021-29465134' },
  { id: 'AEON', code: 'AEON', name: 'AEON BSD', location: 'Lantai G, AEON Mall BSD City, Tangerang', type: 'STORE', isActive: true, phone: '021-29168456' },
  { id: 'GND', code: 'GND', name: 'Grand Indonesia', location: 'Lantai 3, East Mall Grand Indonesia', type: 'STORE', isActive: true, phone: '021-23580456' },
  { id: 'CP', code: 'CP', name: 'Central Park', location: 'Lantai 1, Central Park Mall, Jakarta Barat', type: 'STORE', isActive: true, phone: '021-56985112' },
  { id: 'PIM', code: 'PIM', name: 'Pondok Indah Mall', location: 'Lantai 2, PIM 2, Jakarta Selatan', type: 'STORE', isActive: true, phone: '021-75920334' },
  { id: 'SMG', code: 'SMG', name: 'Paragon Semarang', location: 'Lantai 1, Paragon Mall, Semarang', type: 'STORE', isActive: true, phone: '024-86579221' },
  { id: 'SBY', code: 'SBY', name: 'Tunjungan Plaza', location: 'Lantai 3, Tunjungan Plaza 4, Surabaya', type: 'STORE', isActive: true, phone: '031-5321456' },
  { id: 'BDG', code: 'BDG', name: 'Trans Studio Mall Bandung', location: 'Lantai GF, TSM Bandung', type: 'STORE', isActive: true, phone: '022-8734567' },
  { id: 'MDN', code: 'MDN', name: 'Sun Plaza Medan', location: 'Lantai 1, Sun Plaza, Medan', type: 'STORE', isActive: true, phone: '061-4567890' },
  { id: 'BAL', code: 'BAL', name: 'Beachwalk Bali', location: 'Lantai 1, Beachwalk Shopping Center, Bali', type: 'STORE', isActive: true, phone: '0361-8464888' },
  { id: 'HO', code: 'HO', name: 'Head Office', location: 'PIK Avenue, Jakarta Utara', type: 'HO', isActive: true, phone: '021-5551234' }
];
export const initialMembers: Member[] = [];
export const initialVouchers: Voucher[] = [];
export const initialTransactions: Transaction[] = [];
export const initialSupportTickets: SupportTicket[] = [];
export const initialCampaigns: Campaign[] = [];
export const initialAuditLogs: AuditLog[] = [];
