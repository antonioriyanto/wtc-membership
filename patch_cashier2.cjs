const fs = require('fs');

const f1 = 'src/components/CashierTerminalView.tsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(
  "const result = await response.json();",
  `const rawText = await response.text();
        let result;
        try {
          result = JSON.parse(rawText);
        } catch (parseError) {
          throw new Error(\`Parse Error: \${parseError.message}. Raw: '\${rawText}'\`);
        }`
);
fs.writeFileSync(f1, c1);
