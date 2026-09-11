const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDocs, collection, deleteDoc } = require('firebase/firestore');

// We need to parse the stores from the original typescript file.
// Since it's a TS file with export const, we can extract the JSON part using a bit of regex/eval.
let content = fs.readFileSync('/tmp/original_mockData.ts', 'utf-8');
const match = content.match(/export const initialStores: StoreBranch\[\] = (\[[\s\S]*?\]);/);
if (!match) {
  console.error("Could not extract initialStores");
  process.exit(1);
}

let storeArrayString = match[1];
// Some object keys might not have quotes, but this is standard JS format so eval should work if we fake the variables.
// Let's safely evaluate it.
const getStores = new Function(`return ${storeArrayString};`);
const realStores = getStores();

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

async function restore() {
  console.log('Fetching existing wrong stores...');
  const snap = await getDocs(collection(db, 'stores'));
  for (const d of snap.docs) {
    await deleteDoc(doc(db, 'stores', d.id));
  }
  
  console.log(`Uploading ${realStores.length} real branches...`);
  for (const st of realStores) {
    await setDoc(doc(db, 'stores', st.id), st);
    console.log(`Added: ${st.name}`);
  }
  
  console.log('Finished restoring real stores to Firestore!');
  process.exit(0);
}

restore();
