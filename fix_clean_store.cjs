const fs = require('fs');
let code = fs.readFileSync('src/lib/syncFirestore.ts', 'utf8');

code = code.replace(
  /const isValidImage = \(img: any\): boolean => \{\n    return typeof img === 'string' && img\.startsWith\('http'\) && img\.length > 15;\n  \};/g,
  `const isValidImage = (img: any): boolean => {
    return typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:image')) && img.length > 15;
  };`
);

code = code.replace(
  /const isOfficialBranch = fallback && fallback\.id !== 'CUSTOM';/g,
  `const isOfficialBranch = false; // ALLOW DB EDITS TO OVERRIDE MOCK DATA`
);

fs.writeFileSync('src/lib/syncFirestore.ts', code);
