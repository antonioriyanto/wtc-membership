const fs = require('fs');
const file = 'src/components/CashierTerminalView.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(
  "const rawText = await response.text();\n        let result;\n        try {\n          result = JSON.parse(rawText);\n        } catch (parseError: any) {\n          throw new Error(`Parse Error: ${parseError.message}. Raw: '${rawText}'`);\n        }",
  "const result = await response.json();"
);
fs.writeFileSync(file, content);
