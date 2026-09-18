const fs = require('fs');

// The CustomerMemberView missing import: MembershipCard
let cmv = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');
if (!cmv.includes('import { MembershipCard }')) {
  cmv = cmv.replace('import { StoreCard } from "./StoreCard";', 'import { StoreCard } from "./StoreCard";\nimport { MembershipCard } from "./MembershipCard";');
  fs.writeFileSync('src/components/CustomerMemberView.tsx', cmv);
}
