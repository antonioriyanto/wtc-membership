const fs = require('fs');

// 1. Patch LoginWall.tsx
let loginWall = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');
const loginTarget = `    if (foundStore) {
      // Forcefully update the store name immediately before login proceeds to ensure App state sync
      try {
        localStorage.setItem('wtc_cashier_name', foundStore.name);
        localStorage.setItem('wtc_cashier_store', foundStore.name);
      } catch (e) {}
      
      onLogin(foundStore.username, foundStore.name);
      return;
    }`;

const loginReplacement = `    if (foundStore) {
      // Forcefully update the store name immediately before login proceeds to ensure App state sync
      try {
        localStorage.setItem('wtc_cashier_name', foundStore.name);
        localStorage.setItem('wtc_cashier_store', foundStore.username); // Store the code (e.g. PENTA)
      } catch (e) {}
      
      onLogin(foundStore.username, foundStore.username); // Pass username as store identifier
      return;
    }`;
loginWall = loginWall.replace(loginTarget, loginReplacement);
fs.writeFileSync('src/components/LoginWall.tsx', loginWall);

// 2. Patch App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

const appTargetLogin = `          <AdminLogin 
            onLogin={(user, storeName) => {
              let finalStoreName = storeName;
              
              // Find the exact matching store based on the username that just logged in
              const matchingStore = stores.find(s => 
                (s.username && s.username.toUpperCase() === user.toUpperCase()) || 
                (s.code && s.code.toUpperCase() === user.toUpperCase())
              );
              
              if (matchingStore) {
                 finalStoreName = matchingStore.name;
              }
            
              if (user) {
                const displayUser = (finalStoreName && user.toUpperCase() !== 'ADMIN' && user.toUpperCase() !== 'HO') ? finalStoreName : user;
                setCashierName(displayUser);
                try { localStorage.setItem('wtc_cashier_name', displayUser); } catch {}
              }
              if (finalStoreName) {
                setCashierStoreName(finalStoreName);
                try { localStorage.setItem('wtc_cashier_store', finalStoreName); } catch {}
              }
              setCashierAuthenticated(true);
              try { localStorage.setItem('wtc_cashier_auth', 'true'); } catch {}
            }} `;

const appReplacementLogin = `          <AdminLogin 
            onLogin={(user, storeIdentifier) => {
              let finalStoreName = storeIdentifier;
              
              // Find the exact matching store based on the username that just logged in
              const matchingStore = stores.find(s => 
                (s.username && s.username.toUpperCase() === user.toUpperCase()) || 
                (s.code && s.code.toUpperCase() === user.toUpperCase()) ||
                (s.id && s.id.toUpperCase() === user.toUpperCase())
              );
              
              if (matchingStore) {
                 finalStoreName = matchingStore.name;
              }
            
              if (user) {
                const displayUser = (finalStoreName && user.toUpperCase() !== 'ADMIN' && user.toUpperCase() !== 'HO') ? finalStoreName : user;
                setCashierName(displayUser);
                try { localStorage.setItem('wtc_cashier_name', displayUser); } catch {}
              }
              
              // Store the robust ID/Code instead of the easily changeable name
              setCashierStoreName(user);
              try { localStorage.setItem('wtc_cashier_store', user); } catch {}
              
              setCashierAuthenticated(true);
              try { localStorage.setItem('wtc_cashier_auth', 'true'); } catch {}
            }} `;
app = app.replace(appTargetLogin, appReplacementLogin);

const appTargetStore = `            currentStore={
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

const appReplacementStore = `            currentStore={
              (() => {
                const search = (cashierStoreName || '').toUpperCase().trim();
                if (!search) return stores[0] || initialStores[0];
                
                // 1. Strict match by code, id, or username (Bulletproof)
                let matched = stores.find(s => 
                  (s.code || '').toUpperCase().trim() === search ||
                  (s.id || '').toUpperCase().trim() === search ||
                  (s.username && s.username.toUpperCase().trim() === search)
                );
                
                // 2. Fallback to exact name match just in case it's a legacy saved value
                if (!matched) {
                  const searchLower = search.toLowerCase();
                  matched = stores.find(s => (s.name || '').toLowerCase().trim() === searchLower);
                }
                
                // 3. Last resort fuzzy match
                if (!matched) {
                  const searchLower = search.toLowerCase();
                  matched = stores.find(s => {
                    const sName = (s.name || '').toLowerCase();
                    return (sName && sName.includes(searchLower)) || (sName && searchLower.includes(sName));
                  });
                }
                
                return matched || stores[0] || initialStores[0];
              })()
            }`;
app = app.replace(appTargetStore, appReplacementStore);

fs.writeFileSync('src/App.tsx', app);
