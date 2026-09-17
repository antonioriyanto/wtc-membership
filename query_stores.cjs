const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function query() {
  const snapshot = await db.collection('stores').get();
  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.name.includes("23 Paskal")) {
      console.log(doc.id, data.name, data.code);
    }
  });
}
query();
