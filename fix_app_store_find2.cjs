const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFind = `currentStore={
              stores.find(s => 
                s.name.toLowerCase().includes(cashierStoreName.toLowerCase()) || 
                cashierStoreName.toLowerCase().includes(s.name.toLowerCase()) ||
                s.code?.toLowerCase() === cashierStoreName.toLowerCase()
              ) || stores.find(s => s.name.toLowerCase().includes('ciputra')) || stores[0] || initialStores[0]
            }`;
const newFind = `currentStore={
              stores.find(s => 
                s.name.toLowerCase().includes(cashierStoreName.toLowerCase()) || 
                cashierStoreName.toLowerCase().includes(s.name.toLowerCase()) ||
                s.code?.toLowerCase() === cashierStoreName.toLowerCase() ||
                s.id?.toLowerCase() === cashierStoreName.toLowerCase()
              ) || stores[0] || initialStores[0]
            }`;

content = content.replace(oldFind, newFind);
fs.writeFileSync('src/App.tsx', content);
