const fs = require('fs');
let content = fs.readFileSync('src/lib/syncFirestore.ts', 'utf8');

const target = `      if (data.length > 0) {
        if (name === 'transactions') {`;

const replacement = `      if (data.length > 0) {
        if (name === 'stores') {
          const storeMap = new Map();
          initialStores.forEach(s => storeMap.set(s.id, s));
          data.forEach(s => storeMap.set(s.id, s));
          data = Array.from(storeMap.values());
        }
        if (name === 'transactions') {`;

content = content.replace(target, replacement);

fs.writeFileSync('src/lib/syncFirestore.ts', content);
