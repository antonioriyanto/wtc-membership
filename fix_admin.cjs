const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

// Replace import
content = content.replace(/import \* as admin from 'firebase-admin';/, "import { getAuth } from 'firebase-admin/auth';\\nimport { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';");

// Replace usage
content = content.replace(/!admin\.apps\.length/, "!getApps().length");
content = content.replace(/admin\.initializeApp\(\{[\s\n]*credential: admin\.credential\.applicationDefault\(\)[\s\n]*\}\);/, "initializeApp({ credential: applicationDefault() });");
content = content.replace(/admin\.auth\(\)\.verifyIdToken\(token\)/, "getAuth().verifyIdToken(token)");

fs.writeFileSync('server.ts', content, 'utf-8');
console.log('Fixed firebase admin');
