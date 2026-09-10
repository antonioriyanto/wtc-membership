const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// handleUpdateMember
content = content.replace(
  /const handleUpdateMember = async \([^)]+\) => \{[\s\S]*?try \{[\s\S]*?catch \(err\) \{[\s\S]*?\}\n  \};/,
  `const handleUpdateMember = async (updatedMember: Member) => {
    try {
      await setDoc(doc(db, 'members', updatedMember.id), updatedMember);
    } catch (err) {
      console.warn("Could not sync member update to Firestore:", err);
    }
  };`
);

// handleDeleteMember
content = content.replace(
  /const handleDeleteMember = async \([^)]+\) => \{[\s\S]*?try \{[\s\S]*?catch \(err\) \{[\s\S]*?\}\n  \};/,
  `const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'members', memberId));
    } catch (err) {
      console.warn("Could not sync member delete to Firestore:", err);
    }
  };`
);

// handleMemberSubmitTicket
content = content.replace(
  /setSupportTickets\(prev => \{[\s\S]*?\}\);\n\n    \/\/ Audit log[\s\S]*?setAuditLogs\(prev => \{[\s\S]*?\}\);\n\n    try \{[\s\S]*?\} catch \{\}/,
  `try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'support', ticketId), created);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch (err) {
      console.error("Firestore error:", err);
    }`
);

// handleAddCampaign
content = content.replace(
  /setCampaigns\(prev => \{[\s\S]*?\}\);\n\n    const auditEntry[\s\S]*?setAuditLogs\(prev => \{[\s\S]*?\}\);\n\n    try \{[\s\S]*?\} catch \{\}/,
  `const auditEntry: AuditLog = {
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
    } catch (err) {}`
);

// handleToggleCampaignStatus
content = content.replace(
  /const handleToggleCampaignStatus = \(id: string\) => \{[\s\S]*?return next;\n    \}\);\n  \};/,
  `const handleToggleCampaignStatus = async (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (!target) return;
    try {
      await setDoc(doc(db, 'campaigns', id), { ...target, status: target.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' });
    } catch (err) {}
  };`
);

// handleUpdateTicket
content = content.replace(
  /const handleUpdateTicket = \(updated: SupportTicket\) => \{[\s\S]*?return next;\n    \}\);\n  \};/,
  `const handleUpdateTicket = async (updated: SupportTicket) => {
    try {
      await setDoc(doc(db, 'support', updated.id), updated);
    } catch(err) {}
  };`
);

// handleDirectPointAdjustment
content = content.replace(
  /setMembers\(prev => \{[\s\S]*?\}\);\n\n    setTransactions\(prev => \{[\s\S]*?\}\);\n\n    \/\/ Record system audit log[\s\S]*?setAuditLogs\(prev => \{[\s\S]*?\}\);/,
  `const auditEntry: AuditLog = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: 'Superadmin HO',
      actorRole: 'HO_ADMIN',
      action: 'MANUAL_POINT_COMPENSATION',
      details: \`Penyelesaian \${ticketId}: Disalurkan \${pointsDelta > 0 ? '+' : ''}\${pointsDelta} Pts ke \${member.name} (\${member.membershipId}). Catatan: \${note}\`,
      module: 'SUPPORT_TICKETS'
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'members', updatedMember.id), updatedMember);
      batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch(err) {}`
);

fs.writeFileSync('src/App.tsx', content);
