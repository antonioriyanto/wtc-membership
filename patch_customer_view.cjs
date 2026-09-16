const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const target1 = `  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);`;
const replacement1 = `  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const redeemedVoucherCodes = new Set(
    transactions
      .filter(t => t.memberId === member.id && (t.type === 'REDEEM' || t.type === 'VOUCHER_DISCOUNT') && t.voucherCode)
      .map(t => t.voucherCode?.trim().toUpperCase().replace(/^VOUCHER-/, ''))
  );

  const activeCustomerVouchers = vouchers.filter(v => 
    v.status === 'ACTIVE' && 
    !redeemedVoucherCodes.has(v.code.trim().toUpperCase().replace(/^VOUCHER-/, ''))
  );`;

content = content.replace(target1, replacement1);

// Replace mapping in MEMBERSHIP tab
content = content.replace(
  `{vouchers.map((v, i) => (`,
  `{activeCustomerVouchers.map((v, i) => (`
);

// Replace mapping in REWARDS tab
content = content.replace(
  `{vouchers.map(v => (`,
  `{activeCustomerVouchers.map(v => (`
);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
