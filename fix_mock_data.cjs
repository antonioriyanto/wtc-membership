const fs = require('fs');
let mockContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');

mockContent = mockContent.replace(/import \{.*?\} from '\.\.\/types';/, "import { Member, Transaction, SupportTicket, StoreBranch, LoyaltyConfig } from '../types';");
mockContent = mockContent.replace(/currencyToPointRatio: 1000,\s*/, "");

fs.writeFileSync('src/data/mockData.ts', mockContent);

console.log('Fixed mockData');
