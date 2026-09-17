const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');
content = content.replace(
  "details: \\`Kasir menambahkan +\\${calculatedPoints} poin untuk \\${memberData?.name} (Struk: \\${receiptNo})\\`,",
  "details: `Kasir menambahkan +${calculatedPoints} poin untuk ${memberData?.name} (Struk: ${receiptNo})`,"
);
fs.writeFileSync('server.ts', content);
