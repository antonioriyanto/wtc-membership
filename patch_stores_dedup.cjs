const fs = require('fs');
let content = fs.readFileSync('src/lib/syncFirestore.ts', 'utf8');

const target = `      if (name === 'stores') {
        const storeMap = new Map();
        initialStores.forEach(s => storeMap.set(s.id, s));
        data.forEach(s => storeMap.set(s.id, s));
        data = Array.from(storeMap.values());
      }`;

const replacement = `      if (name === 'stores') {
        const storeMap = new Map();
        // Use name to strictly deduplicate since IDs might differ (e.g. Firestore auto-ids vs fixed codes)
        initialStores.forEach(s => storeMap.set(s.name.trim().toLowerCase(), s));
        data.forEach(s => {
          const key = (s.name || '').trim().toLowerCase();
          if (key) {
             storeMap.set(key, { ...storeMap.get(key), ...s, id: s.id || storeMap.get(key)?.id });
          }
        });
        
        data = Array.from(storeMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/syncFirestore.ts', content);
