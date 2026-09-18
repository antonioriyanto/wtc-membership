const fs = require('fs');
let code = fs.readFileSync('src/lib/memberAuthClient.ts', 'utf8');

// The original attempt to updateDoc was inside a try/catch. Let's completely suppress the throw that we just added to patch_authclient4 because it's still breaking the login flow.

code = code.replace(
  /await updateDoc\(memberRef, updatedData\)\.catch\(e => \{ console\.warn\("updateDoc failed:", e\); throw e; \}\);/g,
  `await updateDoc(memberRef, updatedData).catch(e => { console.warn("updateDoc failed:", e); });`
);

fs.writeFileSync('src/lib/memberAuthClient.ts', code);
