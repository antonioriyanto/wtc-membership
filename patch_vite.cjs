const fs = require('fs');
let s = fs.readFileSync('vite.config.ts', 'utf8');

if (!s.includes('navigateFallbackDenylist')) {
  s = s.replace(
    'maximumFileSizeToCacheInBytes: 5000000 // 5 MB',
    'maximumFileSizeToCacheInBytes: 5000000, // 5 MB\n          navigateFallbackDenylist: [/\\/api\\//]'
  );
  fs.writeFileSync('vite.config.ts', s);
}
