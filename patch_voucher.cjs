const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /id: voucherData\.id \|\| 'vch_' \+ Date\.now\(\),/g,
  "id: (voucherData as any).id || 'vch_' + Date.now(),"
);

code = code.replace(
  /totalClaimed: Number\(voucherData\.totalClaimed\) \|\| 0,/g,
  "totalClaimed: Number((voucherData as any).totalClaimed) || 0,"
);

code = code.replace(
  /totalUsed: Number\(voucherData\.totalUsed\) \|\| 0,/g,
  "totalUsed: Number((voucherData as any).totalUsed) || 0,"
);

fs.writeFileSync('src/App.tsx', code);
