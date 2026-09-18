const fs = require('fs');
let code = fs.readFileSync('src/lib/syncFirestore.ts', 'utf8');

// In safeSetDoc, if there is a permission error, let's catch it nicely.
code = code.replace(
  /await setDoc\(doc\(db, collectionName, String\(docId\)\), sanitized\);/g,
  `await setDoc(doc(db, collectionName, String(docId)), sanitized).catch(e => {
    console.warn("safeSetDoc ignored error:", e.message);
  });`
);

fs.writeFileSync('src/lib/syncFirestore.ts', code);
