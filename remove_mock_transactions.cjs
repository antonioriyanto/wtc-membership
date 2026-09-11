const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// The issue is in the `useMemo` block for `memberTransactions`.
// It has a "2. Default transaction history mapped strictly to provided stores" fallback.

// Let's replace the whole `memberTransactions` definition.
const newMemberTransactions = `  const memberTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];
    
    return transactions
      .filter(t => 
        (member?.id && t.memberId === member.id) || 
        (member?.phone && t.memberPhone === member.phone) || 
        (member?.name && t.memberName === member.name)
      )
      .map(t => {
        let storeDisplayName = 'Watch Club - Branch';
        if (t.type === 'REDEEM' || t.type === 'VOUCHER_DISCOUNT') {
          storeDisplayName = 'Voucher Redeemed';
        } else if (t.storeName) {
          storeDisplayName = t.storeName.startsWith('Watch Club') 
            ? t.storeName 
            : \`Watch Club - \${t.storeName}\`;
        }

        const txDate = t.timestamp 
          ? new Date(t.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-';

        return {
          id: t.receiptNo || t.id,
          date: txDate,
          store: storeDisplayName,
          points: Math.abs(t.pointsDelta),
          type: t.pointsDelta >= 0 ? 'EARN' : 'REDEEM'
        };
      })
      .sort((a, b) => {
        // Sort by date descending assuming id/receiptNo gives chronological order or just rely on timestamp if available
        // To keep it simple, if they come from Firestore they are likely ordered, but let's reverse them to show newest first if they aren't.
        return 0; // The source array should be sorted.
      });
  }, [transactions, member]);`;

const regex = /const memberTransactions = useMemo\(\(\) => \{[\s\S]*?return \[[\s\S]*?\];\n  \}, \[transactions, member, stores\]\);/;

if (content.match(regex)) {
  content = content.replace(regex, newMemberTransactions);
  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
  console.log("memberTransactions patched successfully!");
} else {
  // Try a broader approach
  const regex2 = /const memberTransactions = useMemo\(\(\) => \{[\s\S]*?\/\/ 2\. Default transaction history[\s\S]*?return \[[\s\S]*?\];\n  \}, \[.*?\]\);/;
  if (content.match(regex2)) {
    content = content.replace(regex2, newMemberTransactions);
    fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
    console.log("memberTransactions patched successfully using regex 2!");
  } else {
    console.log("Could not find memberTransactions block.");
  }
}
