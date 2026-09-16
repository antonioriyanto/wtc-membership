const fs = require('fs');

function fixFile(path) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    
    // Fix common uncontrolled input patterns
    // e.g. value={name} -> value={name || ''} if it's a string, or just be careful.
    // Let's do it specific to what's likely the cause.
    // In CreateMemberModal:
    content = content.replace(/value=\{name\}/g, "value={name || ''}");
    content = content.replace(/value=\{phone\}/g, "value={phone || ''}");
    content = content.replace(/value=\{email\}/g, "value={email || ''}");
    content = content.replace(/value=\{birthDate\}/g, "value={birthDate || ''}");
    
    // In CreateVoucherModal:
    content = content.replace(/value=\{title\}/g, "value={title || ''}");
    content = content.replace(/value=\{code\}/g, "value={code || ''}");
    content = content.replace(/value=\{termsText\}/g, "value={termsText || ''}");
    content = content.replace(/value=\{customUrl\}/g, "value={customUrl || ''}");
    
    // CustomerMemberView
    content = content.replace(/value=\{ticketSubject\}/g, "value={ticketSubject || ''}");
    content = content.replace(/value=\{ticketReceipt\}/g, "value={ticketReceipt || ''}");
    content = content.replace(/value=\{ticketMessage\}/g, "value={ticketMessage || ''}");

    // CashierTab
    content = content.replace(/value=\{searchInput\}/g, "value={searchInput || ''}");
    content = content.replace(/value=\{receiptInput\}/g, "value={receiptInput || ''}");
    content = content.replace(/value=\{amountInput\}/g, "value={amountInput || ''}");
    
    fs.writeFileSync(path, content);
}

fixFile('src/components/CreateMemberModal.tsx');
fixFile('src/components/CreateVoucherModal.tsx');
fixFile('src/components/CustomerMemberView.tsx');
fixFile('src/components/CashierTab.tsx');
fixFile('src/components/CashierPinResetModal.tsx');
fixFile('src/components/CashierMembersTab.tsx');

