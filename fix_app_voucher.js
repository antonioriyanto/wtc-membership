import fs from 'fs';

// 2. Add Edit functionality to backend server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');
const oldPutMembers = `app.put('/api/members/:id', async (req, res) => {`;
const newPutVouchers = `app.put('/api/vouchers/:id', async (req, res) => {
  try {
    const updated = await db.update(vouchers)
      .set(req.body)
      .where(eq(vouchers.id, req.params.id))
      .returning();
    if (updated.length > 0) {
      res.json(updated[0]);
    } else {
      res.status(404).json({ error: "Voucher not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});\n\napp.put('/api/members/:id', async (req, res) => {`;
serverContent = serverContent.replace(oldPutMembers, newPutVouchers);
fs.writeFileSync('server.ts', serverContent);

// 3. Edit App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

// Add state for edit modal
const stateTarget = `  const [isPointAdjustOpen, setIsPointAdjustOpen] = useState(false);`;
const stateReplacement = `  const [isPointAdjustOpen, setIsPointAdjustOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);`;
appContent = appContent.replace(stateTarget, stateReplacement);

// Add props to VouchersTab
const tabTarget = `                    onCreateVoucher={() => setIsCreateVoucherOpen(true)}
                    onToggleVoucherStatus={() => {}} // Stub
                  />`;
const tabReplacement = `                    onCreateVoucher={() => setIsCreateVoucherOpen(true)}
                    onEditVoucher={(v) => setEditingVoucher(v)}
                    onToggleVoucherStatus={() => {}} // Stub
                  />`;
appContent = appContent.replace(tabTarget, tabReplacement);

// Add edit modal component rendering
const modalTarget = `            <CreateVoucherModal 
              isOpen={isCreateVoucherOpen}
              onClose={() => setIsCreateVoucherOpen(false)}
              stores={stores}
              onCreateVoucher={async (newVoucher) => {`;
const modalReplacement = `            <CreateVoucherModal 
              isOpen={editingVoucher !== null}
              onClose={() => setEditingVoucher(null)}
              stores={stores}
              existingVoucher={editingVoucher}
              onCreateVoucher={async (newVoucher) => {
                if (editingVoucher) {
                  try {
                    const res = await fetch(\`/api/vouchers/\${editingVoucher.id}\`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newVoucher)
                    });
                    const updated = await res.json();
                    setVouchers(vouchers.map(v => v.id === updated.id ? updated : v));
                    setEditingVoucher(null);
                  } catch (err) {
                    console.error("Failed to update voucher", err);
                  }
                }
              }}
            />
            <CreateVoucherModal 
              isOpen={isCreateVoucherOpen && !editingVoucher}
              onClose={() => setIsCreateVoucherOpen(false)}
              stores={stores}
              onCreateVoucher={async (newVoucher) => {`;
appContent = appContent.replace(modalTarget, modalReplacement);

fs.writeFileSync('src/App.tsx', appContent);

