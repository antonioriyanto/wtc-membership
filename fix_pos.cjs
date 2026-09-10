const fs = require('fs');
const content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

const regex = /const handleAddPoints = async \(memberId: string, points: number, receiptNo: string\) => \{[\s\S]*?\n  \};/m;

const newHandleAddPoints = `
  const handleAddPoints = async (memberId: string, amount: number, receiptNo: string) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;

    try {
      const res = await fetch('/api/transactions', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          receiptNo,
          memberId: member.id,
          storeId: currentStore?.id || 'store-1',
          cashierName: cashierName || 'Kasir Puri',
          type: 'EARN',
          amount: amount
        }) 
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || \`Status \${res.status}\`);
      }

      const data = await res.json();
      const savedTrx = data.transaction;
      const updatedMember = data.member;

      setTransactions(prev => [savedTrx, ...prev]);
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    } catch (e: any) {
      console.error("Error adding points:", e);
      alert("Transaction failed: " + e.message);
    }
  };
`.trim();

fs.writeFileSync('src/components/CashierPOSView.tsx', content.replace(regex, newHandleAddPoints), 'utf-8');
console.log('Fixed CashierPOSView.tsx');
