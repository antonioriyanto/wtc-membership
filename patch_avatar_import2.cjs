const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

if (!code.includes('import { safeSetDoc }')) {
  code = code.replace(
    /import \{ cleanAndEnrichStore \} from "\.\.\/lib\/syncFirestore";/,
    `import { cleanAndEnrichStore, safeSetDoc } from "../lib/syncFirestore";`
  );
  fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
}
