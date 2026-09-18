const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Fix subject -> ticketData.subject
code = code.replace(
  /details: \`Pelanggan mengirimkan tiket bantuan baru: "\$\{subject\}"\.\`,/g,
  "details: `Pelanggan mengirimkan tiket bantuan baru: \"${ticketData.subject}\".`,"
);

// Fix onLogin -> onLoginSuccess for AdminLogin (or LoginWall)
code = code.replace(
  /<AdminLogin\s+onLogin=\{/g,
  "<AdminLogin\n            onLoginSuccess={"
);

// Fix dummy Member fallback
code = code.replace(
  /\{ id: loggedInMemberId \|\| 'guest', name: 'Member', phone: '', membershipId: 'WTC-000000', points: 0, tier: 'SILVER', joinDate: new Date\(\)\.toISOString\(\), registeredStore: 'Puri Jakarta', lastStoreVisited: 'Puri Jakarta', lastVisitDate: new Date\(\)\.toISOString\(\), email: '', lifetimePoints: 0, totalSpend: 0 \}/g,
  "{ id: loggedInMemberId || 'guest', name: 'Member', phone: '', membershipId: 'WTC-000000', points: 0, tier: 'SILVER', joinDate: new Date().toISOString(), registeredStore: 'Puri Jakarta', lastStoreVisited: 'Puri Jakarta', lastVisitDate: new Date().toISOString(), email: '', lifetimePoints: 0, totalSpend: 0, gender: 'Wanita', status: 'ACTIVE' }"
);

fs.writeFileSync('src/App.tsx', code);
