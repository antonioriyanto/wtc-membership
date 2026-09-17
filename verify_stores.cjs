const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const dotenv = require('dotenv');
dotenv.config();

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

async function check() {
  const snapshot = await db.collection('stores').get();
  console.log("Total stores remaining:", snapshot.size);
  snapshot.forEach(doc => {
    if (doc.data().name.includes("Paskal")) {
      console.log(doc.id, "-", doc.data().name);
    }
  });
}
check();
