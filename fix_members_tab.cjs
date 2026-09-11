const fs = require('fs');
let content = fs.readFileSync('src/components/CashierMembersTab.tsx', 'utf-8');

content = content.replace("await setDoc(doc(db, 'members', updatedMemberData.id), updatedMemberData);", "await setDoc(doc(db, 'members', editingMember.id), { ...editingMember, ...updatedMemberData });");

fs.writeFileSync('src/components/CashierMembersTab.tsx', content);
console.log('Fixed CashierMembersTab id issue');
