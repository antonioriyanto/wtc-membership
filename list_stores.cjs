const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');

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

async function list() {
  const snap = await getDocs(collection(db, 'stores'));
  let index = 1;
  snap.docs.forEach(d => {
    console.log(`${index}. ${d.data().name} (${d.data().code}) - ${d.data().region}`);
    index++;
  });
  process.exit(0);
}
list();
