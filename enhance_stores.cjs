const fs = require('fs');

const file = fs.readFileSync('src/data/mockData.ts', 'utf8');

const mallImages = [
  'https://images.unsplash.com/photo-1519567241046-7f560e145386?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1567449303183-ae0d6ed1498e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1620808035136-1e967da51025?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1549429532-6804ff69b22b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1601275225755-f6a6c1737cb1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1582200508538-4e8910403756?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
  'https://images.unsplash.com/photo-1555529771-835f59fc5efe?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'
];

let match = file.match(/export const initialStores[^=]*=\s*(\[[\s\S]*?\]);\n/);
if (match) {
  let stores = eval(match[1]);
  stores = stores.map((s, i) => {
    s.imageUrl = mallImages[i % mallImages.length];
    s.address = `Lantai Dasar, ${s.mallName}, ${s.city}, Indonesia`;
    s.whatsapp = '0811' + Math.floor(10000000 + Math.random() * 90000000).toString();
    s.latitude = -6.200000 + (Math.random() - 0.5) * 5; // Random Indonesia lat
    s.longitude = 106.816666 + (Math.random() - 0.5) * 10; // Random Indonesia lon
    return s;
  });
  
  const newContent = file.replace(/export const initialStores[^=]*=\s*(\[[\s\S]*?\]);\n/, `export const initialStores: any[] = ${JSON.stringify(stores, null, 2)};\n`);
  fs.writeFileSync('src/data/mockData.ts', newContent);
  console.log("Stores enhanced!");
} else {
  console.log("Could not find initialStores");
}
