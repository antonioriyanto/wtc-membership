const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `  const [cashierName, setCashierName] = useState('Kasir Puri');
  const [cashierStoreName, setCashierStoreName] = useState<string>('Puri Jakarta');`;

const replacement = `  const [cashierName, setCashierName] = useState(() => {
    try { return localStorage.getItem('wtc_cashier_name') || 'Kasir Puri'; } catch {}
    return 'Kasir Puri';
  });
  const [cashierStoreName, setCashierStoreName] = useState<string>(() => {
    try { return localStorage.getItem('wtc_cashier_store') || 'Puri Jakarta'; } catch {}
    return 'Puri Jakarta';
  });`;

content = content.replace(target, replacement);

const loginTarget = `            onLogin={(user, storeName) => {
              if (user) setCashierName(user);
              if (storeName) setCashierStoreName(storeName);
              setCashierAuthenticated(true);
            }}`;

const loginReplacement = `            onLogin={(user, storeName) => {
              if (user) {
                setCashierName(user);
                try { localStorage.setItem('wtc_cashier_name', user); } catch {}
              }
              if (storeName) {
                setCashierStoreName(storeName);
                try { localStorage.setItem('wtc_cashier_store', storeName); } catch {}
              }
              setCashierAuthenticated(true);
              try { localStorage.setItem('wtc_cashier_auth', 'true'); } catch {}
            }}`;

content = content.replace(loginTarget, loginReplacement);

const signOutTarget = `            onSignOut={() => {
              setCashierAuthenticated(false);
              try { localStorage.removeItem('wtc_cashier_auth'); } catch {}
              navigate('/cashier');
            }}`;

const signOutReplacement = `            onSignOut={() => {
              setCashierAuthenticated(false);
              try { 
                localStorage.removeItem('wtc_cashier_auth'); 
                localStorage.removeItem('wtc_cashier_name'); 
                localStorage.removeItem('wtc_cashier_store'); 
              } catch {}
              navigate('/cashier');
            }}`;

content = content.replace(signOutTarget, signOutReplacement);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx state persistence for cashier');
