const fs = require('fs');

let l = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');
const oldTry = `let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(\`Server Response Error (HTTP \${response.status} \${response.statusText}): \${rawText || 'Empty Body'}\`);
      }`;

const newTry = `let result;
      if (rawText.includes('<!doctype html>') || rawText.includes('<html') || rawText.includes('Action required')) {
         if ('serviceWorker' in navigator) {
           navigator.serviceWorker.getRegistrations().then(function(regs) {
             for (let r of regs) r.unregister();
             window.location.reload();
           });
         } else {
           window.location.reload();
         }
         return;
      }
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(\`Server Response Error (HTTP \${response.status} \${response.statusText}): \${rawText || 'Empty Body'}\`);
      }`;

l = l.replace(oldTry, newTry);
fs.writeFileSync('src/components/LoginWall.tsx', l);

let c = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');
const cOldTry = `let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error(\`Server Response Error (HTTP \${response.status} \${response.statusText}): \${rawText || 'Empty Body'}\`);
      }`;
c = c.replace(cOldTry, newTry);
fs.writeFileSync('src/components/CashierTerminalView.tsx', c);
