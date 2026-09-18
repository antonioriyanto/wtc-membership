const fs = require('fs');

let md = fs.readFileSync('src/data/mockData.bak.ts', 'utf8');
md = md.replace('import { Member, Voucher, ,  } from \'../types\';', 'import { Member, Voucher } from \'../types\';');
md = md.replace('import { Member, Voucher, , } from \'../types\';', 'import { Member, Voucher } from \'../types\';');
md = md.replace('import { Member, Voucher, } from \'../types\';', 'import { Member, Voucher } from \'../types\';');
fs.writeFileSync('src/data/mockData.bak.ts', md);
