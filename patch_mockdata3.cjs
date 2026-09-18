const fs = require('fs');
let md = fs.readFileSync('src/data/mockData.bak.ts', 'utf8');
md = md.replace('import { Member, Transaction, SupportTicket, , Voucher, Campaign, AuditLog } from \'../types\';', 'import { Member, Transaction, SupportTicket, Voucher, Campaign, AuditLog } from \'../types\';');
fs.writeFileSync('src/data/mockData.bak.ts', md);
