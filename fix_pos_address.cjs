const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

content = content.replace(
  "address: newMember.address",
  "address: newMember.address || ''"
);

fs.writeFileSync('src/components/CashierPOSView.tsx', content);
console.log('Fixed address undefined in CashierPOSView');
