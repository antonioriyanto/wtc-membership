const fs = require('fs');

const f = 'src/components/LoginWall.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(
  "throw new Error(`Server returned invalid response: ${rawText || 'Empty Response'}`);",
  "throw new Error(`Server Response Error (HTTP ${response.status} ${response.statusText}): ${rawText || 'Empty Body'}`);"
);
fs.writeFileSync(f, c);
