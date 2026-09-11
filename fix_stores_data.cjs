const fs = require('fs');

const STORE_ACCOUNTS = [
  { name: "23 Paskal Bandung", username: "23PSC", password: "23PSC2026" },
  { name: "23 Semarang", username: "23SMG", password: "23SMG2026" },
  { name: "AEON Sentul", username: "AMSC", password: "AMSC2026" },
  { name: "Alianyang Singkawang", username: "ALIAN", password: "ALIAN2026" },
  { name: "Ambarukmo Plaza Jogja", username: "AMB", password: "AMB2026" },
  { name: "Ayani Pontianak", username: "AYANI", password: "AYANI2026" },
  { name: "BIG Mall Samarinda", username: "BIG", password: "BIG2026" },
  { name: "Bogor Botani", username: "BOS", password: "BOS2026" },
  { name: "Cibinong City Mall", username: "CCM", password: "CCM2026" },
  { name: "Ciputra Semarang", username: "CL", password: "CL2026" },
  { name: "DP Mall Semarang", username: "DPM", password: "DPM2026" },
  { name: "Duta Mall 1 Banjarmasin", username: "DTM1", password: "DTM12026" },
  { name: "Duta Mall 2 Banjarmasin", username: "DTM2", password: "DTM22026" },
  { name: "E-Walk Balikpapan", username: "EWALK", password: "EWALK2026" },
  { name: "Gaia Pontianak", username: "GAIA", password: "GAIA2026" },
  { name: "Gorontalo", username: "GTLO", password: "GTLO2026" },
  { name: "Jayapura", username: "JYP", password: "JYP2026" },
  { name: "Jogja City Mall", username: "JCM", password: "JCM2026" },
  { name: "Kendari", username: "KDI", password: "KDI2026" },
  { name: "Kota Kasablanka Jakarta", username: "KOKAS", password: "KOKAS2026" },
  { name: "Level 21 Bali", username: "LVL21", password: "LVL212026" },
  { name: "Mall Olympic Garden 1 Malang", username: "MOG1", password: "MOG12026" },
  { name: "Mall Olympic Garden 2 Malang", username: "MOG2", password: "MOG22026" },
  { name: "Manado Town Square", username: "MANTS", password: "MANTS2026" },
  { name: "Pakuwon Mall Yogya", username: "PMJ", password: "PMJ2026" },
  { name: "Palu", username: "PALU", password: "PALU2026" },
  { name: "Panakukang", username: "KUKA", password: "KUKA2026" },
  { name: "Paragon Semarang", username: "PRG", password: "PRG2026" },
  { name: "Penta City Balikpapan", username: "PENTA", password: "PENTA2026" },
  { name: "Puri Jakarta", username: "PIM", password: "PIM2026" },
  { name: "Singkawang Grand Mall", username: "SGM", password: "SGM2026" },
  { name: "Solo Baru", username: "SOBAR", password: "SOBAR2026" },
  { name: "Solo Square", username: "SQ", password: "SQ2026" },
  { name: "Summarecon Mall Bandung", username: "SMB", password: "SMB2026" },
  { name: "The Park Sawangan Depok", username: "SWG", password: "SWG2026" },
  { name: "The Park Solo", username: "PARK", password: "PARK2026" },
  { name: "TSM Bali", username: "BALI", password: "BALI2026" },
  { name: "TSM Bandung", username: "TSM", password: "TSM2026" },
  { name: "TSM Cibubur", username: "CBB", password: "CBB2026" },
  { name: "TSM Makassar", username: "FINE", password: "FINE2026" }
];

let generatedStores = STORE_ACCOUNTS.map(s => {
  return "  { id: '" + s.username + "', code: '" + s.username + "', name: '" + s.name + "', location: '" + s.name + "', type: 'STORE', isActive: true, phone: '-' }";
});
// Add HO
generatedStores.push("  { id: 'HO', code: 'HO', name: 'Head Office', location: 'PIK Avenue, Jakarta Utara', type: 'HO', isActive: true, phone: '-' }");

const newStoresBlock = "export const initialStores: any[] = [\n" + generatedStores.join(',\n') + "\n];";

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');
mockData = mockData.replace(/export const initialStores: any\[\] = \[[\s\S]*?\];/g, newStoresBlock);
fs.writeFileSync('src/data/mockData.ts', mockData);

console.log('Stores injected');
