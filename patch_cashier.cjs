const fs = require('fs');
let code = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

code = code.replace(
  /if \(\(!response\.ok && !result\?\.isFallback\) \|\| !result\?\.success\) \{\s*throw new Error\(result\?\.error \|\| 'Gagal menambahkan poin melalui backend server'\);\s*\}/g,
  `if (!response.ok && !rawText.includes('<html') && !rawText.includes('<!doctype html>')) {
          let errMsg = 'Gagal menambahkan poin melalui backend server';
          try {
             const parsed = JSON.parse(rawText);
             if (parsed.error) errMsg = parsed.error;
          } catch(e) {}
          throw new Error(errMsg);
        }
        
        if (result && result.success === false) {
          throw new Error(result.error || 'Gagal menambahkan poin melalui backend server');
        }`
);

code = code.replace(
  /updatedMember = \{\s*\.\.\.member,\s*points: result\.data\.newPoints,\s*tier: result\.data\.newTier,\s*\};/g,
  `updatedMember = {
          ...member,
          points: result.isFallback ? (member.points || 0) + result.data.calculatedPoints : result.data.newPoints,
          tier: result.isFallback ? member.tier : result.data.newTier,
        };`
);

fs.writeFileSync('src/components/CashierTerminalView.tsx', code);
