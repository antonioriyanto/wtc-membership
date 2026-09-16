const fs = require('fs');

function fixFile(path, replaces) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [from, to] of replaces) {
        content = content.split(from).join(to);
    }
    fs.writeFileSync(path, content);
}

fixFile('src/components/CashierPinResetModal.tsx', [
    ['value={notes}', "value={notes || ''}"],
    ['value={temporaryPin}', "value={temporaryPin || ''}"],
    ['value={directPin}', "value={directPin || ''}"],
    ['value={directPinConfirm}', "value={directPinConfirm || ''}"]
]);

fixFile('src/components/CashierMembersTab.tsx', [
    ['value={editName}', "value={editName || ''}"],
    ['value={editPhone}', "value={editPhone || ''}"],
    ['value={editBirthDate}', "value={editBirthDate || ''}"],
    ['value={editEmail}', "value={editEmail || ''}"],
    ['value={editGender}', "value={editGender || ''}"],
    ['value={editAddress}', "value={editAddress || ''}"],
    ['value={searchInput}', "value={searchInput || ''}"]
]);

fixFile('src/components/CashierTab.tsx', [
    ['value={voucherInput}', "value={voucherInput || ''}"]
]);

fixFile('src/components/CashierTransactionsTab.tsx', [
    ['value={searchInput}', "value={searchInput || ''}"],
    ['value={typeFilter}', "value={typeFilter || ''}"],
    ['value={startDate}', "value={startDate || ''}"],
    ['value={endDate}', "value={endDate || ''}"]
]);

fixFile('src/components/ManualPointAdjustmentModal.tsx', [
    ['value={selectedMemberId}', "value={selectedMemberId || ''}"],
    ['value={reason}', "value={reason || ''}"]
]);

fixFile('src/components/MemberLogin.tsx', [
    ['value={phone}', "value={phone || ''}"]
]);

fixFile('src/components/Header.tsx', [
    ['value={searchQuery}', "value={searchQuery || ''}"]
]);

fixFile('src/components/StoreTransactionsModal.tsx', [
    ['value={searchTerm}', "value={searchTerm || ''}"]
]);

fixFile('src/components/CreateMemberModal.tsx', [
    ['value={registeredStore}', "value={registeredStore || ''}"]
]);

fixFile('src/components/LoginWall.tsx', [
    ['value={username}', "value={username || ''}"],
    ['value={pin}', "value={pin || ''}"]
]);

fixFile('src/components/CreateVoucherModal.tsx', [
    ['value={discountValue}', "value={discountValue || ''}"],
    ['value={minPurchase}', "value={minPurchase || ''}"],
    ['value={validUntil}', "value={validUntil || ''}"]
]);

fixFile('src/components/CampaignsTab.tsx', [
    ['value={search}', "value={search || ''}"],
    ['value={name}', "value={name || ''}"],
    ['value={startAt}', "value={startAt || ''}"],
    ['value={endAt}', "value={endAt || ''}"],
    ['value={targetAudience}', "value={targetAudience || ''}"]
]);

fixFile('src/components/MembersTab.tsx', [
    ['value={search}', "value={search || ''}"],
    ['value={filterTier}', "value={filterTier || ''}"],
    ['value={filterStatus}', "value={filterStatus || ''}"]
]);

fixFile('src/components/SupportTicketsTab.tsx', [
    ['value={search}', "value={search || ''}"],
    ['value={assignedAgent}', "value={assignedAgent || ''}"],
    ['value={adjustPoints}', "value={adjustPoints || ''}"],
    ['value={adjustReason}', "value={adjustReason || ''}"],
    ['value={replyText}', "value={replyText || ''}"]
]);

fixFile('src/components/NationalTransactionsTab.tsx', [
    ['value={searchTerm}', "value={searchTerm || ''}"]
]);

fixFile('src/components/AuditTrailTab.tsx', [
    ['value={search}', "value={search || ''}"],
    ['value={selectedRole}', "value={selectedRole || ''}"],
    ['value={selectedModule}', "value={selectedModule || ''}"]
]);

fixFile('src/components/VouchersTab.tsx', [
    ['value={searchQuery}', "value={searchQuery || ''}"]
]);

