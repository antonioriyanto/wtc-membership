const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');
content = content.replace("currentStore: StoreBranch;", "currentStore: StoreBranch;\n  stores: StoreBranch[];");
content = content.replace("currentStore, cashierName, onSignOut", "currentStore, cashierName, onSignOut, stores");
fs.writeFileSync('src/components/CashierPOSView.tsx', content);

let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
appContent = appContent.replace("setTransactions={setTransactions}", "setTransactions={setTransactions}\n            stores={stores}");
fs.writeFileSync('src/App.tsx', appContent);
console.log('Fixed CashierPOSView and App.tsx to pass stores');
