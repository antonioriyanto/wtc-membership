const fs = require('fs');

let modal = fs.readFileSync('src/components/CashierPinResetModal.tsx', 'utf8');

// The replacement script earlier added a second maxLength={6} because the element already had one
// Let's remove the duplicated one on the line below
modal = modal.replace(/type="password" maxLength=\{6\} pattern="\[0-9\]\*" inputMode="numeric"\s+maxLength=\{6\}/g, 
                      'type="password" maxLength={6} pattern="[0-9]*" inputMode="numeric"');

fs.writeFileSync('src/components/CashierPinResetModal.tsx', modal);

