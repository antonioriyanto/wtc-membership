const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const functionsToAdd = `
  const handleMemberSubmitTicket = async (subject: string, message: string, fileUrl?: string) => {
    if (!loggedInMemberId) return;
    const member = members.find(m => m.id === loggedInMemberId);
    if (!member) return;

    const ticketId = 'TCK-' + Date.now().toString().slice(-6);
    const created: any = {
      id: ticketId,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      subject,
      message,
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      messages: [{
        id: 'msg_' + Date.now(),
        sender: 'MEMBER',
        content: message,
        timestamp: new Date().toISOString(),
        attachmentUrl: fileUrl
      }]
    };

    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: member.name,
      actorRole: 'CUSTOMER',
      action: 'TICKET_CREATED',
      details: \`Pelanggan mengirimkan tiket bantuan baru: "\${subject}".\`,
      module: 'SUPPORT_TICKETS'
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'support', ticketId), created);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch (err) {
      console.error("Firestore error:", err);
    }
  };

  const handleAddCampaign = async (campaign: any) => {
    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: 'Superadmin HO',
      actorRole: 'HO_ADMIN',
      action: 'CAMPAIGN_PUBLISHED',
      details: \`Kampanye promosi baru diterbitkan: "\${campaign.name}" (Popup Web App: \${campaign.showAsPopupOnApp ? 'Ya' : 'Tidak'}).\`,
      module: 'VOUCHERS'
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'campaigns', campaign.id), campaign);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch (err) {}
  };

  const handleToggleCampaignStatus = async (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (!target) return;
    try {
      await setDoc(doc(db, 'campaigns', id), { ...target, status: target.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' });
    } catch (err) {}
  };

  const handleDirectPointAdjustment = async (memberId: string, pointsDelta: number, note: string, ticketId: string) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    const updatedMember = { ...target, points: Math.max(0, target.points + pointsDelta) };
    
    const savedTrx: any = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      receiptNo: 'ADJ-' + ticketId,
      memberId: memberId,
      storeId: 'SYS',
      storeName: 'Sistem HO',
      cashierName: 'Admin HO',
      type: pointsDelta > 0 ? 'EARN' : 'REDEEM',
      amount: 0,
      points: Math.abs(pointsDelta),
      timestamp: new Date().toISOString()
    };
    
    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: 'Superadmin HO',
      actorRole: 'HO_ADMIN',
      action: 'MANUAL_POINT_COMPENSATION',
      details: \`Penyelesaian \${ticketId}: Disalurkan \${pointsDelta > 0 ? '+' : ''}\${pointsDelta} Pts ke \${target.name} (\${target.id}). Catatan: \${note}\`,
      module: 'SUPPORT_TICKETS'
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'members', updatedMember.id), updatedMember);
      batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch(err) {}
  };
`;

content = content.replace(
  /const handleUpdateTicket = async \(updated: SupportTicket\) => \{[\s\S]*?catch\(err\) \{\}\n\s*\};/,
  \`const handleUpdateTicket = async (updated: SupportTicket) => {
    try {
      await setDoc(doc(db, 'support', updated.id), updated);
    } catch(err) {}
  };

\${functionsToAdd}\`
);

fs.writeFileSync('src/App.tsx', content);
