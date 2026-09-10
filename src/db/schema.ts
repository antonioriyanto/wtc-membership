import { pgTable, text, timestamp, integer, uuid, boolean, jsonb, decimal } from "drizzle-orm/pg-core";

export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  membershipId: text('membership_id').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone').notNull().unique(),
  email: text('email'),
  tier: text('tier').default('SILVER').notNull(),
  points: integer('points').default(0).notNull(),
  lifetimePoints: integer('lifetime_points').default(0).notNull(),
  totalSpend: integer('total_spend').default(0).notNull(),
  joinDate: timestamp('join_date').defaultNow().notNull(),
  registeredStore: text('registered_store').notNull(),
  lastStoreVisited: text('last_store_visited'),
  lastVisitDate: timestamp('last_visit_date'),
  gender: text('gender').notNull(),
  birthDate: timestamp('birth_date'),
  address: text('address'),
  status: text('status').default('ACTIVE').notNull(),
  avatarUrl: text('avatar_url')
});

export const stores = pgTable('stores', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  mallName: text('mall_name').notNull(),
  city: text('city').notNull(),
  region: text('region').notNull(),
  address: text('address').notNull(),
  email: text('email'),
  whatsapp: text('whatsapp'),
  managerName: text('manager_name'),
  cashierCount: integer('cashier_count').default(0),
  status: text('status').default('ONLINE').notNull(),
  todayTransactions: integer('today_transactions').default(0),
  todayRevenue: integer('today_revenue').default(0),
  todayPointsIssued: integer('today_points_issued').default(0),
  activePromosCount: integer('active_promos_count').default(0),
  stock: jsonb('stock'),
  skus: jsonb('skus')
});

export const transactions = pgTable('transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  receiptNo: text('receipt_no').notNull().unique(),
  memberId: uuid('member_id').references(() => members.id),
  memberName: text('member_name'),
  memberPhone: text('member_phone'),
  storeId: text('store_id').references(() => stores.id),
  storeName: text('store_name'),
  cashierName: text('cashier_name'),
  type: text('type').notNull(),
  amount: integer('amount').default(0).notNull(),
  pointsDelta: integer('points_delta').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  notes: text('notes')
});

export const vouchers = pgTable('vouchers', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  discountType: text('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(),
  minPurchase: integer('min_purchase').default(0),
  validFrom: timestamp('valid_from').notNull(),
  validUntil: timestamp('valid_until').notNull(),
  scope: text('scope').notNull(),
  applicableStoreIds: jsonb('applicable_store_ids'),
  totalClaimed: integer('total_claimed').default(0),
  totalUsed: integer('total_used').default(0),
  maxUsageLimit: integer('max_usage_limit').default(0),
  status: text('status').default('ACTIVE').notNull(),
  terms: jsonb('terms'),
  imagePath: text('image_path'),
  gradientPath: text('gradient_path')
});

export const loyaltyConfig = pgTable('loyalty_config', {
  id: text('id').primaryKey(),
  pointsPerAmount: integer('points_per_amount').notNull(),
  amountUnit: integer('amount_unit').notNull(),
  silverThreshold: integer('silver_threshold').notNull(),
  goldThreshold: integer('gold_threshold').notNull(),
  platinumThreshold: integer('platinum_threshold').notNull(),
  diamondThreshold: integer('diamond_threshold').default(50000).notNull(),
  blackThreshold: integer('black_threshold').default(100000).notNull(),
  goldMultiplier: decimal('gold_multiplier').notNull(),
  platinumMultiplier: decimal('platinum_multiplier').notNull(),
  diamondMultiplier: decimal('diamond_multiplier').default('2.5').notNull(),
  blackMultiplier: decimal('black_multiplier').default('3.0').notNull(),
  pointsExpiryDays: integer('points_expiry_days').notNull(),
  birthdayBonusMultiplier: decimal('birthday_bonus_multiplier').notNull(),
  enableWhatsAppNotifications: boolean('enable_whatsapp_notifications').default(true),
  enableStrictVoucherSingleUse: boolean('enable_strict_voucher_single_use').default(true),
  enableCashierManualOverride: boolean('enable_cashier_manual_override').default(true)
});

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  actorName: text('actor_name').notNull(),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  module: text('module').notNull()
});

export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  targetAudience: text('target_audience').notNull(),
  content: text('content').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  sentCount: integer('sent_count').default(0),
  openCount: integer('open_count').default(0)
});

export const supportTickets = pgTable('support_tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  memberId: text('member_id').notNull(),
  memberName: text('member_name').notNull(),
  subject: text('subject').notNull(),
  status: text('status').notNull(),
  priority: text('priority').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  messages: jsonb('messages')
});
