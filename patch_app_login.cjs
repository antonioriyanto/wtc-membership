const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /onLoginSuccess=\{\(user, storeIdentifier\) => \{/g,
  "onLoginSuccess={(role, storeIdentifier) => {"
);

code = code.replace(
  /\(s\.username && s\.username\.toUpperCase\(\) === user\.toUpperCase\(\)\) \|\| \n                \(s\.code && s\.code\.toUpperCase\(\) === user\.toUpperCase\(\)\) \|\|\n                \(s\.id && s\.id\.toUpperCase\(\) === user\.toUpperCase\(\)\)/g,
  `(s.username && storeIdentifier && s.username.toUpperCase() === storeIdentifier.toUpperCase()) || 
                (s.code && storeIdentifier && s.code.toUpperCase() === storeIdentifier.toUpperCase()) ||
                (s.id && storeIdentifier && s.id.toUpperCase() === storeIdentifier.toUpperCase())`
);

code = code.replace(
  /if \(user\) \{\n                const displayUser = \(finalStoreName && user\.toUpperCase\(\) !== 'ADMIN' && user\.toUpperCase\(\) !== 'HO'\) \? finalStoreName : user;\n                setCashierName\(displayUser\);\n                try \{ localStorage\.setItem\('wtc_cashier_name', displayUser\); \} catch \{\}\n              \}/g,
  `if (storeIdentifier) {
                const displayUser = (finalStoreName && storeIdentifier.toUpperCase() !== 'ADMIN' && storeIdentifier.toUpperCase() !== 'HO') ? finalStoreName : storeIdentifier;
                setCashierName(displayUser);
                try { localStorage.setItem('wtc_cashier_name', displayUser); } catch {}
              }`
);

code = code.replace(
  /setCashierStoreName\(user\);\n              try \{ localStorage\.setItem\('wtc_cashier_store', user\); \} catch \{\}/g,
  `if(storeIdentifier) { setCashierStoreName(storeIdentifier); }
              try { localStorage.setItem('wtc_cashier_store', storeIdentifier || ''); } catch {}`
);

fs.writeFileSync('src/App.tsx', code);
