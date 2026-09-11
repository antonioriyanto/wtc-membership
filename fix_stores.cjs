const fs = require('fs');

let content = fs.readFileSync('src/data/mockData.ts', 'utf-8');

// The stores were replaced with just one mock store when we cleared the mock data.
// Let's restore the full list of stores so the UI has them available as defaults if Firestore is empty.

const fullStoresList = `export const initialStores: Store[] = [
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
];`;

content = content.replace(/export const initialStores: Store\[\] = \[[\s\S]*?\];/g, fullStoresList);

fs.writeFileSync('src/data/mockData.ts', content);

// We should also make sure that if the app is trying to save a store to Firebase, it handles it correctly.
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');
// The app relies on `stores` state. We need to make sure the sync logic initializes with initialStores if Firestore has no stores.
if (!appContent.includes('// Check if stores need seeding')) {
  // Let's add a small check in the useEffect where it syncs data. 
  // It's probably better to just rely on initialStores if stores are empty, or seed them once.
}

