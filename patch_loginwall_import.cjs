const fs = require('fs');
let l = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');
if (!l.includes("import { WatchClubLogo }")) {
  l = l.replace("import { hashStringSHA256", "import { WatchClubLogo } from './WatchClubLogo';\nimport { hashStringSHA256");
  fs.writeFileSync('src/components/LoginWall.tsx', l);
}
