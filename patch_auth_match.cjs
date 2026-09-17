const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogic = `            currentStore={
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

const replacementLogic = `            currentStore={
              (() => {
                const search = (cashierStoreName || '').toLowerCase().trim();
                if (!search) return stores[0] || initialStores[0];
                
                // 1. Strict exact match first
                let matched = stores.find(s => (s.name || '').toLowerCase().trim() === search);
                
                // 2. Contains match if not found exactly
                if (!matched) {
                  matched = stores.find(s => {
                    const sName = (s.name || '').toLowerCase();
                    const sCode = (s.code || '').toLowerCase();
                    const sId = (s.id || '').toLowerCase();
                    return (sName && sName.includes(search)) || 
                           (sName && search.includes(sName)) ||
                           (sCode && sCode === search) || 
                           (sId && sId === search);
                  });
                }
                
                return matched || stores[0] || initialStores[0];
              })()
            }`;

content = content.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/App.tsx', content);
