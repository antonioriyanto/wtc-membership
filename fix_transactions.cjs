const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// There are hardcoded transactions in the CustomerMemberView component fallback
// Let's find and remove them so it relies purely on the actual 'transactions' prop passed from Firestore
content = content.replace(
  /const displayTransactions = transactions\.length > 0 \? transactions \: \[\s*\{\s*id: 'TRX-1',\s*[\s\S]*?\s*\}\s*\];/g,
  `const displayTransactions = transactions.filter(t => t.memberId === member.id);`
);

// If the above doesn't match exactly, let's just forcefully replace any hardcoded transactions logic
content = content.replace(
  /const displayTransactions = [\s\S]*?\} \]/,
  `const displayTransactions = transactions.filter(t => t.memberId === member.id)`
);

// Let's also check for PUR in the UI in case it's still hardcoded somewhere
content = content.replace(
  /member\.membershipId \|\| 'PUR\d+'/g,
  `member.membershipId || member.id`
);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);

