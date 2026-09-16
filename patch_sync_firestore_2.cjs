const fs = require('fs');
let content = fs.readFileSync('src/lib/syncFirestore.ts', 'utf8');

const target = `  collections.forEach(({ name, set, storageKey }) => {
    const unsub = onSnapshot(collection(db, name), (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) {
        if (name === 'stores') {
          const storeMap = new Map();
          initialStores.forEach(s => storeMap.set(s.id, s));
          data.forEach(s => storeMap.set(s.id, s));
          data = Array.from(storeMap.values());
        }
        if (name === 'transactions') {`;

const replacement = `  collections.forEach(({ name, set, storageKey }) => {
    const unsub = onSnapshot(collection(db, name), (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (name === 'stores') {
        const storeMap = new Map();
        initialStores.forEach(s => storeMap.set(s.id, s));
        data.forEach(s => storeMap.set(s.id, s));
        data = Array.from(storeMap.values());
      }

      if (data.length > 0) {
        if (name === 'transactions') {`;

content = content.replace(target, replacement);

fs.writeFileSync('src/lib/syncFirestore.ts', content);
