const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const targetMethod = `  const handleMemberSubmitTicket = async (subject: string, message: string, fileUrl?: string) => {`;

const newMethod = `  const handleCashierSubmitTicket = async (ticketData: any) => {
    const ticketId = 'TCK-' + Date.now().toString().slice(-6);
    const created: any = {
      id: ticketId,
      ...ticketData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: 'msg_' + Date.now(),
        sender: 'CASHIER',
        text: ticketData.messageText,
        timestamp: new Date().toISOString()
      }]
    };
    
    // Remove transient field used just for creation
    delete created.messageText;

    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: cashierName,
      actorRole: 'STORE_CASHIER',
      action: 'TICKET_CREATED',
      details: \`Kasir \${cashierName} membuat tiket bantuan baru: "\${ticketData.subject}".\`,
      module: 'SUPPORT_TICKETS'
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'support', ticketId), created);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
      
      setSupportTickets(prev => [created, ...prev]);
    } catch (err) {
      console.error("Gagal submit tiket kasir", err);
      throw err;
    }
  };

  const handleMemberSubmitTicket = async (subject: string, message: string, fileUrl?: string) => {`;

content = content.replace(targetMethod, newMethod);

const targetProp = `supportTickets={supportTickets}
            setSupportTickets={setSupportTickets}`;
const propReplacement = `supportTickets={supportTickets}
            setSupportTickets={setSupportTickets}
            onSubmitTicket={handleCashierSubmitTicket}`;

content = content.replace(targetProp, propReplacement);

fs.writeFileSync('src/App.tsx', content);
