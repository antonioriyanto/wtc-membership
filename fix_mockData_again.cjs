const fs = require('fs');
let mockContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');

mockContent = mockContent.replace(
  "import { Member, Transaction, SupportTicket, StoreBranch, LoyaltyConfig } from '../types';",
  "import { Member, Transaction, SupportTicket, StoreBranch, LoyaltyConfig, Voucher, Campaign, AuditLog } from '../types';"
);

mockContent = mockContent.replace(
  "export const initialStores: Store[] = [",
  "export const initialStores: StoreBranch[] = ["
);

mockContent = mockContent.replace("currencyToPointRatio: 10000,", "");

fs.writeFileSync('src/data/mockData.ts', mockContent);

console.log('Fixed mockData again');
