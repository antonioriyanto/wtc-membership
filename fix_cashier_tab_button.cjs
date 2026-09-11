const fs = require('fs');
let tab = fs.readFileSync('src/components/CashierTab.tsx', 'utf-8');

tab = tab.replace(
  "disabled={!activeMember || !receiptInput || parsedAmount <= 0}",
  "disabled={!activeMember || !receiptInput || parsedAmount <= 0 || isSubmitting}"
);

tab = tab.replace(
  "disabled={!activeMember}",
  "disabled={!activeMember || isSubmitting}"
);

fs.writeFileSync('src/components/CashierTab.tsx', tab);
console.log('Fixed CashierTab buttons');
