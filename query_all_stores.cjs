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
  const names = {};
  const duplicates = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    // simplify name to detect duplicates
    const rawName = data.name.toLowerCase().replace(/shopping center|mall|bandung/gi, '').trim();
    if (names[rawName]) {
      console.log("Duplicate pair:", data.name, "(", doc.id, ") AND", names[rawName].name, "(", names[rawName].id, ")");
    } else {
      names[rawName] = { id: doc.id, name: data.name };
    }
  });
}
query();
