import { db } from './src/db/index.ts';
import { stores, members, loyaltyConfig } from './src/db/schema.ts';
import { initialStores, initialMembers } from './src/data/mockData.ts';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Seeding stores...');
  for (const store of initialStores) {
    await db.insert(stores).values({
      id: store.id,
      code: store.code,
      name: store.name,
      mallName: store.mallName,
      city: store.city,
      region: store.region,
      address: store.address,
      email: store.email,
      whatsapp: store.whatsapp,
      managerName: store.managerName,
      cashierCount: store.cashierCount,
      status: store.status,
      todayTransactions: 0,
      todayRevenue: 0,
      todayPointsIssued: 0,
      activePromosCount: 0,
      stock: store.stock || {},
      skus: store.skus || {}
    }).onConflictDoNothing();
  }

  console.log('Seeding config...');
  await db.insert(loyaltyConfig).values({
    id: 'config_1',
    pointsPerAmount: 1,
    amountUnit: 10000,
    silverThreshold: 0,
    goldThreshold: 500,
    platinumThreshold: 2000,
    goldMultiplier: '1.5',
    platinumMultiplier: '2.0',
    pointsExpiryDays: 365,
    birthdayBonusMultiplier: '2.0',
    enableWhatsAppNotifications: true,
    enableStrictVoucherSingleUse: true,
    enableCashierManualOverride: true
  }).onConflictDoNothing();

  console.log('Seeding basic members with 0 points...');
  for (const member of initialMembers) {
    await db.insert(members).values({
      membershipId: member.membershipId,
      name: member.name,
      phone: member.phone,
      email: member.email,
      tier: 'SILVER',
      points: 0,
      lifetimePoints: 0,
      totalSpend: 0,
      joinDate: new Date(),
      registeredStore: member.registeredStore,
      gender: member.gender,
      birthDate: new Date(member.birthDate),
      address: member.address,
      status: member.status
    }).onConflictDoNothing();
  }

  console.log('Done!');
  process.exit(0);
}
main().catch(console.error);
