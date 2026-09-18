const fs = require('fs');
let l = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

l = l.replace('export const LoginWall', 'export const AdminLogin');
fs.writeFileSync('src/components/LoginWall.tsx', l);
