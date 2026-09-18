const fs = require('fs');

// 1. Remove unused imports in src/data/mockData.bak.ts
let md = fs.readFileSync('src/data/mockData.bak.ts', 'utf8');
md = md.replace('import { Member, Voucher, StoreBranch, LoyaltyConfig } from \'../types\';', 'import { Member, Voucher } from \'../types\';');
fs.writeFileSync('src/data/mockData.bak.ts', md);

// 2. Remove unused in src/lib/loyalty.test.ts
let lt = fs.readFileSync('src/lib/loyalty.test.ts', 'utf8');
lt = lt.replace('import { calculatePoints, getTierMultiplier, getNextTier } from \'./loyalty\';', 'import { calculatePoints, getNextTier } from \'./loyalty\';');
fs.writeFileSync('src/lib/loyalty.test.ts', lt);

// 3. Remove unused in src/lib/memberAuthClient.ts
let mac = fs.readFileSync('src/lib/memberAuthClient.ts', 'utf8');
mac = mac.replace('import { signInWithCustomToken } from "firebase/auth";', '');
mac = mac.replace("import { auth } from './firebase';", '');
fs.writeFileSync('src/lib/memberAuthClient.ts', mac);

// 4. Remove unused in src/lib/sync-worker.test.ts
let swt = fs.readFileSync('src/lib/sync-worker.test.ts', 'utf8');
swt = swt.replace(/import { startSyncWorker, runMemberSyncPass, stopSyncWorker } from '\.\/sync-worker';/g, "import { startSyncWorker } from './sync-worker';");
fs.writeFileSync('src/lib/sync-worker.test.ts', swt);

// 5. Remove unused in src/lib/sync-worker.ts
let sw = fs.readFileSync('src/lib/sync-worker.ts', 'utf8');
sw = sw.replace(/export async function startSyncWorker\(isInitial: boolean = false\) \{/g, 'export async function startSyncWorker(_isInitial: boolean = false) {');
fs.writeFileSync('src/lib/sync-worker.ts', sw);

// 6. Remove unused in wipe.ts
let wp = fs.readFileSync('wipe.ts', 'utf8');
wp = wp.replace("import { db, members, stores, vouchers, transactions, campaigns, supportTickets } from './src/db/schema';", "import { db, members, vouchers, transactions, campaigns, supportTickets } from './src/db/schema';");
fs.writeFileSync('wipe.ts', wp);

