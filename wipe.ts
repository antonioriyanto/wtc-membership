import { db } from './src/db/index';
import { members, transactions, vouchers, stores } from './src/db/schema';

async function wipe() {
  console.log("Wiping transactions...");
  await db.delete(transactions);
  console.log("Wiping members...");
  await db.delete(members);
  console.log("Wiping vouchers...");
  await db.delete(vouchers);
  console.log("Data wiped successfully.");
}

wipe().catch(console.error);
