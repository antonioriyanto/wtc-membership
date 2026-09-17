const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

// Let's get the valid IDs from mockData.ts
let mockDataContent = fs.readFileSync('src/data/mockData.ts', 'utf8');
const initialStoresMatch = mockDataContent.match(/export const initialStores[^=]*=\s*(\[[^]*?\]);/m);

let validIds = new Set();
if (initialStoresMatch) {
  try {
    // using eval to parse the JS array
    const stores = eval(initialStoresMatch[1]);
    stores.forEach(s => validIds.add(s.id));
  } catch(e) {
    console.error("Parse error", e);
  }
}
console.log("Valid IDs in mock data:", Array.from(validIds).slice(0, 5), "...", validIds.size, "total");

async function fix() {
  const snapshot = await db.collection('stores').get();
  
  let deletedCount = 0;
  const batch = db.batch();
  
  snapshot.forEach(doc => {
    if (!validIds.has(doc.id)) {
      console.log("Deleting duplicate/orphan store:", doc.id, "-", doc.data().name);
      batch.delete(doc.ref);
      deletedCount++;
    }
  });
  
  if (deletedCount > 0) {
    await batch.commit();
    console.log("Deleted", deletedCount, "duplicate stores.");
  } else {
    console.log("No duplicate stores found.");
  }
}
fix();
