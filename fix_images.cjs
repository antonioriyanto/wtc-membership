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

// High quality watch store images
const watchStoreImages = [
  "https://images.unsplash.com/photo-1549429532-6804ff69b22b?w=800&q=80",
  "https://images.unsplash.com/photo-1587836171822-7772c7247596?w=800&q=80",
  "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&q=80",
  "https://images.unsplash.com/photo-1610423089694-82a0d0149021?w=800&q=80",
  "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&q=80",
  "https://images.unsplash.com/photo-1548678967-f1fc1ca0c113?w=800&q=80",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80"
];

async function updateImages() {
  const snapshot = await db.collection('stores').get();
  const batch = db.batch();
  
  let i = 0;
  snapshot.docs.forEach(doc => {
    if (doc.id === 'HO') return;
    const imageUrl = watchStoreImages[i % watchStoreImages.length];
    batch.set(doc.ref, { imageUrl }, { merge: true });
    i++;
  });
  
  await batch.commit();
  console.log("Images updated successfully!");
}

updateImages().catch(console.error);
