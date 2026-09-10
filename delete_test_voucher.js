import { db } from './src/db/index.ts';
import { vouchers } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function run() {
  await db.delete(vouchers).where(eq(vouchers.code, 'TESTCODE123'));
  console.log("Deleted test voucher");
}
run();
