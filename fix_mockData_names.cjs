const fs = require('fs');

let content = fs.readFileSync('src/data/mockData.ts', 'utf-8');

const renameMap = {
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

for (const [code, newName] of Object.entries(renameMap)) {
  const regex = new RegExp(`code:\\s*'${code}',\\s*name:\\s*'[^']+',`, 'g');
  content = content.replace(regex, `code: '${code}', name: '${newName}',`);
}

fs.writeFileSync('src/data/mockData.ts', content);
console.log('mockData.ts updated');
