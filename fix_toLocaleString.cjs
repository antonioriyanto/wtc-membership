const fs = require('fs');
const glob = require('glob'); // Need to install or just use fs.readdirSync if glob is not available

// We will just patch the most likely files manually.
const filesToPatch = [
  'src/components/CustomerMemberView.tsx',
  'src/components/MemberPreviewModal.tsx',
  'src/components/MemberDetailsModal.tsx',
  'src/components/OverviewTab.tsx',
  'src/components/ManualPointAdjustmentModal.tsx',
  'src/components/NationalTransactionsTab.tsx',
  'src/components/VouchersTab.tsx',
  'src/components/CashierTab.tsx',
  'src/components/CashierMembersTab.tsx',
  'src/components/StoreTransactionsModal.tsx',
  'src/components/SupportTicketsTab.tsx',
  'src/components/EditMemberModal.tsx',
  'src/components/NationalActivityNotifications.tsx'
];

filesToPatch.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    // member.points.toLocaleString -> (member.points || 0).toLocaleString
    content = content.replace(/member\.points\.toLocaleString/g, '(member.points || 0).toLocaleString');
    
    // member.lifetimePoints.toLocaleString -> (member.lifetimePoints || 0).toLocaleString
    content = content.replace(/member\.lifetimePoints\.toLocaleString/g, '(member.lifetimePoints || 0).toLocaleString');
    
    // (nextTierPoints - member.points).toLocaleString -> ((nextTierPoints || 0) - (member.points || 0)).toLocaleString
    content = content.replace(/\(nextTierPoints - member\.points\)\.toLocaleString/g, '((nextTierPoints || 0) - (member.points || 0)).toLocaleString');
    
    // loyaltyConfig.amountUnit.toLocaleString -> (loyaltyConfig.amountUnit || 0).toLocaleString
    content = content.replace(/loyaltyConfig\.amountUnit\)\.toLocaleString/g, 'loyaltyConfig.amountUnit || 0).toLocaleString');
    
    // voucher.discountValue.toLocaleString -> (voucher.discountValue || 0).toLocaleString
    content = content.replace(/voucher\.discountValue\)\.toLocaleString/g, 'voucher.discountValue || 0).toLocaleString');
    
    // store.todayRevenue.toLocaleString -> (store.todayRevenue || 0).toLocaleString
    content = content.replace(/store\.todayRevenue\.toLocaleString/g, '(store.todayRevenue || 0).toLocaleString');
    
    // linkedMember.points.toLocaleString -> (linkedMember.points || 0).toLocaleString
    content = content.replace(/linkedMember\.points\.toLocaleString/g, '(linkedMember.points || 0).toLocaleString');
    
    // selectedActivity.amount.toLocaleString -> (selectedActivity.amount || 0).toLocaleString
    content = content.replace(/selectedActivity\.amount\.toLocaleString/g, '(selectedActivity.amount || 0).toLocaleString');

    fs.writeFileSync(file, content);
  }
});
