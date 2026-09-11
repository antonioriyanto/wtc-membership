const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf-8');

if (!content.includes('latitude?: number;')) {
  content = content.replace(
    /export interface StoreBranch \{/,
    `export interface StoreBranch {\n  latitude?: number;\n  longitude?: number;\n  distance?: number; // Temporary UI field`
  );
  fs.writeFileSync('src/types.ts', content);
}
