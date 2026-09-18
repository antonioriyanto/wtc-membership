const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  /newPoints: calculatedPoints,[\s]*newTier: calculateTier\(calculatedPoints\),/g,
  `newPoints: calculatedPoints,
          newTier: calculateTier(calculatedPoints),`
); // Actually it's fine, the frontend now handles it using `result.isFallback ? ... : result.data.newPoints`

fs.writeFileSync('server.ts', code);
