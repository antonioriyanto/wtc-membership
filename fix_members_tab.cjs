const fs = require('fs');
let content = fs.readFileSync('src/components/CashierMembersTab.tsx', 'utf-8');

// Remove tier from the payload sent to PUT /api/members/:id
content = content.replace(/tier: editTier,/g, '');

fs.writeFileSync('src/components/CashierMembersTab.tsx', content, 'utf-8');
console.log('Fixed CashierMembersTab.tsx');
