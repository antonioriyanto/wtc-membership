import fs from 'fs';

// 1. Fix CashierPOSView.tsx
let cashierContent = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf8');

const oldAddPoints = `  const handleAddPoints = async (memberId: string, points: number, receiptNo: string) => {
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

const newAddPoints = `  const handleAddPoints = async (memberId: string, points: number, receiptNo: string) => {
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
    } catch (e) {
      console.error(e);
    }
  };`;

const oldRedeemVoucher = `  const handleRedeemVoucher = (memberId: string, voucherCode: string) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;

    const newTrx: Transaction = {
      id: \`VOUCHER-\${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}\`,
      receiptNo: 'VOUCHER-POS',
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      storeId: currentStore.id,
      storeName: currentStore.name,
      cashierName: cashierLogin || 'System',
      type: 'REDEEM',
      amount: 0,
      pointsDelta: -50,
      timestamp: new Date().toISOString()
    };

    setTransactions([newTrx, ...transactions]);
    setMembers(members.map(m => m.id === member.id ? { ...m, points: m.points - 50 } : m));
  };`;

const newRedeemVoucher = `  const handleRedeemVoucher = async (memberId: string, voucherCode: string) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;

    const newTrx: Transaction = {
      id: \`VOUCHER-\${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}\`,
      receiptNo: 'VOUCHER-POS',
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      storeId: currentStore.id,
      storeName: currentStore.name,
      cashierName: cashierLogin || 'System',
      type: 'REDEEM',
      amount: 0,
      pointsDelta: -50,
      timestamp: new Date().toISOString()
    };

    try {
      await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newTrx) });
      const updatedPoints = member.points - 50;
      await fetch(\`/api/members/\${member.id}\`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ points: updatedPoints }) });
      setTransactions([newTrx, ...transactions]);
      setMembers(members.map(m => m.id === member.id ? { ...m, points: updatedPoints } : m));
    } catch (e) {
      console.error(e);
    }
  };`;

cashierContent = cashierContent.replace(oldAddPoints, newAddPoints);
cashierContent = cashierContent.replace(oldRedeemVoucher, newRedeemVoucher);
fs.writeFileSync('src/components/CashierPOSView.tsx', cashierContent);


// 2. Fix App.tsx polling
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const targetAppStr = `    }

    loadData();
  }, []);`;

const newAppStr = `    }

    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);`;

appContent = appContent.replace(targetAppStr, newAppStr);
fs.writeFileSync('src/App.tsx', appContent);
