const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<CashierTerminalView 
            loyaltyConfig={loyaltyConfig}
            members={members} 
            setMembers={setMembers}
            transactions={transactions} 
            setTransactions={setTransactions}
            vouchers={vouchers}
            setVouchers={setVouchers}`;

const replacement = `<CashierTerminalView 
            loyaltyConfig={loyaltyConfig}
            members={members} 
            setMembers={setMembers}
            transactions={transactions} 
            setTransactions={setTransactions}
            vouchers={vouchers}
            setVouchers={setVouchers}
            supportTickets={supportTickets}
            setSupportTickets={setSupportTickets}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
