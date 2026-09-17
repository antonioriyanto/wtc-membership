import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCvjoZ65IQDF1j8Dz6W9XLcM-at5ixc39k",
  authDomain: "watch-club-membership.firebaseapp.com",
  projectId: "watch-club-membership",
  storageBucket: "watch-club-membership.firebasestorage.app",
  messagingSenderId: "713398971541",
  appId: "1:713398971541:web:89abf18794ddbe4a9bff9c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const watchStoreImages = [
  "https://images.unsplash.com/photo-1549429532-6804ff69b22b?w=800&q=80",
  "https://images.unsplash.com/photo-1587836171822-7772c7247596?w=800&q=80",
  "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&q=80",
  "https://images.unsplash.com/photo-1610423089694-82a0d0149021?w=800&q=80",
  "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&q=80",
  "https://images.unsplash.com/photo-1548678967-f1fc1ca0c113?w=800&q=80",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80"
];

async function run() {
  const snapshot = await getDocs(collection(db, 'stores'));
  let i = 0;
  for (const store of snapshot.docs) {
    if (store.id === 'HO') continue;
    const imageUrl = watchStoreImages[i % watchStoreImages.length];
    await setDoc(doc(db, 'stores', store.id), { imageUrl }, { merge: true });
    i++;
  }
  console.log("Images updated via client SDK!");
  process.exit(0);
}
run().catch(e => {
    console.error(e);
    process.exit(1);
});
