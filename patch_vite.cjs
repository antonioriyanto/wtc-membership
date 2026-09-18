const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

code = code.replace(/navigateFallbackDenylist: \[\\\/api\\\/\]/g, "navigateFallbackDenylist: [/api/, /\\/api\\//]");

fs.writeFileSync('vite.config.ts', code);
