const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

const regex2 = /const handleRedeemVoucher = async \(memberId: string, voucherCode: string\) => \{[\s\S]*?\n  \};/m;

const newHandleRedeemVoucher = `
  const handleRedeemVoucher = async (memberId: string, voucherCode: string) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;

    try {
      const res = await fetch('/api/transactions', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          receiptNo: \`VOUCHER-\${voucherCode}\`,
          memberId: member.id,
          storeId: currentStore?.id || 'store-1',
          storeName: currentStore?.name || 'Puri Jakarta',
          cashierName: cashierName || 'Kasir Puri',
          type: 'REDEEM',
          voucherCode: voucherCode,
          amount: 0,
          pointsDelta: -50
        }) 
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || \`Status \${res.status}\`);
      }

      const data = await res.json();
      const savedTrx = data.transaction;
      const updatedMember = data.member;

      setTransactions(prev => [savedTrx, ...prev]);
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      alert('Voucher redeemed successfully!');
    } catch (e: any) {
      console.error("Error redeeming voucher:", e);
      alert("Failed to redeem voucher: " + e.message);
    }
  };
`.trim();

content = content.replace(regex2, newHandleRedeemVoucher);
fs.writeFileSync('src/components/CashierPOSView.tsx', content, 'utf-8');
console.log('Fixed CashierPOSView.tsx redeem voucher');
