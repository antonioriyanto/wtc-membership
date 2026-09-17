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

async function query() {
  const snapshot = await db.collection('stores').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.name.includes("Paskal")) {
      console.log("ID:", doc.id, "- Name:", data.name, "- Username:", data.username, "- Code:", data.code);
    }
  });
}
query();
