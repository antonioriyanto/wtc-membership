const fs = require('fs');
const path = require('path');

const modals = [
  'EditMemberModal.tsx',
  'CreateMemberModal.tsx',
  'CreateVoucherModal.tsx',
  'StoreTransactionsModal.tsx',
  'CashierPinResetModal.tsx',
  'CustomerPinPromptModal.tsx',
  'ManualPointAdjustmentModal.tsx',
  'MemberDetailsModal.tsx',
  'MemberPreviewModal.tsx',
  'QuickStoreSwitchModal.tsx'
];

for (const file of modals) {
  const filePath = path.join('src/components', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add animate-fadeIn to backdrop if missing
    content = content.replace(/(<div className="fixed inset-0)([^"]+)(")/, (match, p1, p2, p3) => {
      let classes = p2.split(' ').filter(c => c !== 'animate-fadeIn');
      classes.push('animate-fadeIn');
      return p1 + classes.join(' ') + p3;
    });
    
    fs.writeFileSync(filePath, content);
  }
}
