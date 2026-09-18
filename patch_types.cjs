const fs = require('fs');
let types = fs.readFileSync('src/types.ts', 'utf8');
if (!types.includes('profileImageUrl')) {
  types = types.replace(
    '  lastVisitDate: string;',
    '  lastVisitDate: string;\n  profileImageUrl?: string;'
  );
  fs.writeFileSync('src/types.ts', types);
}
