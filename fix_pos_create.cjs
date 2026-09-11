const fs = require('fs');
let pos = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

pos = pos.replace(
  "isStoreLocked={true}",
  "isStoreLocked={true}\n        stores={stores}"
);

fs.writeFileSync('src/components/CashierPOSView.tsx', pos);
console.log('Fixed CreateMemberModal stores prop');
