const fs = require('fs');
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace('  profileImageUrl?: string;', '  profileImageUrl?: string;\n  avatarUrl?: string;');
fs.writeFileSync('src/types.ts', types);
