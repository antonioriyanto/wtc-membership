export type TabType = 
  | 'overview'
  | 'stores'
  | 'transactions'
  | 'loyalty'
  | 'vouchers'
  | 'members'
  | 'campaigns'
  | 'support'
  | 'audit';

export type CashierTabType = 'cashier' | 'members' | 'transactions' | 'tickets' | 'settings';

export type MemberTier = 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM';

export interface AuditLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: 'HO_ADMIN' | 'CASHIER' | 'SYSTEM' | 'CUSTOMER';
  action: string;
  details: string;
  module: 'LOYALTY' | 'VOUCHERS' | 'MEMBERS' | 'TRANSACTIONS' | 'SETTINGS' | 'SUPPORT_TICKETS' | 'SECURITY';
  memberId?: string;
  membershipId?: string;
  performedBy?: string;
  role?: 'CUSTOMER' | 'CASHIER' | 'ADMIN' | 'SYSTEM';
  storeId?: string;
  storeName?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface SupportTicket {
  id: string;
  source: 'MEMBER' | 'CASHIER';
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  storeId?: string;
  storeName?: string;
  cashierName?: string;
  subject: string;
  category: 'MISSING_POINTS' | 'VOUCHER_CLAIM' | 'DATA_CORRECTION' | 'CASHIER_HARDWARE' | 'DISPUTE' | 'OTHER';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  receiptNo?: string;
  resolutionNotes?: string;
  adjustmentMade?: {
    pointsDelta: number;
    timestamp: string;
    adminName: string;
    note: string;
  };
  messages: { sender: 'MEMBER' | 'CASHIER' | 'AGENT' | 'SYSTEM'; text: string; timestamp: string }[];
}

export interface Campaign {
  id: string;
  name: string;
  headline?: string;
  type: 'POPUP_BANNER' | 'PUSH' | 'SMS' | 'EMAIL';
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  targetAudience: 'ALL' | 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'INACTIVE';
  content: string;
  bannerImage?: string;
  popupImage?: string;
  badgeText?: string;
  voucherCode?: string;
  startAt?: string;
  endAt?: string;
  scheduledAt?: string;
  sentCount: number;
  openCount?: number;
  clickCount?: number;
  showAsPopupOnApp: boolean;
}

export interface Member {
  id: string;
  membershipId: string;
  name: string;
  phone: string;
  phoneE164?: string;
  email: string;
  pin?: string;
  tier: MemberTier;
  points: number;
  lifetimePoints: number;
  totalSpend: number;
  joinDate: string;
  registeredStore: string;
  lastStoreVisited: string;
  lastVisitDate: string;
  profileImageUrl?: string;
  avatarUrl?: string;
  gender: 'Pria' | 'Wanita';
  birthDate?: string;
  address?: string;
  status: 'ACTIVE' | 'SUSPENDED';

  // Cryptographic Credential & Recovery Attributes
  pinHash?: string;
  pinSalt?: string;
  isPinSet?: boolean;
  failedPinAttempts?: number;
  lockedUntil?: string | null;
  recoveryEmail?: string;
  googleUid?: string;
  linkedAuthUids?: string[];
  forcePinChangeOnNextLogin?: boolean;
  tempPinExpiresAt?: string | null;
}

export interface StoreBranch {
  username?: string;
  latitude?: number;
  longitude?: number;
  distance?: number; // Temporary UI field
  imageUrl?: string;
  id: string;
  code: string;
  name: string;
  mallName: string;
  city: string;
  region: 'Jabodetabek' | 'Jawa Barat' | 'Jawa Tengah & DIY' | 'Jawa Timur' | 'Bali & Nusa Tenggara' | 'Sumatera' | 'Kalimantan' | 'Sulawesi' | 'Papua';
  floorUnit?: string;
  address: string;
  fullAddress?: string;
  phone?: string;
  email: string;
  whatsapp: string;
  waNumber?: string;
  location?: string;
  type?: string;
  isActive?: boolean;
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
  goldMultiplier: number;
  platinumMultiplier: number;
  pointsExpiryDays: number;
  birthdayBonusMultiplier: number;
  enableWhatsAppNotifications: boolean;
  enableStrictVoucherSingleUse: boolean;
  enableCashierManualOverride: boolean;
}
