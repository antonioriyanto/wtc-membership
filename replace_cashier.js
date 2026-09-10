const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf8');

const addPointsTarget = `  const handleAddPoints = async (memberId: string, points: number, receiptNo: string) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;
    const newTrx: Transaction = {
      id: \`INV-\${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}\`,
      receiptNo,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      storeId: currentStore.id,
      storeName: currentStore.name,
      cashierName: cashierLogin || 'System',
      type: 'EARN',
      amount: points * 10000,
      pointsDelta: points,
      timestamp: new Date().toISOString()
    };
    setTransactions([newTrx, ...transactions]);
    setMembers(members.map(m => m.id === member.id ? { ...m, points: m.points + points } : m));
  };`;

const addPointsReplacement = `  const handleAddPoints = async (memberId: string, points: number, receiptNo: string) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;
    const newTrx: Transaction = {
      id: \`INV-\${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}\`,
      receiptNo,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      storeId: currentStore.id,
      storeName: currentStore.name,
      cashierName: cashierLogin || 'System',
      type: 'EARN',
      amount: points * 10000,
      pointsDelta: points,
      timestamp: new Date().toISOString()
    };
    try {
      await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTrx) });
      const updatedPoints = member.points + points;
      await fetch(\`/api/members/\${member.id}\`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ points: updatedPoints }) });
      setTransactions([newTrx, ...transactions]);
      setMembers(members.map(m => m.id === member.id ? { ...m, points: updatedPoints } : m));
    } catch (e) { console.error(e); }
  };`;

content = content.replace(addPointsTarget, addPointsReplacement);
fs.writeFileSync('src/components/CashierPOSView.tsx', content);
