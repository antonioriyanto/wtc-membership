const fs = require('fs');

const watchStoreImages = [
  "https://images.unsplash.com/photo-1549429532-6804ff69b22b?w=800&q=80",
  "https://images.unsplash.com/photo-1587836171822-7772c7247596?w=800&q=80",
  "https://images.unsplash.com/photo-1622434641406-a158123450f9?w=800&q=80",
  "https://images.unsplash.com/photo-1610423089694-82a0d0149021?w=800&q=80",
  "https://images.unsplash.com/photo-1594534475808-b18fc33b045e?w=800&q=80",
  "https://images.unsplash.com/photo-1548678967-f1fc1ca0c113?w=800&q=80",
  "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?w=800&q=80"
];

let mockData = fs.readFileSync('src/data/mockData.ts', 'utf-8');
const match = mockData.match(/export const initialStores: any\[\] = (\[[\s\S]*?\]);\n/);
if (match) {
  let stores = eval(match[1]);
  let i = 0;
  stores = stores.map(s => {
    if (s.id !== 'HO') {
      s.imageUrl = watchStoreImages[i % watchStoreImages.length];
      i++;
    }
    return s;
  });
  const newBlock = "export const initialStores: any[] = " + JSON.stringify(stores, null, 2) + ";\n";
  mockData = mockData.replace(/export const initialStores: any\[\] = \[[\s\S]*?\];\n/, newBlock);
  fs.writeFileSync('src/data/mockData.ts', mockData);
  console.log("mockData.ts updated with images!");
} else {
  console.error("Could not find initialStores");
}
