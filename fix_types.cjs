const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

if (!code.includes('avatarUrl?: string;')) {
  code = code.replace('address?: string;', 'address?: string;\n  avatarUrl?: string;');
  fs.writeFileSync('src/types.ts', code);
}
