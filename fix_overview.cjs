const fs = require('fs');
let code = fs.readFileSync('src/components/OverviewTab.tsx', 'utf8');

code = code.replace(
  "const ptsDelta = trx.pointsDelta || (trx.type === 'EARN' ? trx.points || 0 : 0);", 
  "const ptsDelta = trx.pointsDelta || 0;"
);

fs.writeFileSync('src/components/OverviewTab.tsx', code);
