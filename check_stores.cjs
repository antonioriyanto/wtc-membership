const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc } = require('firebase/firestore');

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

const fakeStoreIds = [
  'PUR', 'KLP', 'SEN', 'KOT', 'AEON', 'GND', 'CP', 'PIM', 'SMG', 'SBY', 'BDG', 'MDN', 'BAL', 'HO'
];

async function checkStores() {
  const storesSnap = await getDocs(collection(db, 'stores'));
  const allStores = [];
  storesSnap.forEach(d => allStores.push({ id: d.id, ...d.data() }));
  
  console.log("Current stores in DB:");
  allStores.forEach(s => console.log(`- ${s.id}: ${s.name}`));
  
  console.log("\nDeleting the fake ones I accidentally added...");
  for (const id of fakeStoreIds) {
    await deleteDoc(doc(db, 'stores', id)).catch(() => {});
  }
  
  console.log("\nRemaining stores:");
  const storesSnapAfter = await getDocs(collection(db, 'stores'));
  storesSnapAfter.forEach(d => console.log(`- ${d.id}: ${d.data().name}`));
  
  process.exit(0);
}
checkStores();
