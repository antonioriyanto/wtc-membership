const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

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

// Approximate coordinates for these major Indonesian malls
const coordinatesMap = {
  "23S": { lat: -6.9823, lng: 110.4227 }, // 23 Semarang
  "2PB": { lat: -6.9149, lng: 107.5956 }, // 23 Paskal Bandung
  "AEO": { lat: -6.5684, lng: 106.8643 }, // AEON Sentul
  "ALI": { lat: 0.9066, lng: 108.9863 }, // Alianyang Singkawang
  "APJ": { lat: -7.7825, lng: 110.4011 }, // Ambarrukmo Plaza
  "AYA": { lat: -0.0460, lng: 109.3444 }, // Ayani Megamall
  "BMS": { lat: -0.5226, lng: 117.1121 }, // BIG Mall Samarinda
  "BOG": { lat: -6.6006, lng: 106.8016 }, // Botani Square
  "CCM": { lat: -6.4678, lng: 106.8458 }, // Cibinong City Mall
  "CIP": { lat: -6.9861, lng: 110.4220 }, // Mal Ciputra Semarang
  "DM2": { lat: -3.3245, lng: 114.5937 }, // Duta Mall 2
  "DMS": { lat: -6.9803, lng: 110.4137 }, // DP Mall Semarang
  "DUT": { lat: -3.3245, lng: 114.5937 }, // Duta Mall 1
  "EWB": { lat: -1.2655, lng: 116.8378 }, // e-Walk Balikpapan
  "GAI": { lat: -0.0520, lng: 109.3510 }, // Gaia Pontianak
  "GOR": { lat: 0.5422, lng: 123.0595 }, // Citimall Gorontalo
  "JAY": { lat: -2.5332, lng: 140.7061 }, // Mal Jayapura
  "JCM": { lat: -7.7478, lng: 110.3601 }, // Jogja City Mall
  "KEN": { lat: -3.9877, lng: 122.5190 }, // The Park Kendari
  "KKJ": { lat: -6.2239, lng: 106.8436 }, // Kota Kasablanka
  "L2B": { lat: -8.6657, lng: 115.2104 }, // Level 21
  "MGM": { lat: 1.4883, lng: 124.8385 }, // Megamall Manado
  "MOG1": { lat: -7.9731, lng: 112.6247 }, // MOG 1
  "MOG2": { lat: -7.9731, lng: 112.6247 }, // MOG 2
  "MTS": { lat: 1.4727, lng: 124.8315 }, // Mantos
  "PAL": { lat: -0.8938, lng: 119.8661 }, // Palu Grand Mall
  "PAN": { lat: -5.1537, lng: 119.4479 }, // Panakkukang
  "PAR": { lat: -6.9818, lng: 110.4132 }, // Paragon Semarang
  "PCB": { lat: -1.2655, lng: 116.8378 }, // Pentacity
  "PMY": { lat: -7.7583, lng: 110.3951 }, // Pakuwon Mall Jogja
  "PUR": { lat: -6.1868, lng: 106.7377 }, // Puri Indah Mall
  "SGM": { lat: 0.8984, lng: 108.9839 }, // Singkawang Grand Mall
  "SMB": { lat: -6.9405, lng: 107.6974 }, // Summarecon Bandung
  "SOLB": { lat: -7.6015, lng: 110.8202 }, // Pakuwon Mall Solo Baru
  "SOLSQ": { lat: -7.5574, lng: 110.7937 }, // Solo Square
  "TPS": { lat: -7.6015, lng: 110.8202 }, // The Park Solo
  "TPSD": { lat: -6.3989, lng: 106.7454 }, // The Park Sawangan
  "TSM": { lat: -5.1557, lng: 119.4079 }, // TSM Makassar
  "TSMB": { lat: -8.7042, lng: 115.1764 }, // TSM Bali
  "TSMBND": { lat: -6.9255, lng: 107.6366 }, // TSM Bandung
  "TSMC": { lat: -6.3768, lng: 106.9015 } // TSM Cibubur
};

async function updateStoreCoords() {
  const snap = await getDocs(collection(db, 'stores'));
  for (const storeDoc of snap.docs) {
    const data = storeDoc.data();
    const coords = coordinatesMap[data.code];
    if (coords) {
      console.log(`Setting coordinates for ${data.name}...`);
      await updateDoc(doc(db, 'stores', storeDoc.id), { 
        latitude: coords.lat, 
        longitude: coords.lng 
      });
    }
  }
  console.log('Coordinates updated!');
  process.exit(0);
}

updateStoreCoords();
