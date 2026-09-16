const fs = require('fs');

function replaceFile(path, replacements) {
    if (!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.split(search).join(replace);
    }
    fs.writeFileSync(path, content);
}

// EditMemberModal
replaceFile('src/components/EditMemberModal.tsx', [
    ['Total Belanja Akumulatif', 'Total Transaksi Akumulatif'],
    ['menggunakan poin belanja', 'menggunakan poin loyalty']
]);

// StoreTransactionsModal
replaceFile('src/components/StoreTransactionsModal.tsx', [
    ['Rata-Rata Belanja', 'Rata-Rata Transaksi'],
    ['Belanja (Earn)', 'Mendapatkan Poin (Earn)'],
    ['Nilai Belanja', 'Nilai Transaksi'],
    ['BELANJA (EARN)', 'EARN POIN']
]);

// NationalTransactionsTab
replaceFile('src/components/NationalTransactionsTab.tsx', [
    ['Nominal Belanja', 'Nominal Transaksi'],
    ['transaksi belanja, penukaran voucher', 'aktivitas loyalty, penukaran voucher'],
    ['Belanja & Earn Poin', 'Earn Poin'],
    ['Nilai Belanja', 'Nilai Transaksi'],
    ['Belanja Kasir', 'Penerbitan Poin'],
    ['Nilai Transaksi Belanja', 'Nilai Transaksi']
]);

// MembersTab
replaceFile('src/components/MembersTab.tsx', [
    ['Total Belanja', 'Total Transaksi']
]);

// CashierMembersTab
replaceFile('src/components/CashierMembersTab.tsx', [
    ['Total Belanja', 'Total Transaksi']
]);

// AuditTrailTab
replaceFile('src/components/AuditTrailTab.tsx', [
    ['Min. Belanja', 'Min. Transaksi'],
    ['total belanja melampaui', 'total transaksi melampaui'],
    ['aktivitas transaksi belanja konsumen', 'aktivitas loyalty konsumen'],
    ['No. Struk belanja', 'No. Struk transaksi']
]);

// VouchersTab
replaceFile('src/components/VouchersTab.tsx', [
    ['Min. Belanja', 'Min. Transaksi']
]);

// CreateVoucherModal
replaceFile('src/components/CreateVoucherModal.tsx', [
    ['Min. Belanja', 'Min. Transaksi']
]);

// CashierTab
replaceFile('src/components/CashierTab.tsx', [
    ['Nominal Belanja', 'Nominal Transaksi']
]);

