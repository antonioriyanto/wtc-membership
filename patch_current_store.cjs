const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `            currentStore={
              stores.find(s => 
                s.name?.toLowerCase().includes((cashierStoreName || '').toLowerCase()) || 
                (cashierStoreName || '').toLowerCase().includes(s.name?.toLowerCase() || '') ||
                s.code?.toLowerCase() === (cashierStoreName || '').toLowerCase() ||
                s.id?.toLowerCase() === (cashierStoreName || '').toLowerCase()
              ) || stores[0] || initialStores[0]
            }`;

const replacement = `            currentStore={
              (() => {
                const search = (cashierStoreName || '').toLowerCase().trim();
                if (!search) return stores[0] || initialStores[0];
                return stores.find(s => {
                  const sName = (s.name || '').toLowerCase();
                  const sCode = (s.code || '').toLowerCase();
                  const sId = (s.id || '').toLowerCase();
                  return (sName && sName.includes(search)) || 
                         (sName && search.includes(sName)) ||
                         (sCode && sCode === search) || 
                         (sId && sId === search);
                }) || stores[0] || initialStores[0];
              })()
            }`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
