const fs = require('fs');
let content = fs.readFileSync('src/lib/syncFirestore.ts', 'utf8');

const target = `      if (name === 'stores') {
        const storeMap = new Map();
        
        // If Firestore already has data, we can just use it and rely on its richness.
        // We will merge initialStores only if they don't exist in Firestore by matching 'code' or 'name' (fuzzily).
        // First add all Firestore stores to map using their ID or code as key
        data.forEach(s => {
           const key = s.code ? s.code.trim().toUpperCase() : s.id;
           storeMap.set(key, s);
        });

        // Now see if initialStores has anything missing (e.g. at the very start)
        initialStores.forEach(s => {
           const codeKey = s.code ? s.code.trim().toUpperCase() : s.id;
           // If it doesn't exist by code, try finding by matching prefix name
           let found = storeMap.has(codeKey);
           if (!found) {
             // Try to find if any store in map has a similar name
             const searchName = s.name.trim().toLowerCase().replace(' shopping center', '').replace(' mall', '');
             for (const existingStore of storeMap.values()) {
               if (existingStore.name.toLowerCase().includes(searchName)) {
                 found = true;
                 break;
               }
             }
           }
           if (!found) {
             storeMap.set(codeKey, s);
           }
        });

        data = Array.from(storeMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      }`;

const replacement = `      if (name === 'stores') {
        if (data.length >= 20) {
          // If Firestore is already populated with the real store directory,
          // trust Firestore as the single source of truth to avoid duplicates.
          data = data.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        } else {
          // Fallback to initialStores if Firestore is somehow empty or unseeded
          const storeMap = new Map();
          initialStores.forEach(s => storeMap.set(s.id, s));
          data.forEach(s => storeMap.set(s.id, s));
          data = Array.from(storeMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/lib/syncFirestore.ts', content);
