const fs = require('fs');

// 1. Rename CashierPOSView to CashierTerminalView
if (fs.existsSync('src/components/CashierPOSView.tsx')) {
  let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf8');
  content = content.replace(/CashierPOSView/g, 'CashierTerminalView');
  content = content.replace(/POS Redemptions/g, 'Cashier Redemptions');
  fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
  fs.unlinkSync('src/components/CashierPOSView.tsx');
  
  // Update import in App.tsx
  let app = fs.readFileSync('src/App.tsx', 'utf8');
  app = app.replace(/CashierPOSView/g, 'CashierTerminalView');
  fs.writeFileSync('src/App.tsx', app);
}

// 2. types.ts
let types = fs.readFileSync('src/types.ts', 'utf8');
types = types.replace(/POS_HARDWARE/g, 'CASHIER_HARDWARE');
fs.writeFileSync('src/types.ts', types);

// 3. sync-worker.ts
let worker = fs.readFileSync('src/lib/sync-worker.ts', 'utf8');
worker = worker.replace(/POS or high-points/g, 'cashier or high-points');
worker = worker.replace(/POS id/g, 'cashier terminal id');
worker = worker.replace(/isPosA/g, 'isCashierA');
worker = worker.replace(/isPosB/g, 'isCashierB');
fs.writeFileSync('src/lib/sync-worker.ts', worker);

