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
  const snapshot = await getDocs(collection(db, "members"));
  console.log("Total members in Firestore:", snapshot.size);
  let latest = null;
  snapshot.forEach(doc => {
    const data = doc.data();
    if (!latest || data.createdAt > latest.createdAt || doc.id.startsWith('mem_')) {
       latest = data;
    }
  });
  console.log("Latest member:", latest ? latest.name + " (" + latest.registeredStore + ")" : "None");
}
test();
