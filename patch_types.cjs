const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');
content = content.replace(
  "export type CashierTabType = 'cashier' | 'members' | 'transactions' | 'settings';", 
  "export type CashierTabType = 'cashier' | 'members' | 'transactions' | 'tickets' | 'settings';"
);
fs.writeFileSync('src/types.ts', content);
