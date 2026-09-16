const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

const target = `      showAlert(\`Transaksi berhasil! +\${savedTrx.pointsDelta} Poin ditambahkan ke \${updatedMember.name}.\`, 'Transaksi Berhasil', 'success');`;

const replacement = `      showAlert(\`Transaksi berhasil! +\${savedTrx.pointsDelta} Poin ditambahkan ke \${updatedMember.name}.\`, 'Transaksi Berhasil', 'success');

      if (loyaltyConfig?.enableWhatsAppNotifications && updatedMember.phone) {
        let phoneNum = updatedMember.phone.replace(/\\D/g, '');
        if (phoneNum.startsWith('0')) {
          phoneNum = '62' + phoneNum.substring(1);
        }
        if (phoneNum.length >= 10) {
          const waText = \`Halo \${updatedMember.name}, Terima kasih telah berbelanja di \${savedTrx.storeName}. Transaksi Anda (Struk: \${savedTrx.receiptNo}) senilai Rp \${savedTrx.amount.toLocaleString('id-ID')} telah berhasil. Anda mendapatkan +\${savedTrx.pointsDelta} Poin! Total Poin Anda saat ini adalah \${updatedMember.points} Poin.\`;
          const encodedText = encodeURIComponent(waText);
          window.open(\`https://wa.me/\${phoneNum}?text=\${encodedText}\`, '_blank');
        }
      }`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
