const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf-8');

const importLoyalty = "import { calculateTier, calculateEarnedPoints } from './src/lib/loyalty.ts';\n";

const newEndpoint = `
app.post('/api/transactions', async (req, res) => {
  try {
    const data = { ...req.body };
    const type = data.type;
    const amount = Number(data.amount) || 0;
    
    if (!type) {
      return res.status(400).json({ error: "Transaction type is required" });
    }

    if (!data.memberId) {
      return res.status(400).json({ error: "Member ID is required" });
    }
    
    if (typeof data.memberId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.memberId)) {
      return res.status(400).json({ error: "Invalid Member ID format" });
    }

    // Ensure unique receipt number
    let finalReceiptNo = data.receiptNo;
    if (!finalReceiptNo || finalReceiptNo.trim() === '') {
      finalReceiptNo = 'INV-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
    } else {
      const existing = await db.select().from(transactions).where(eq(transactions.receiptNo, finalReceiptNo)).limit(1);
      if (existing.length > 0) {
        finalReceiptNo = \`\${finalReceiptNo}-\${Math.floor(100 + Math.random() * 900)}\`;
      }
    }

    // Use db.transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // 1. Fetch Member
      const memberRows = await tx.select().from(members).where(eq(members.id, data.memberId)).limit(1);
      if (memberRows.length === 0) {
        throw new Error("Member not found");
      }
      const member = memberRows[0];

      // 2. Fetch Config
      const configRows = await tx.select().from(loyaltyConfig).limit(1);
      const config = configRows.length > 0 ? configRows[0] : null;

      // 3. Determine Points Delta
      let finalPointsDelta = 0;
      if (type === 'EARN') {
        if (amount < 0) throw new Error("Amount cannot be negative for EARN");
        finalPointsDelta = calculateEarnedPoints(amount, member.tier, config);
      } else if (type === 'MANUAL_ADJUSTMENT' || type === 'REDEEM') {
        const requestedDelta = Math.floor(Number(data.pointsDelta) || 0);
        if (requestedDelta < 0 && member.points + requestedDelta < 0) {
          throw new Error("Insufficient points balance");
        }
        finalPointsDelta = requestedDelta;
      }

      // 4. Update Member
      const newPoints = member.points + finalPointsDelta;
      const newLifetimePoints = finalPointsDelta > 0 ? member.lifetimePoints + finalPointsDelta : member.lifetimePoints;
      const newTotalSpend = type === 'EARN' ? member.totalSpend + amount : member.totalSpend;
      const newTier = calculateTier(newPoints);

      const updatedMemberRows = await tx.update(members)
        .set({
          points: newPoints,
          lifetimePoints: newLifetimePoints,
          totalSpend: newTotalSpend,
          tier: newTier,
          lastStoreVisited: data.storeId || member.lastStoreVisited,
          lastVisitDate: new Date()
        })
        .where(eq(members.id, member.id))
        .returning();
      
      const updatedMember = updatedMemberRows[0];

      // 5. Create Transaction Record
      const newTrxData = {
        id: data.id || undefined,
        receiptNo: finalReceiptNo,
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        memberEmail: member.email,
        storeId: data.storeId || null,
        storeName: data.storeName || null,
        cashierName: data.cashierName || 'System',
        type: type,
        amount: amount,
        pointsDelta: finalPointsDelta,
        voucherCode: data.voucherCode || null,
        timestamp: new Date(),
        notes: data.notes || null
      };

      const newTransactionRows = await tx.insert(transactions).values(newTrxData).returning();
      const newTransaction = newTransactionRows[0];

      // 6. Audit Log
      await tx.insert(auditLogs).values({
        actorName: data.cashierName || 'System',
        actorRole: 'System',
        action: \`\${type} Transaction\`,
        details: \`Transaction \${newTransaction.id} created. Member \${member.id} points altered by \${finalPointsDelta}. New balance: \${newPoints}\`,
        module: 'POS'
      });

      return { transaction: newTransaction, member: updatedMember };
    });

    res.json(result);
  } catch (err) {
    console.error("POST /api/transactions error:", err);
    res.status(400).json({ error: err.message });
  }
});
`;

let newContent = content.replace(
  /app\.post\('\/api\/transactions', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\}\s*\}\);/m,
  newEndpoint.trim()
);

if (!newContent.includes('calculateTier')) {
  newContent = importLoyalty + newContent;
}

fs.writeFileSync('server.ts', newContent, 'utf-8');
console.log("Replaced /api/transactions successfully.");
