const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// The route /api/auth/employee-login was added twice, and one might be broken or placed before body parser.
// Let's clean up server.ts manually by matching the full file and restructuring it nicely.
