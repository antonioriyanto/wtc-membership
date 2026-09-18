const fs = require('fs');

// Patch CashierTerminalView.tsx
const f1 = 'src/components/CashierTerminalView.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(
  "t.receiptNo.trim().toLowerCase() === receiptNo.trim().toLowerCase() &&",
  "(t.receiptNo || '').trim().toLowerCase() === (receiptNo || '').trim().toLowerCase() &&"
);
fs.writeFileSync(f1, c1);

// Patch CashierTab.tsx
const f2 = 'src/components/CashierTab.tsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(
  "return mCleanDigits.includes(cleanDigits) || m.id.toLowerCase() === code.toLowerCase() || m.name.toLowerCase().includes(code.toLowerCase());",
  "return mCleanDigits.includes(cleanDigits) || (m.id || '').toLowerCase() === (code || '').toLowerCase() || (m.name || '').toLowerCase().includes((code || '').toLowerCase());"
);
fs.writeFileSync(f2, c2);

