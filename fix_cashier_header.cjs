const fs = require('fs');
let content = fs.readFileSync('src/components/CashierHeader.tsx', 'utf-8');

// Force cashier name to be the store name if it's a store
const search = `{cashierName ? \`Kasir: \${cashierName.toUpperCase()}\` : 'Kasir Aktif'}`;
const replace = `{storeName ? \`Kasir: \${storeName.toUpperCase()}\` : 'Kasir Aktif'}`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/CashierHeader.tsx', content);
console.log('Fixed CashierHeader name');
