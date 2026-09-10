import fs from 'fs';

// Fix server.ts
let serverContent = fs.readFileSync('server.ts', 'utf8');

const targetPostVoucher = `app.post('/api/vouchers', async (req, res) => {
  try {
    const newVoucher = await db.insert(vouchers).values(req.body).returning();`;

const repPostVoucher = `app.post('/api/vouchers', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validUntil) data.validUntil = new Date(data.validUntil);
    const newVoucher = await db.insert(vouchers).values(data).returning();`;

serverContent = serverContent.replace(targetPostVoucher, repPostVoucher);

const targetPutVoucher = `app.put('/api/vouchers/:id', async (req, res) => {
  try {
    const updated = await db.update(vouchers)
      .set(req.body)
      .where(eq(vouchers.id, req.params.id))`;

const repPutVoucher = `app.put('/api/vouchers/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validUntil) data.validUntil = new Date(data.validUntil);
    const updated = await db.update(vouchers)
      .set(data)
      .where(eq(vouchers.id, req.params.id))`;

serverContent = serverContent.replace(targetPutVoucher, repPutVoucher);
fs.writeFileSync('server.ts', serverContent);


// Fix App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const targetAppEdit = `                    const res = await fetch(\`/api/vouchers/\${editingVoucher.id}\`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newVoucher)
                    });
                    const updated = await res.json();
                    setVouchers(vouchers.map(v => v.id === updated.id ? updated : v));
                    setEditingVoucher(null);`;

const repAppEdit = `                    const res = await fetch(\`/api/vouchers/\${editingVoucher.id}\`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(newVoucher)
                    });
                    const updated = await res.json();
                    if (res.ok) {
                      setVouchers(vouchers.map(v => v.id === updated.id ? updated : v));
                      setEditingVoucher(null);
                    } else {
                      console.error(updated.error);
                    }`;

appContent = appContent.replace(targetAppEdit, repAppEdit);

const targetAppCreate = `                  const res = await fetch('/api/vouchers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newVoucher)
                  });
                  const created = await res.json();
                  setVouchers([created, ...vouchers]);`;

const repAppCreate = `                  const res = await fetch('/api/vouchers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newVoucher)
                  });
                  const created = await res.json();
                  if (res.ok) {
                    setVouchers([created, ...vouchers]);
                  } else {
                    console.error(created.error);
                  }`;

appContent = appContent.replace(targetAppCreate, repAppCreate);
fs.writeFileSync('src/App.tsx', appContent);

