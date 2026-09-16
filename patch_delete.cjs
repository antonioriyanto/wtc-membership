const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handleDeleteMember = async \(memberId: string\) => \{[\s\S]*?\};/;

const newFunction = `const handleDeleteMember = async (memberId: string) => {
    try {
      // 1. Delete Member Document from Firestore
      await deleteDoc(doc(db, 'members', memberId));
      
      // 2. Delete All Associated Transactions
      const q = query(collection(db, 'transactions'), where('memberId', '==', memberId));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = [];
      querySnapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });
      
      await Promise.all(deletePromises);

      // Audit Log 
      const auditSaved = localStorage.getItem('wtc_audit_logs');
      const auditList = auditSaved ? JSON.parse(auditSaved) : [];
      const newLog = {
        id: 'AL-' + Date.now().toString().slice(-4),
        timestamp: new Date().toISOString(),
        actorName: 'HO Admin',
        actorRole: 'ADMIN',
        action: 'MEMBER_DELETED',
        details: \`Menghapus member (\${memberId}) beserta seluruh riwayat poin dan \${querySnapshot.size} transaksi terkait secara permanen.\`,
        module: 'MEMBERS'
      };
      localStorage.setItem('wtc_audit_logs', JSON.stringify([newLog, ...auditList]));

      // Fallback local state update in case listener is slow
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setTransactions(prev => prev.filter(t => t.memberId !== memberId));

    } catch (err) {
      console.warn("Could not fully sync member delete to Firestore:", err);
      // Fallback if completely offline
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setTransactions(prev => prev.filter(t => t.memberId !== memberId));
    }
  };`;

app = app.replace(regex, newFunction);

fs.writeFileSync('src/App.tsx', app);
