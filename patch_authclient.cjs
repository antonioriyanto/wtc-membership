const fs = require('fs');
let code = fs.readFileSync('src/lib/memberAuthClient.ts', 'utf8');

code = code.replace(
  /await updateDoc\(memberRef, \{\n        failedPinAttempts: 0,\n        lockedUntil: lockUntilDate\n      \}\)\.catch\(async \(\) => \{\n        \/\/ Fallback safeSetDoc\n        await safeSetDoc\('members', member\.id, \{\n          \.\.\.member,\n          failedPinAttempts: 0,\n          lockedUntil: lockUntilDate\n        \}\);\n      \}\);/g,
  `try {
        await updateDoc(memberRef, {
          failedPinAttempts: 0,
          lockedUntil: lockUntilDate
        });
      } catch (err) {
        console.warn('Failed to lock account in Firestore (rules restriction):', err);
      }`
);

code = code.replace(
  /await updateDoc\(memberRef, \{\n        failedPinAttempts: currentFailures\n      \}\)\.catch\(async \(\) => \{\n        await safeSetDoc\('members', member\.id, \{\n          \.\.\.member,\n          failedPinAttempts: currentFailures\n        \}\);\n      \}\);/g,
  `try {
        await updateDoc(memberRef, {
          failedPinAttempts: currentFailures
        });
      } catch (err) {
        console.warn('Failed to update failed attempts in Firestore (rules restriction):', err);
      }`
);

code = code.replace(
  /await updateDoc\(memberRef, \{\n    failedPinAttempts: 0,\n    lockedUntil: null,\n    lastLoginAt: new Date\(\)\.toISOString\(\)\n  \}\)\.catch\(async \(\) => \{\n    await safeSetDoc\('members', member\.id, \{\n      \.\.\.member,\n      failedPinAttempts: 0,\n      lockedUntil: null,\n      lastLoginAt: new Date\(\)\.toISOString\(\)\n    \}\);\n  \}\);/g,
  `try {
    await updateDoc(memberRef, {
      failedPinAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString()
    });
  } catch (err) {
    console.warn('Failed to clear failed attempts in Firestore (rules restriction):', err);
  }`
);

fs.writeFileSync('src/lib/memberAuthClient.ts', code);
