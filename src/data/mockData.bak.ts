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
  { id: '23PSC', code: '23PSC', name: '23 Paskal Bandung', location: '23 Paskal Bandung', type: 'STORE', isActive: true, phone: '-' },
  { id: '23SMG', code: '23SMG', name: '23 Semarang', location: '23 Semarang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'AMSC', code: 'AMSC', name: 'AEON Sentul', location: 'AEON Sentul', type: 'STORE', isActive: true, phone: '-' },
  { id: 'ALIAN', code: 'ALIAN', name: 'Alianyang Singkawang', location: 'Alianyang Singkawang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'AMB', code: 'AMB', name: 'Ambarukmo Plaza Jogja', location: 'Ambarukmo Plaza Jogja', type: 'STORE', isActive: true, phone: '-' },
  { id: 'AYANI', code: 'AYANI', name: 'Ayani Pontianak', location: 'Ayani Pontianak', type: 'STORE', isActive: true, phone: '-' },
  { id: 'BIG', code: 'BIG', name: 'BIG Mall Samarinda', location: 'BIG Mall Samarinda', type: 'STORE', isActive: true, phone: '-' },
  { id: 'BOS', code: 'BOS', name: 'Bogor Botani', location: 'Bogor Botani', type: 'STORE', isActive: true, phone: '-' },
  { id: 'CCM', code: 'CCM', name: 'Cibinong City Mall', location: 'Cibinong City Mall', type: 'STORE', isActive: true, phone: '-' },
  { id: 'CL', code: 'CL', name: 'Ciputra Semarang', location: 'Ciputra Semarang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'DPM', code: 'DPM', name: 'DP Mall Semarang', location: 'DP Mall Semarang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'DTM1', code: 'DTM1', name: 'Duta Mall 1 Banjarmasin', location: 'Duta Mall 1 Banjarmasin', type: 'STORE', isActive: true, phone: '-' },
  { id: 'DTM2', code: 'DTM2', name: 'Duta Mall 2 Banjarmasin', location: 'Duta Mall 2 Banjarmasin', type: 'STORE', isActive: true, phone: '-' },
  { id: 'EWALK', code: 'EWALK', name: 'E-Walk Balikpapan', location: 'E-Walk Balikpapan', type: 'STORE', isActive: true, phone: '-' },
  { id: 'GAIA', code: 'GAIA', name: 'Gaia Pontianak', location: 'Gaia Pontianak', type: 'STORE', isActive: true, phone: '-' },
  { id: 'GTLO', code: 'GTLO', name: 'Gorontalo', location: 'Gorontalo', type: 'STORE', isActive: true, phone: '-' },
  { id: 'JYP', code: 'JYP', name: 'Jayapura', location: 'Jayapura', type: 'STORE', isActive: true, phone: '-' },
  { id: 'JCM', code: 'JCM', name: 'Jogja City Mall', location: 'Jogja City Mall', type: 'STORE', isActive: true, phone: '-' },
  { id: 'KDI', code: 'KDI', name: 'Kendari', location: 'Kendari', type: 'STORE', isActive: true, phone: '-' },
  { id: 'KOKAS', code: 'KOKAS', name: 'Kota Kasablanka Jakarta', location: 'Kota Kasablanka Jakarta', type: 'STORE', isActive: true, phone: '-' },
  { id: 'LVL21', code: 'LVL21', name: 'Level 21 Bali', location: 'Level 21 Bali', type: 'STORE', isActive: true, phone: '-' },
  { id: 'MOG1', code: 'MOG1', name: 'Mall Olympic Garden 1 Malang', location: 'Mall Olympic Garden 1 Malang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'MOG2', code: 'MOG2', name: 'Mall Olympic Garden 2 Malang', location: 'Mall Olympic Garden 2 Malang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'MANTS', code: 'MANTS', name: 'Manado Town Square', location: 'Manado Town Square', type: 'STORE', isActive: true, phone: '-' },
  { id: 'PMJ', code: 'PMJ', name: 'Pakuwon Mall Yogya', location: 'Pakuwon Mall Yogya', type: 'STORE', isActive: true, phone: '-' },
  { id: 'PALU', code: 'PALU', name: 'Palu', location: 'Palu', type: 'STORE', isActive: true, phone: '-' },
  { id: 'KUKA', code: 'KUKA', name: 'Panakukang', location: 'Panakukang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'PRG', code: 'PRG', name: 'Paragon Semarang', location: 'Paragon Semarang', type: 'STORE', isActive: true, phone: '-' },
  { id: 'PENTA', code: 'PENTA', name: 'Penta City Balikpapan', location: 'Penta City Balikpapan', type: 'STORE', isActive: true, phone: '-' },
  { id: 'PIM', code: 'PIM', name: 'Puri Jakarta', location: 'Puri Jakarta', type: 'STORE', isActive: true, phone: '-' },
  { id: 'SGM', code: 'SGM', name: 'Singkawang Grand Mall', location: 'Singkawang Grand Mall', type: 'STORE', isActive: true, phone: '-' },
  { id: 'SOBAR', code: 'SOBAR', name: 'Solo Baru', location: 'Solo Baru', type: 'STORE', isActive: true, phone: '-' },
  { id: 'SQ', code: 'SQ', name: 'Solo Square', location: 'Solo Square', type: 'STORE', isActive: true, phone: '-' },
  { id: 'SMB', code: 'SMB', name: 'Summarecon Mall Bandung', location: 'Summarecon Mall Bandung', type: 'STORE', isActive: true, phone: '-' },
  { id: 'SWG', code: 'SWG', name: 'The Park Sawangan Depok', location: 'The Park Sawangan Depok', type: 'STORE', isActive: true, phone: '-' },
  { id: 'PARK', code: 'PARK', name: 'The Park Solo', location: 'The Park Solo', type: 'STORE', isActive: true, phone: '-' },
  { id: 'BALI', code: 'BALI', name: 'TSM Bali', location: 'TSM Bali', type: 'STORE', isActive: true, phone: '-' },
  { id: 'TSM', code: 'TSM', name: 'TSM Bandung', location: 'TSM Bandung', type: 'STORE', isActive: true, phone: '-' },
  { id: 'CBB', code: 'CBB', name: 'TSM Cibubur', location: 'TSM Cibubur', type: 'STORE', isActive: true, phone: '-' },
  { id: 'FINE', code: 'FINE', name: 'TSM Makassar', location: 'TSM Makassar', type: 'STORE', isActive: true, phone: '-' },
  { id: 'HO', code: 'HO', name: 'Head Office', location: 'PIK Avenue, Jakarta Utara', type: 'HO', isActive: true, phone: '-' }
];
export const initialMembers: Member[] = [];
export const initialVouchers: Voucher[] = [];
export const initialTransactions: Transaction[] = [];
export const initialSupportTickets: SupportTicket[] = [];
export const initialCampaigns: Campaign[] = [];
export const initialAuditLogs: AuditLog[] = [];
