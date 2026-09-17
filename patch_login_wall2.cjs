const fs = require('fs');
let content = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

const targetLogic = `    // Check store accounts for Cashier portal (strict manual password check)
    const foundStore = STORE_ACCOUNTS.find(
      s => s.username.toUpperCase() === u.toUpperCase() && (s.pin === p || s.pin.toUpperCase() === p.toUpperCase())
    );

    if (foundStore) {
      // Forcefully update the store name immediately before login proceeds to ensure App state sync
      try {
        localStorage.setItem('wtc_cashier_store', foundStore.name);
      } catch (e) {}
      
      onLogin(foundStore.username, foundStore.name);
      return;
    }`;

const replacementLogic = `    // Check store accounts for Cashier portal (strict manual password check)
    const foundStore = STORE_ACCOUNTS.find(
      s => s.username.toUpperCase() === u.toUpperCase() && (s.pin === p || s.pin.toUpperCase() === p.toUpperCase())
    );

    if (foundStore) {
      // Forcefully update the store name immediately before login proceeds to ensure App state sync
      try {
        localStorage.setItem('wtc_cashier_name', foundStore.name);
        localStorage.setItem('wtc_cashier_store', foundStore.name);
      } catch (e) {}
      
      onLogin(foundStore.username, foundStore.name);
      return;
    }`;

content = content.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/components/LoginWall.tsx', content);
