const fs = require('fs');

// --- CashierPOSView.tsx ---
let posContent = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');
if (!posContent.includes('isSubmitting')) {
  posContent = posContent.replace(
    /const \[activeTab, setActiveTab\] = useState<CashierTabType>\('cashier'\);/g,
    `const [activeTab, setActiveTab] = useState<CashierTabType>('cashier');\n  const [isSubmitting, setIsSubmitting] = useState(false);`
  );
  
  posContent = posContent.replace(
    /const handleAddPoints = async \(memberId: string, amount: number, receiptNo: string\) => \{/g,
    `const handleAddPoints = async (memberId: string, amount: number, receiptNo: string) => {\n    if (isSubmitting) return;\n    setIsSubmitting(true);`
  );
  
  posContent = posContent.replace(
    /alert\("Transaction failed: " \+ e\.message\);\n    \}/g,
    `alert("Transaction failed: " + e.message);\n    } finally {\n      setIsSubmitting(false);\n    }`
  );
  posContent = posContent.replace(
    /setMembers\(prev => prev\.map\(m => m\.id === updatedMember\.id \? updatedMember : m\)\);\n    \} catch/g,
    `setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));\n    } catch`
  );
  
  // Redeem
  posContent = posContent.replace(
    /const handleRedeemVoucher = async \(memberId: string, voucherCode: string\) => \{/g,
    `const handleRedeemVoucher = async (memberId: string, voucherCode: string) => {\n    if (isSubmitting) return;\n    setIsSubmitting(true);`
  );
  posContent = posContent.replace(
    /alert\("Failed to redeem voucher: " \+ e\.message\);\n    \}/g,
    `alert("Failed to redeem voucher: " + e.message);\n    } finally {\n      setIsSubmitting(false);\n    }`
  );

  // Pass it down to CashierTab if needed, or CashierTab has its own?
  posContent = posContent.replace(
    /<CashierTab/g,
    `<CashierTab isSubmitting={isSubmitting}`
  );
  
  fs.writeFileSync('src/components/CashierPOSView.tsx', posContent, 'utf-8');
}

// --- CashierTab.tsx ---
let tabContent = fs.readFileSync('src/components/CashierTab.tsx', 'utf-8');
if (!tabContent.includes('isSubmitting?: boolean;')) {
  tabContent = tabContent.replace(
    /interface CashierTabProps \{/,
    `interface CashierTabProps {\n  isSubmitting?: boolean;`
  );
  tabContent = tabContent.replace(
    /export const CashierTab: React\.FC<CashierTabProps> = \(\{ members, transactions, onAddPoints, onRedeemVoucher, onOpenCreateMember \}\) => \{/,
    `export const CashierTab: React.FC<CashierTabProps> = ({ members, transactions, onAddPoints, onRedeemVoucher, onOpenCreateMember, isSubmitting }) => {`
  );
  
  // Add Points Button
  tabContent = tabContent.replace(
    /<button \n                onClick=\{handleAddPointsSubmit\}\n                disabled=\{parsedAmount <= 0\}/,
    `<button \n                onClick={handleAddPointsSubmit}\n                disabled={isSubmitting || parsedAmount <= 0}`
  );
  
  // Claim Voucher Button
  tabContent = tabContent.replace(
    /<button \n                      onClick=\{\(\) => executeClaimVoucher\(v\.code\)\}/,
    `<button \n                      onClick={() => executeClaimVoucher(v.code)}\n                      disabled={isSubmitting}`
  );
  
  fs.writeFileSync('src/components/CashierTab.tsx', tabContent, 'utf-8');
}

console.log('Fixed double submission state.');
