const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

const target = `    const cleanCode = voucherCode.trim().toUpperCase().replace(/^VOUCHER-/, '');

    // Intercept with Customer PIN Authorization Modal
    setPinPromptState({
      isOpen: true,
      member,
      actionTitle: 'Otorisasi Klaim Voucher',
      actionDetails: \`Voucher: \${cleanCode} (-50 Poin)\`,
      onVerified: () => {
        executeRedeemVoucher(member, cleanCode);
      }
    });
  };`;

const replacement = `    const cleanCode = voucherCode.trim().toUpperCase().replace(/^VOUCHER-/, '');
    
    // Auto-execute redemption without PIN authorization
    executeRedeemVoucher(member, cleanCode);
  };`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
