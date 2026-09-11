const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const loginTarget = `            onLogin={(user, storeName) => {
              if (user) {
                setCashierName(user);
                try { localStorage.setItem('wtc_cashier_name', user); } catch {}
              }`;

const loginReplacement = `            onLogin={(user, storeName) => {
              if (user) {
                const displayUser = (storeName && user.toUpperCase() !== 'ADMIN' && user.toUpperCase() !== 'HO') ? storeName : user;
                setCashierName(displayUser);
                try { localStorage.setItem('wtc_cashier_name', displayUser); } catch {}
              }`;

content = content.replace(loginTarget, loginReplacement);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed Cashier Name display upon login');
