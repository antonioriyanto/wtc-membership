const fs = require('fs');
let content = fs.readFileSync('src/main.tsx', 'utf-8');

if (!content.includes('virtual:pwa-register')) {
  const pwaImport = `import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });\n`;
  content = content.replace(/import React from 'react';/, match => pwaImport + match);
  fs.writeFileSync('src/main.tsx', content);
  console.log("Service Worker registration injected into main.tsx");
}
