const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');
content = content.replace("  onSwitchPerspective\n}) => {", "  onSwitchPerspective,\n  stores\n}) => {");
fs.writeFileSync('src/components/CashierPOSView.tsx', content);

let modalContent = fs.readFileSync('src/components/CreateMemberModal.tsx', 'utf-8');
modalContent = modalContent.replace("if (!code) { code = storeCodeMap[registeredStore.toLowerCase()] || 'PUR'; }", "if (!code && typeof storeCodeMap !== 'undefined') { code = storeCodeMap[registeredStore.toLowerCase()] || 'PUR'; }");
fs.writeFileSync('src/components/CreateMemberModal.tsx', modalContent);
console.log('Fixed CashierPOSView and CreateMemberModal');
