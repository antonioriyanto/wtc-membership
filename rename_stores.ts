import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

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

const renameMap: Record<string, string> = {
  "23S": "23 Semarang",
  "2PB": "23 Paskal Shopping Center Bandung",
  "AEO": "AEON Mall Sentul City Bogor",
  "ALI": "Alianyang Singkawang",
  "APJ": "Plaza Ambarrukmo Yogyakarta",
  "AYA": "Ayani Megamall Pontianak",
  "BMS": "BIG Mall Samarinda",
  "BOG": "Botani Square Mall Bogor",
  "CCM": "Cibinong City Mall Bogor",
  "CIP": "Mal Ciputra Semarang",
  "DM2": "Duta Mall Banjarmasin 2",
  "DMS": "DP Mall Semarang",
  "DUT": "Duta Mall Banjarmasin 1",
  "EWB": "e-Walk Mall Balikpapan",
  "GAI": "Gaia Bumi Raya City Pontianak",
  "GOR": "Citimall Gorontalo",
  "JAY": "Mal Jayapura",
  "JCM": "Jogja City Mall",
  "KEN": "The Park Kendari",
  "KKJ": "Kota Kasablanka Jakarta",
  "L2B": "Level 21 Mall Bali",
  "MGM": "Megamall Manado",
  "MOG1": "Mall Olympic Garden Malang 1",
  "MOG2": "Mall Olympic Garden Malang 2",
  "MTS": "Manado Town Square",
  "PAL": "Palu Grand Mall",
  "PAN": "Mal Panakkukang Makassar",
  "PAR": "Pollux Mall Paragon Semarang",
  "PCB": "Pentacity Shopping Venue Balikpapan",
  "PMY": "Pakuwon Mall Jogja",
  "PUR": "Puri Indah Mall Jakarta",
  "SGM": "Singkawang Grand Mall",
  "SMB": "Summarecon Mall Bandung",
  "SOLB": "Pakuwon Mall Solo Baru",
  "SOLSQ": "Solo Square",
  "TPS": "The Park Mall Solo",
  "TPSD": "The Park Sawangan Depok",
  "TSM": "Trans Studio Mall Makassar",
  "TSMB": "Trans Studio Mall Bali",
  "TSMBND": "Trans Studio Mall Bandung",
  "TSMC": "Trans Studio Mall Cibubur"
};

async function updateStoreNames() {
  const snap = await getDocs(collection(db, 'stores'));
  let updatedCount = 0;
  for (const storeDoc of snap.docs) {
    const data = storeDoc.data();
    const code = data.code;
    const newName = renameMap[code];
    
    if (newName && newName !== data.name) {
      console.log(`Updating ${code}: ${data.name} -> ${newName}`);
      await updateDoc(doc(db, 'stores', storeDoc.id), { name: newName });
      updatedCount++;
    } else {
      console.log(`Skipping ${code} (already up to date or not found in map)`);
    }
  }
  console.log(`Finished updating ${updatedCount} stores in Firebase.`);
  process.exit(0);
}

updateStoreNames();
