const fs = require('fs');

const stores = JSON.parse(fs.readFileSync('generated_stores_data.json', 'utf-8'));
const mockDataContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');

const regex = /export const initialStores: any\[\] = \[[\s\S]*?\];\s*export const initialMembers:/m;
const replacement = `export const initialStores: StoreBranch[] = ${JSON.stringify(stores, null, 2)};\n\nexport const initialMembers:`;

if (!regex.test(mockDataContent)) {
  console.error("Could not find initialStores regex match!");
  process.exit(1);
}

const updated = mockDataContent.replace(regex, replacement);
fs.writeFileSync('src/data/mockData.ts', updated);
console.log("Updated mockData.ts with all 42 stores!");
