require('dotenv').config();
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

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

async function checkStores() {
  const snapshot = await db.collection('stores').get();
  console.log("Total stores in Firestore:", snapshot.size);
  if (snapshot.size > 0) {
    const firstStore = snapshot.docs[0].data();
    console.log("First store:", firstStore);
  }
}

checkStores().catch(console.error);
