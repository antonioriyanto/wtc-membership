const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const target = `  const activeCustomerVouchers = vouchers.filter(v => 
    v.status === 'ACTIVE' && 
    (v.totalUsed || 0) < (v.maxUsageLimit || Infinity) &&
    !redeemedVoucherCodes.has(v.code.trim().toUpperCase().replace(/^VOUCHER-/, ''))
  );`;

const replacement = `  const activeCustomerVouchers = vouchers.filter(v => 
    v.status === 'ACTIVE' && 
    (v.totalClaimed || 0) < (v.maxUsageLimit || Infinity) &&
    !redeemedVoucherCodes.has(v.code.trim().toUpperCase().replace(/^VOUCHER-/, ''))
  );`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
