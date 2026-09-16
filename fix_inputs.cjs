const fs = require('fs');
let code = fs.readFileSync('src/components/NationalTransactionsTab.tsx', 'utf8');

code = code.replace(
  'value={editingTransaction.receiptNo}',
  'value={editingTransaction.receiptNo || ""}'
);

code = code.replace(
  'value={editingTransaction.amount}',
  'value={editingTransaction.amount || ""}'
);

fs.writeFileSync('src/components/NationalTransactionsTab.tsx', code);
