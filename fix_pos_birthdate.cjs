const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

content = content.replace(
  "birthDate: newMember.birthDate,",
  "birthDate: newMember.birthDate || '',"
);

fs.writeFileSync('src/components/CashierPOSView.tsx', content);
console.log('Fixed birthDate undefined in CashierPOSView');
