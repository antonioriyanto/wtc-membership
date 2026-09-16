const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

const target = `    // 2. Increment voucher quota in Firestore
    try {
      
      
      // We don't have the exact voucher ID here safely, but we can query it if needed.
      // However, keeping the quota sync local is fine if we are not strict. 
      // A better approach is querying by code if needed, but let's just skip the fetch error for now.
    } catch (e: any) {
      console.warn("Firestore update failed:", e);
    }`;

const replacement = `    // 2. Increment voucher quota in Firestore
    try {
      if (vouchers) {
        const targetVoucher = vouchers.find(v => v.code.trim().toUpperCase().replace(/^VOUCHER-/, '') === cleanCode);
        if (targetVoucher) {
          const voucherRef = doc(db, 'vouchers', targetVoucher.id);
          await updateDoc(voucherRef, {
            totalUsed: increment(1),
            totalClaimed: increment(1)
          });
        }
      }
    } catch (e: any) {
      console.warn("Firestore update failed:", e);
    }`;

content = content.replace(target, replacement);

fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
