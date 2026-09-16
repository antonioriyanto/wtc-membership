const fs = require('fs');
const lines = fs.readFileSync('src/components/CashierTab.tsx', 'utf8').split('\n');

let inBadBlock = false;
let newLines = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const mCleanDigits = (m.phone || \'\').replace(/[^0-9]/g, \'\');')) {
    newLines.push(lines[i]);
    newLines.push('      return mCleanDigits.includes(cleanDigits) || m.id.toLowerCase() === code.toLowerCase() || m.name.toLowerCase().includes(code.toLowerCase());');
    newLines.push('    });');
    
    // Now skip everything until we hit `      if (found) {`
    inBadBlock = true;
    continue;
  }
  
  if (inBadBlock) {
    // We expect to find `      if (found) {` soon. Wait, no. The scanner modal ends with a `</div>` then `</div>` then `</div>` then `)}`. Let's just look for the first line that is `      if (found) {` ? No, in the original code, after `const found = members.find(...)` it goes directly to `if (found) {`
    if (lines[i].includes('if (found) {')) {
      inBadBlock = false;
      newLines.push(lines[i]);
    }
    continue;
  }
  
  newLines.push(lines[i]);
}

fs.writeFileSync('src/components/CashierTab.tsx', newLines.join('\n'));
