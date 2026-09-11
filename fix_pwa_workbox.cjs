const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf-8');

const workboxConfig = `
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000 // 5 MB
        },
        manifest:`;

content = content.replace(/manifest:/, workboxConfig.trim());
fs.writeFileSync('vite.config.ts', content);
console.log("Updated vite.config.ts with workbox configuration");
