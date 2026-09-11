const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

content = content.replace("members={members}", "members={members}\n        stores={stores}");
fs.writeFileSync('src/components/CashierPOSView.tsx', content);
console.log('Fixed CashierPOSView passing stores');
