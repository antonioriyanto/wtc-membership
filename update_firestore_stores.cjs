require('dotenv').config();
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    }),
  });
}

const db = getFirestore();

// We need to parse mockData.ts to get the new initialStores
const mockDataContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');
const match = mockDataContent.match(/export const initialStores[^=]*=\s*(\[[\s\S]*?\]);\n/);

if (!match) {
  console.error("Could not find initialStores");
  process.exit(1);
}

const stores = eval(match[1]);

async function updateStores() {
  const batch = db.batch();
  for (const s of stores) {
    const docRef = db.collection('stores').doc(s.id);
    batch.set(docRef, s, { merge: true });
  }
  await batch.commit();
  console.log(`Successfully updated ${stores.length} stores in Firestore with enhanced data!`);
}

updateStores().catch(console.error);
