const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetLogic = `          <AdminLogin 
            onLogin={(user, storeName) => {
              if (user) {
                const displayUser = (storeName && user.toUpperCase() !== 'ADMIN' && user.toUpperCase() !== 'HO') ? storeName : user;
                setCashierName(displayUser);
                try { localStorage.setItem('wtc_cashier_name', displayUser); } catch {}
              }
              if (storeName) {
                setCashierStoreName(storeName);
                try { localStorage.setItem('wtc_cashier_store', storeName); } catch {}
              }
              setCashierAuthenticated(true);
              try { localStorage.setItem('wtc_cashier_auth', 'true'); } catch {}
            }} 
            title="Portal Kasir Toko"`;

const replacementLogic = `          <AdminLogin 
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
            }} 
            title="Portal Kasir Toko"`;

content = content.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/App.tsx', content);
