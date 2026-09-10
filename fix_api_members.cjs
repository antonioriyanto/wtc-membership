const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

const regex = /app\.put\('\/api\/members\/:id', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: err\.message \}\);\s*\}\s*\}\);/g;

const replacement = `
app.put('/api/members/:id', async (req, res) => {
  try {
    const { name, email, phone, gender, address, birthDate, status, registeredStore } = req.body;
    
    // Only allow specific non-financial fields to be updated via this endpoint
    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).trim() || null;
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = String(address).trim() || null;
    if (status !== undefined) updateData.status = status;
    if (registeredStore !== undefined) updateData.registeredStore = registeredStore;
    
    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }
    
    const updated = await db.update(members)
      .set(updateData)
      .where(eq(members.id, req.params.id))
      .returning();
      
    if (updated.length > 0) {
      res.json(updated[0]);
    } else {
      res.status(404).json({ error: "Member not found" });
    }
  } catch (err: any) {
    console.error("PUT /api/members/:id error:", err);
    res.status(500).json({ error: err.message });
  }
});
`.trim();

content = content.replace(regex, replacement);
fs.writeFileSync('server.ts', content, 'utf-8');
console.log('Fixed PUT /api/members/:id');
