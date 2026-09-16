const fs = require('fs');

// src/components/CashierSettingsTab.tsx
let settings = fs.readFileSync('src/components/CashierSettingsTab.tsx', 'utf8');
settings = settings.replace(/passwordUpdated/g, "pinUpdated");
settings = settings.replace(/setPasswordUpdated/g, "setPinUpdated");
settings = settings.replace(/handlePasswordSubmit/g, "handlePinSubmit");
settings = settings.replace(/type="password"/g, "type=\"password\" maxLength={6} pattern=\"[0-9]*\" inputMode=\"numeric\"");
settings = settings.replace(/Password/g, "PIN");
settings = settings.replace(/password/g, "pin");
fs.writeFileSync('src/components/CashierSettingsTab.tsx', settings);

