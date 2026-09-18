const fs = require('fs');
const f = 'src/components/LoginWall.tsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(
  "fetch('/api/auth/employee-login', {",
  "fetch('/api/auth/employee-login?_t=' + Date.now(), {"
);
fs.writeFileSync(f, c);
