const fs = require('fs');
const file = 'src/components/CashierTerminalView.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "const result = await response.json();",
  "const rawText = await response.text();\n        let result;\n        try {\n          result = JSON.parse(rawText);\n        } catch (parseError: any) {\n          throw new Error(`Parse Error: ${parseError.message}. Raw: '${rawText}'`);\n        }"
);
fs.writeFileSync(file, content);
