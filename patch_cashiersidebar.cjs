const fs = require('fs');
let code = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

code = code.replace(
  /onSwitchPerspective=\{onSwitchPerspective\}/,
  ""
);

fs.writeFileSync('src/components/CashierTerminalView.tsx', code);
