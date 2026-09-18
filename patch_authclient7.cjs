const fs = require('fs');
let code = fs.readFileSync('src/lib/memberAuthClient.ts', 'utf8');

// The original attempt to updateDoc was inside a try/catch. Let's make sure that if safeSetDoc fails inside the try block, we also catch it safely.

code = code.replace(
  /await safeSetDoc\('members', member\.id, updatedData\);\n    \} catch\(err2\) \{\n       console\.warn\('safeSetDoc also failed:', err2\);\n    \}/g,
  `await safeSetDoc('members', member.id, updatedData).catch(err2 => {
        console.warn('safeSetDoc also failed:', err2);
      });
    } catch(err3) {
       console.warn('safeSetDoc block threw:', err3);
    }`
);

fs.writeFileSync('src/lib/memberAuthClient.ts', code);
