const fs = require('fs');
let code = fs.readFileSync('src/lib/memberAuthClient.ts', 'utf8');

// The original attempt to updateDoc was inside a try/catch. Let's make sure that if the catch block executes, it doesn't throw a fatal error. 
code = code.replace(
  /try \{\n    await updateDoc\(memberRef, updatedData\)\.catch\(e => \{ console\.warn\("updateDoc failed:", e\); throw e; \}\);\n  \} catch \(err\) \{\n    console\.warn\('Failed to update member in Firestore \(rules restriction\):', err\);\n    try \{\n      await safeSetDoc\('members', member\.id, updatedData\);\n    \} catch\(err2\) \{\n       console\.warn\('safeSetDoc also failed:', err2\);\n    \}\n  \}/g,
  `await updateDoc(memberRef, updatedData).catch(async (err) => {
    console.warn('Failed to update member in Firestore (rules restriction):', err);
    try {
      await safeSetDoc('members', member.id, updatedData);
    } catch(err2) {
       console.warn('safeSetDoc also failed:', err2);
    }
  });`
);

fs.writeFileSync('src/lib/memberAuthClient.ts', code);
