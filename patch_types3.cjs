const fs = require('fs');

// Fix duplicate avatarUrl in types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/  avatarUrl\?: string;\n  avatarUrl\?: string;/g, '  avatarUrl?: string;');
fs.writeFileSync('src/types.ts', types);

