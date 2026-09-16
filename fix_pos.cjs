const fs = require('fs');

// 1. Update metadata and index
const metaPath = 'metadata.json';
let meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
meta.name = "Watch Club - Loyalty System";
meta.description = meta.description.replace(/POS/g, 'Interface');
fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));

const indexPath = 'index.html';
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/Watch Club - Loyalty & POS System/g, 'Watch Club - Loyalty System');
html = html.replace(/POS/g, 'Interface');
fs.writeFileSync(indexPath, html);

// 2. Update AGENTS.md
const agentsPath = 'AGENTS.md';
if (fs.existsSync(agentsPath)) {
  let agents = fs.readFileSync(agentsPath, 'utf8');
  agents = agents.replace(/Point of Sales \(POS\)/g, 'Loyalty');
  agents = agents.replace(/POS/g, 'Interface');
  fs.writeFileSync(agentsPath, agents);
}

// 3. Update PortalSwitcher
const portalSwitcherPath = 'src/components/PortalSwitcher.tsx';
let portalSwitcher = fs.readFileSync(portalSwitcherPath, 'utf8');
portalSwitcher = portalSwitcher.replace(/POS Kasir/g, 'Terminal Kasir');
fs.writeFileSync(portalSwitcherPath, portalSwitcher);

// 4. Update StoreTransactionsModal
const storeTransPath = 'src/components/StoreTransactionsModal.tsx';
let storeTrans = fs.readFileSync(storeTransPath, 'utf8');
storeTrans = storeTrans.replace(/POS Watch Club/g, 'Watch Club');
fs.writeFileSync(storeTransPath, storeTrans);

// 5. Update EditMemberModal
const editMemberPath = 'src/components/EditMemberModal.tsx';
let editMember = fs.readFileSync(editMemberPath, 'utf8');
editMember = editMember.replace(/POS kasir/g, 'kasir');
fs.writeFileSync(editMemberPath, editMember);

// 6. Update CustomerPinPromptModal
const pinPromptPath = 'src/components/CustomerPinPromptModal.tsx';
let pinPrompt = fs.readFileSync(pinPromptPath, 'utf8');
pinPrompt = pinPrompt.replace(/POS PIN/g, 'Cashier PIN');
fs.writeFileSync(pinPromptPath, pinPrompt);

// 7. Update AuditTrailTab
const auditPath = 'src/components/AuditTrailTab.tsx';
let audit = fs.readFileSync(auditPath, 'utf8');
audit = audit.replace(/mesin POS/g, 'sistem kasir');
fs.writeFileSync(auditPath, audit);

// 8. Update App.tsx
const appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');
app = app.replace(/Terminal Kasir POS/g, 'Terminal Kasir');
app = app.replace(/physical store POS/g, 'physical store');
app = app.replace(/Store Cashier POS/g, 'Store Cashier');
fs.writeFileSync(appPath, app);

// 9. Update comments in lib files
const libFiles = [
  'src/lib/pinCrypto.ts',
  'src/lib/sync-worker.ts',
  'src/lib/canonicalMember.ts',
  'src/lib/memberAuthClient.ts'
];

for (const file of libFiles) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/& POS/g, '');
    content = content.replace(/Cashier POS/g, 'Cashier Portal');
    content = content.replace(/offline POS/g, 'offline Cashier');
    content = content.replace(/boutique POS/g, 'boutique terminal');
    fs.writeFileSync(file, content);
  }
}

console.log("Done updating strings");
