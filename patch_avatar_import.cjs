const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

if (!code.includes('safeSetDoc')) {
  // It is already there, but wait, cleanAndEnrichStore is imported, but not safeSetDoc!
  code = code.replace(
    /import \{ cleanAndEnrichStore \} from "\.\.\/lib\/syncFirestore";/,
    `import { cleanAndEnrichStore, safeSetDoc } from "../lib/syncFirestore";`
  );
  fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
}
