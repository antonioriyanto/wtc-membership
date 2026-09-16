const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `          <CashierTerminalView 
            members={members} 
            setMembers={setMembers}`;

const replacement = `          <CashierTerminalView 
            loyaltyConfig={loyaltyConfig}
            members={members} 
            setMembers={setMembers}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
