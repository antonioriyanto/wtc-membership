const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

content = content.replace("cashierName = 'Kasir Puri',", "cashierName,");
content = content.replace("cashierName || `Kasir ${currentStore?.name || 'Puri'}`", "cashierName || `Kasir ${currentStore?.name || 'Aktif'}`");

fs.writeFileSync('src/components/CashierPOSView.tsx', content);
console.log('Fixed CashierPOSView defaults');
