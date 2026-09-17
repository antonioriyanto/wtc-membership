const fs = require('fs');
let content = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

const targetLogic = `    if (foundStore) {
      onLogin(foundStore.username, foundStore.name);
    } else {`;

const replacementLogic = `    if (foundStore) {
      // Forcefully update the store name immediately before login proceeds to ensure App state sync
      try {
        localStorage.setItem('wtc_cashier_store', foundStore.name);
      } catch (e) {}
      
      onLogin(foundStore.username, foundStore.name);
    } else {`;

content = content.replace(targetLogic, replacementLogic);
fs.writeFileSync('src/components/LoginWall.tsx', content);
