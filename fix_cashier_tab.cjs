const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTab.tsx', 'utf-8');

// Change `points` to `amount` in `onAddPoints` prop signature
content = content.replace(/onAddPoints: \(memberId: string, points: number, receiptNo: string\) => void;/g, 'onAddPoints: (memberId: string, amount: number, receiptNo: string) => void;');

// Change the logic inside `handleAddPointsSubmit`
content = content.replace(/if \(!activeMember \|\| !receiptInput \|\| pointsToGive <= 0\) return;/g, 'if (!activeMember || !receiptInput || parsedAmount <= 0) return;');
content = content.replace(/onAddPoints\(activeMember\.id, pointsToGive, receiptInput\);/g, 'onAddPoints(activeMember.id, parsedAmount, receiptInput);');

fs.writeFileSync('src/components/CashierTab.tsx', content, 'utf-8');
console.log('Fixed CashierTab.tsx');
