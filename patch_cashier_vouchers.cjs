const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `        cashierAuthenticated ? (
          <CashierTerminalView 
            members={members} 
            setMembers={setMembers}
            transactions={transactions} 
            setTransactions={setTransactions}
            stores={stores}`;

const replacement = `        cashierAuthenticated ? (
          <CashierTerminalView 
            members={members} 
            setMembers={setMembers}
            transactions={transactions} 
            setTransactions={setTransactions}
            vouchers={vouchers}
            setVouchers={setVouchers}
            stores={stores}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
