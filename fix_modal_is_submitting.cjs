const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');
if (!content.includes('isAdjustingPoints')) {
  // We need to inject isAdjustingPoints state
  content = content.replace(
    /const \[isPointAdjustOpen, setIsPointAdjustOpen\] = useState\(false\);/,
    `const [isPointAdjustOpen, setIsPointAdjustOpen] = useState(false);\n  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);`
  );
  
  content = content.replace(
    /onSubmitAdjustment=\{async \(memberId, pointsDelta, reason\) => \{/,
    `isSubmitting={isAdjustingPoints}\n              onSubmitAdjustment={async (memberId, pointsDelta, reason) => {\n                if (isAdjustingPoints) return;\n                setIsAdjustingPoints(true);`
  );
  
  content = content.replace(
    /alert\("Failed to adjust points: " \+ e\.message\);\n                \}/,
    `alert("Failed to adjust points: " + e.message);\n                } finally {\n                  setIsAdjustingPoints(false);\n                }`
  );
  
  fs.writeFileSync('src/App.tsx', content, 'utf-8');
}

let modalContent = fs.readFileSync('src/components/ManualPointAdjustmentModal.tsx', 'utf-8');
if (!modalContent.includes('isSubmitting?: boolean;')) {
  modalContent = modalContent.replace(
    /interface ManualPointAdjustmentModalProps \{/,
    `interface ManualPointAdjustmentModalProps {\n  isSubmitting?: boolean;`
  );
  modalContent = modalContent.replace(
    /export const ManualPointAdjustmentModal: React\.FC<ManualPointAdjustmentModalProps> = \(\{/,
    `export const ManualPointAdjustmentModal: React.FC<ManualPointAdjustmentModalProps> = ({ isSubmitting,`
  );
  
  modalContent = modalContent.replace(
    /<button\n              type="submit"\n              className="px-5 py-2\.5/,
    `<button\n              type="submit"\n              disabled={isSubmitting}\n              className="px-5 py-2.5`
  );
  
  modalContent = modalContent.replace(
    /\{adjustType === 'ADD' \? 'Add Points' : 'Deduct Points'\}/,
    `{isSubmitting ? 'Processing...' : (adjustType === 'ADD' ? 'Add Points' : 'Deduct Points')}`
  );
  
  fs.writeFileSync('src/components/ManualPointAdjustmentModal.tsx', modalContent, 'utf-8');
}

console.log('Fixed ManualPointAdjustmentModal double submission state.');
