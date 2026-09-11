const fs = require('fs');
const file = 'src/components/CashierTab.tsx';
let content = fs.readFileSync(file, 'utf-8');

const target = `(cleanDigits.length >= 4 && cleanDigits.includes(mCleanDigits))`;
const replacement = `(cleanDigits.length >= 4 && mCleanDigits.length >= 4 && cleanDigits.includes(mCleanDigits))`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Cashier logic fixed!');
} else {
  console.log('Target not found in CashierTab.tsx');
}
