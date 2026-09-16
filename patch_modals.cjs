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
    
    // Replace the first inner div className if it's the modal container
    // usually it starts with <div className="bg-white or <div className="relative bg-white
    
    // Let's use a regex that finds the div immediately after the backdrop
    content = content.replace(
      /(<div className="fixed inset-0[^>]*?animate-fadeIn">[\s\S]*?<div\s+className=")([^"]+)(")/,
      (match, p1, p2, p3) => {
        if (!p2.includes('animate-modalIn')) {
          return p1 + p2 + ' animate-modalIn' + p3;
        }
        return match;
      }
    );
    
    fs.writeFileSync(filePath, content);
  }
}

