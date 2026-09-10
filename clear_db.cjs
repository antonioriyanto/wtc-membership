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

async function clearCollections() {
  const collectionsToClear = [
    'members',
    'transactions', 
    'support',
    'campaigns',
    'audit',
    'vouchers'
  ];

  for (const collName of collectionsToClear) {
    try {
      console.log(`Clearing collection: ${collName}...`);
      const snapshot = await getDocs(collection(db, collName));
      let count = 0;
      
      // Delete docs one by one (for a small database this is fine, for large ones we'd use batched deletes)
      const deletePromises = [];
      snapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, collName, document.id)));
        count++;
      });
      
      await Promise.all(deletePromises);
      console.log(`Cleared ${count} documents from ${collName}.`);
    } catch (error) {
      console.error(`Error clearing ${collName}:`, error);
    }
  }
  
  // We don't delete 'stores' or 'config' so the app base structure remains functional.
  console.log("Database cleanup complete!");
  process.exit(0);
}

clearCollections();
