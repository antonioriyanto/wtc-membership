const fs = require('fs');
let code = fs.readFileSync('src/lib/memberAuthClient.ts', 'utf8');

code = code.replace(
  /await updateDoc\(memberRef, updatedData\);/g,
  `await updateDoc(memberRef, updatedData).catch(e => { console.warn("updateDoc failed:", e); throw e; });`
);

fs.writeFileSync('src/lib/memberAuthClient.ts', code);
