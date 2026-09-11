const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyCvjoZ65IQDF1j8Dz6W9XLcM-at5ixc39k",
  authDomain: "watch-club-membership.firebaseapp.com",
  projectId: "watch-club-membership"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  const snapshot = await getDocs(collection(db, "stores"));
  console.log("Total stores in Firestore:", snapshot.size);
}
test();
