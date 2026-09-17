const fs = require('fs');
let content = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

const targetFunction = `    try {
      const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
      if (!member) {
        return;
      }

      // Safeguard: Check if this exact receipt was already processed
      const isDuplicateRecent = transactions.some(t => 
        t.receiptNo && 
        t.receiptNo.trim().toLowerCase() === receiptNo.trim().toLowerCase() && 
        t.memberId === member.id
      );
      if (isDuplicateRecent) {
        showAlert('Nomor struk ini sudah pernah ditukarkan poin sebelumnya.', 'Transaksi Ditolak', 'error');
        return;
      }

      let multiplier = 1.0;
      if (member.tier === 'BLACK') multiplier = 3.0;
      else if (member.tier === 'DIAMOND') multiplier = 2.5;
      else if (member.tier === 'PLATINUM') multiplier = 2.0;
      else if (member.tier === 'GOLD') multiplier = 1.5;

      const calculatedPoints = Math.max(1, Math.floor(Math.floor(amount / 1000) * multiplier));
      const newPoints = (member.points || 0) + calculatedPoints;
      const newLifetime = (member.lifetimePoints || 0) + calculatedPoints;
      const newTotalSpend = (member.totalSpend || 0) + amount;

      const savedTrx: Transaction = {
        id: 'tx_' + Date.now(),
        receiptNo: receiptNo.trim(),
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        storeId: currentStore?.id || currentStore?.code || 'PUR',
        storeName: currentStore?.name || 'Puri Jakarta',
        cashierName: cashierName || \`Kasir \${currentStore?.name || 'Aktif'}\`,
        type: 'EARN',
        amount: amount,
        pointsDelta: calculatedPoints,
        timestamp: new Date().toISOString()
      };

      const updatedMember: Member = {
        ...member,
        points: newPoints,
        lifetimePoints: newLifetime,
        totalSpend: newTotalSpend,
        tier: calculateTier(newPoints),
        lastStoreVisited: currentStore?.name || member.lastStoreVisited,
        lastVisitDate: new Date().toISOString()
      };

      try {
        await safeSetDoc('transactions', savedTrx.id, savedTrx);
        await safeSetDoc('members', updatedMember.id, updatedMember);
      } catch (e: any) {
        console.warn("Backend API unavailable, transaction processed locally:", e);
      }

      setTransactions(prev => {
        // Prevent duplicate if already in state by ID or identical receipt+member
        if (prev.some(t => t.id === savedTrx.id || (t.receiptNo && t.receiptNo.trim().toLowerCase() === savedTrx.receiptNo.trim().toLowerCase() && t.memberId === savedTrx.memberId))) {
          return prev;
        }
        const next = [savedTrx, ...prev.filter(t => t.id !== savedTrx.id)];
        try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
        return next;
      });

      setMembers(prev => {
        const next = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
        try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
        return next;
      });

      showAlert(\`Transaksi berhasil! +\${savedTrx.pointsDelta} Poin ditambahkan ke \${updatedMember.name}.\`, 'Transaksi Berhasil', 'success');`;


const replacementFunction = `    try {
      const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
      if (!member) {
        return;
      }

      // Safeguard: Check locally first (optimistic check)
      const isDuplicateRecent = transactions.some(t => 
        t.receiptNo && 
        t.receiptNo.trim().toLowerCase() === receiptNo.trim().toLowerCase() && 
        t.memberId === member.id
      );
      if (isDuplicateRecent) {
        showAlert('Nomor struk ini sudah pernah ditukarkan poin sebelumnya.', 'Transaksi Ditolak', 'error');
        return;
      }

      // CALLING SECURE SERVER-SIDE BACKEND API
      let savedTrx;
      let updatedMember;
      
      try {
        const response = await fetch('/api/loyalty/add-points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            memberId: member.id,
            amount,
            receiptNo,
            storeId: currentStore?.id || currentStore?.code || 'PUR',
            storeName: currentStore?.name || 'Puri Jakarta',
            cashierName: cashierName || \`Kasir \${currentStore?.name || 'Aktif'}\`
          })
        });

        const result = await response.json();
        
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Gagal menambahkan poin melalui backend server');
        }
        
        // Use the returned server-verified transaction data
        savedTrx = result.data.transactionData;
        
        // Optimistically update the UI member state
        updatedMember = {
          ...member,
          points: result.data.newPoints,
          tier: result.data.newTier,
        };
        
      } catch (backendError: any) {
        console.error("Backend API Error:", backendError);
        showAlert(backendError.message || 'Terjadi kesalahan pada Server-Side Backend saat menambahkan poin', 'Error Server', 'error');
        return;
      }

      // We still update local state optimistically for instant UI feedback 
      // (The onSnapshot listener will eventually sync it perfectly)
      if (savedTrx) {
        setTransactions(prev => {
          if (prev.some(t => t.id === savedTrx.id)) return prev;
          return [savedTrx, ...prev];
        });
      }

      if (updatedMember) {
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      }

      showAlert(\`Transaksi berhasil melalui Secure Backend! +\${savedTrx.pointsDelta} Poin ditambahkan ke \${updatedMember.name}.\`, 'Transaksi Berhasil', 'success');`;

content = content.replace(targetFunction, replacementFunction);
fs.writeFileSync('src/components/CashierTerminalView.tsx', content);
