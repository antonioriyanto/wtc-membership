const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

// I will look for any hardcoded transactions array in the component.
// It seems there's a mock fallback still lingering in the `displayTransactions` logic.

// Let's use regex to find and replace the whole block defining displayTransactions.
const match = content.match(/const displayTransactions = [\s\S]*?(?=(?:const|let|var|return|if|\/\/))/);
if (match) {
  console.log("Found displayTransactions logic:", match[0].substring(0, 100) + '...');
} else {
  console.log("Could not find displayTransactions block.");
}

// Let's just forcefully replace the fallback if it exists.
// We previously did this, but let's make absolutely sure.
const hardcodedSearch = `const displayTransactions = transactions.length > 0 ? transactions : [`;
if (content.includes(hardcodedSearch)) {
  console.log("Found exact hardcoded fallback.");
}

// Just safely replace it using a broader regex
content = content.replace(
  /const displayTransactions = [\s\S]*?\{ id: 'TRX-1'[\s\S]*?\];/g, 
  `const displayTransactions = transactions.filter(t => t.memberId === member.id);`
);

// Another possible fallback format
content = content.replace(
  /const displayTransactions = transactions\.length > 0 \? transactions \: \[\s*\{\s*id: 'TRX-1'[\s\S]*?\}\s*\];/g,
  `const displayTransactions = transactions.filter(t => t.memberId === member.id);`
);

// Let's check for any other mock data
content = content.replace(
  /const recentTransactions = [\s\S]*?\{ id: 'TRX-1'[\s\S]*?\];/g,
  `const recentTransactions = transactions.filter(t => t.memberId === member.id).slice(0, 3);`
);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
console.log('CustomerMemberView patched');

