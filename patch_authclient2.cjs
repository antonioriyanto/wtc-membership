const fs = require('fs');
let code = fs.readFileSync('src/lib/memberAuthClient.ts', 'utf8');

code = code.replace(
  /await updateDoc\(memberRef, updatedData\)\.catch\(async \(\) => \{\n    await safeSetDoc\('members', member\.id, updatedData\);\n  \}\);/g,
  `try {
    await updateDoc(memberRef, updatedData);
  } catch (err) {
    console.warn('Failed to update member in Firestore (rules restriction):', err);
    try {
      await safeSetDoc('members', member.id, updatedData);
    } catch(err2) {
       console.warn('safeSetDoc also failed:', err2);
    }
  }`
);

fs.writeFileSync('src/lib/memberAuthClient.ts', code);
