const fs = require('fs');
let content = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

const targetLogic = `    // Check store accounts for Cashier portal (strict manual password check)
    const foundStore = STORE_ACCOUNTS.find(
      s => s.username.toUpperCase() === u.toUpperCase() && (s.pin === p || s.pin.toUpperCase() === p.toUpperCase())
    );

    if (foundStore) {
      onLogin(foundStore.username, foundStore.name);
      return;
    }

    setError('Username atau PIN Cabang tidak valid.');
  };`;

const replacementLogic = `    // Check store accounts for Cashier portal (strict manual password check)
    const foundStore = STORE_ACCOUNTS.find(
      s => s.username.toUpperCase() === u.toUpperCase() && (s.pin === p || s.pin.toUpperCase() === p.toUpperCase())
    );

    if (foundStore) {
      onLogin(foundStore.username, foundStore.name);
      return;
    }

    setError('Username atau PIN Cabang tidak valid.');
  };`;

// Let me inspect the target logic first.
