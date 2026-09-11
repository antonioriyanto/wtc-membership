const fs = require('fs');
let tab = fs.readFileSync('src/components/CashierTab.tsx', 'utf-8');

tab = tab.replace(
  "if (!activeMember || !receiptInput || parsedAmount <= 0) return;",
  "if (!activeMember || !receiptInput || parsedAmount <= 0 || isSubmitting) return;"
);

fs.writeFileSync('src/components/CashierTab.tsx', tab);
console.log('Fixed CashierTab handleAddPointsSubmit double submit');
