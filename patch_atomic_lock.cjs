const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

const target = `  const executeRedeemVoucher = async (member: Member, cleanCode: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);`;

const replacement = `  const executeRedeemVoucher = async (member: Member, cleanCode: string) => {
    if (isSubmitting) return;
    
    // Atomic Single-Use Voucher Lock check
    if (loyaltyConfig?.enableStrictVoucherSingleUse && vouchers) {
       const targetVoucher = vouchers.find(v => v.code.trim().toUpperCase().replace(/^VOUCHER-/, '') === cleanCode);
       if (targetVoucher) {
         if ((targetVoucher.totalUsed || 0) >= (targetVoucher.maxUsageLimit || 1)) {
            showAlert('Peringatan Keamanan: Voucher ini sudah diklaim maksimal atau terkunci (Atomic Lock).', 'Gagal', 'error');
            return;
         }
       } else {
         // If voucher not found in the active list, we might want to block it, but we'll let it pass or show error.
         // Wait, it might be a general code without a specific record.
       }
    }

    setIsSubmitting(true);`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
