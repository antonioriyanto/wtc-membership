const fs = require('fs');
let content = fs.readFileSync('src/lib/syncFirestore.ts', 'utf-8');

// Check if we are artificially preventing stores from loading
// If the collection is empty, maybe we should seed it with the initial stores?
if (content.includes('import { initialLoyaltyConfig, initialStores }')) {
  // We're good, it should sync. 
  // Let's modify the sync script to forcefully seed the stores if the 'stores' collection is completely empty.
  content = content.replace(
    /const storesSnap = await getDocs\(collection\(db, 'stores'\)\);\n\s*if \(\!storesSnap\.empty\) \{[\s\S]*?\}\n\s*\}/,
    `const storesSnap = await getDocs(collection(db, 'stores'));
        if (!storesSnap.empty) {
          const loadedStores: any[] = [];
          storesSnap.forEach(doc => loadedStores.push({ id: doc.id, ...doc.data() }));
          setStores(loadedStores);
        } else {
          // Force seed if completely empty
          console.log("Stores empty, seeding...");
          const batch = writeBatch(db);
          initialStores.forEach(st => {
            batch.set(doc(db, 'stores', st.id), st);
          });
          await batch.commit();
          setStores(initialStores);
        }`
  );
  fs.writeFileSync('src/lib/syncFirestore.ts', content);
}
