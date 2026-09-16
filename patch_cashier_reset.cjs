const fs = require('fs');

// src/components/CashierPinResetModal.tsx
let modal = fs.readFileSync('src/components/CashierPinResetModal.tsx', 'utf8');
modal = modal.replace(/type="password"/g, "type=\"password\" maxLength={6} pattern=\"[0-9]*\" inputMode=\"numeric\"");
fs.writeFileSync('src/components/CashierPinResetModal.tsx', modal);

