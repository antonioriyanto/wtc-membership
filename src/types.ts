export type TabType = 
  | 'overview'
  | 'stores'
  | 'loyalty'
  | 'vouchers'
  | 'members'
  | 'audit'
  | 'campaigns'
  | 'support';

export type CashierTabType = 'cashier' | 'members' | 'transactions' | 'settings';

export type MemberTier = 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'BLACK';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: 'HO_ADMIN' | 'CASHIER' | 'SYSTEM';
  action: string;
  details: string;
  module: 'LOYALTY' | 'VOUCHERS' | 'MEMBERS' | 'TRANSACTIONS' | 'SETTINGS';
}

export interface SupportTicket {
  id: string;
  memberId: string;
  memberName: string;
  subject: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  messages: { sender: 'MEMBER' | 'AGENT'; text: string; timestamp: string }[];
}

export interface Campaign {
  id: string;
  name: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED';
  targetAudience: 'ALL' | 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'BLACK' | 'INACTIVE';
  content: string;
  scheduledAt?: string;
  sentCount: number;
  openCount?: number;
}

export interface Member {
  id: string;
  membershipId: string;
  name: string;
  phone: string;
  email: string;
  password?: string;
  tier: MemberTier;
  points: number;
  lifetimePoints: number;
  totalSpend: number;
  joinDate: string;
  registeredStore: string;
  lastStoreVisited: string;
  lastVisitDate: string;
  gender: 'Pria' | 'Wanita';
  birthDate?: string;
  address?: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface StoreBranch {
  id: string;
  code: string;
  name: string;
  mallName: string;
  city: string;
  region: 'Jabodetabek' | 'Jawa Barat' | 'Jawa Tengah & DIY' | 'Jawa Timur' | 'Bali & Nusa Tenggara' | 'Sumatera' | 'Kalimantan' | 'Sulawesi' | 'Papua';
  address: string;
  email: string;
  whatsapp: string;
  managerName: string;
  cashierCount: number;
  status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
  todayTransactions: number;
  todayRevenue: number;
  todayPointsIssued: number;
  activePromosCount: number;
  stock?: Record<string, number>;
  skus?: Record<string, string[]>;
  image?: string;
  operatingHours?: string;
  description?: string;
}

export interface Transaction {
  id: string;
  receiptNo: string;
  memberId: string;
  memberName: string;
  memberPhone: string;
  memberEmail?: string;
  storeId: string;
  storeName: string;
  cashierName: string;
  type: 'EARN' | 'REDEEM' | 'MANUAL_ADJUSTMENT' | 'VOUCHER_DISCOUNT';
  amount: number;
  pointsDelta: number;
  voucherCode?: string;
  timestamp: string;
  notes?: string;
}

export interface Voucher {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minPurchase: number;
  validFrom: string;
  validUntil: string;
  scope: 'ALL_STORES' | 'SPECIFIC_STORES';
  applicableStoreIds: string[];
  totalClaimed: number;
  totalUsed: number;
  maxUsageLimit: number;
  status: 'ACTIVE' | 'SCHEDULED' | 'EXPIRED' | 'PAUSED';
  terms: string[];
  imagePath?: string;
}

export interface LoyaltyConfig {
  pointsPerAmount: number; // e.g. 10000 -> 1 pt
  amountUnit: number;
  silverThreshold: number;
  goldThreshold: number;
  platinumThreshold: number;
  diamondThreshold: number;
  blackThreshold: number;
  goldMultiplier: number;
  platinumMultiplier: number;
  diamondMultiplier: number;
  blackMultiplier: number;
  pointsExpiryDays: number;
  birthdayBonusMultiplier: number;
  enableWhatsAppNotifications: boolean;
  enableStrictVoucherSingleUse: boolean;
  enableCashierManualOverride: boolean;
}
