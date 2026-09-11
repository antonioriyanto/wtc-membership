const fs = require('fs');
const file = 'src/components/LoginWall.tsx';
let content = fs.readFileSync(file, 'utf-8');

const target = `const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
        return m.phone === phone || (cleanDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));`;

const replacement = `const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
        return m.phone === phone || (cleanDigits.length >= 4 && mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Login logic fixed!');
} else {
  console.log('Target not found in LoginWall.tsx');
}
