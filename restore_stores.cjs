const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

const initialStores = [
  { id: 'PUR', code: 'PUR', name: 'Puri Jakarta', location: 'Lantai G, Puri Indah Mall, Jakarta Barat', type: 'STORE', isActive: true, phone: '021-5822765' },
  { id: 'KLP', code: 'KLP', name: 'Kelapa Gading', location: 'Lantai 1, Mall Kelapa Gading, Jakarta Utara', type: 'STORE', isActive: true, phone: '021-4529731' },
  { id: 'SEN', code: 'SEN', name: 'Senayan City', location: 'Lantai 2, Senayan City, Jakarta Pusat', type: 'STORE', isActive: true, phone: '021-72781423' },
  { id: 'KOT', code: 'KOT', name: 'Kota Kasablanka', location: 'Lantai UG, Kota Kasablanka, Jakarta Selatan', type: 'STORE', isActive: true, phone: '021-29465134' },
  { id: 'AEON', code: 'AEON', name: 'AEON BSD', location: 'Lantai G, AEON Mall BSD City, Tangerang', type: 'STORE', isActive: true, phone: '021-29168456' },
  { id: 'GND', code: 'GND', name: 'Grand Indonesia', location: 'Lantai 3, East Mall Grand Indonesia', type: 'STORE', isActive: true, phone: '021-23580456' },
  { id: 'CP', code: 'CP', name: 'Central Park', location: 'Lantai 1, Central Park Mall, Jakarta Barat', type: 'STORE', isActive: true, phone: '021-56985112' },
  { id: 'PIM', code: 'PIM', name: 'Pondok Indah Mall', location: 'Lantai 2, PIM 2, Jakarta Selatan', type: 'STORE', isActive: true, phone: '021-75920334' },
  { id: 'SMG', code: 'SMG', name: 'Paragon Semarang', location: 'Lantai 1, Paragon Mall, Semarang', type: 'STORE', isActive: true, phone: '024-86579221' },
  { id: 'SBY', code: 'SBY', name: 'Tunjungan Plaza', location: 'Lantai 3, Tunjungan Plaza 4, Surabaya', type: 'STORE', isActive: true, phone: '031-5321456' },
  { id: 'BDG', code: 'BDG', name: 'Trans Studio Mall Bandung', location: 'Lantai GF, TSM Bandung', type: 'STORE', isActive: true, phone: '022-8734567' },
  { id: 'MDN', code: 'MDN', name: 'Sun Plaza Medan', location: 'Lantai 1, Sun Plaza, Medan', type: 'STORE', isActive: true, phone: '061-4567890' },
  { id: 'BAL', code: 'BAL', name: 'Beachwalk Bali', location: 'Lantai 1, Beachwalk Shopping Center, Bali', type: 'STORE', isActive: true, phone: '0361-8464888' },
  { id: 'HO', code: 'HO', name: 'Head Office', location: 'PIK Avenue, Jakarta Utara', type: 'HO', isActive: true, phone: '021-5551234' }
];

async function seedStores() {
  console.log('Seeding stores directly to Firebase...');
  for (const st of initialStores) {
    await setDoc(doc(db, 'stores', st.id), st);
    console.log(`Added ${st.name}`);
  }
  console.log('Done restoring stores!');
  process.exit(0);
}

seedStores();
