const fs = require('fs');
let cashierMembers = fs.readFileSync('src/components/CashierMembersTab.tsx', 'utf-8');
cashierMembers = cashierMembers.replace(/\|\| undefined/g, "|| ''");
fs.writeFileSync('src/components/CashierMembersTab.tsx', cashierMembers);

if (fs.existsSync('src/components/MembersTab.tsx')) {
  let membersTab = fs.readFileSync('src/components/MembersTab.tsx', 'utf-8');
  membersTab = membersTab.replace(/\|\| undefined/g, "|| ''");
  fs.writeFileSync('src/components/MembersTab.tsx', membersTab);
}

console.log('Fixed undefined properties in tabs');
