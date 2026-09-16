const fs = require('fs');

// src/components/MemberLogin.tsx
let login = fs.readFileSync('src/components/MemberLogin.tsx', 'utf8');
login = login.replace(/koleksi jam tangan Anda/g, "reward Anda");
login = login.replace(/transaksi jam tangan mewah Anda/g, "aktivitas loyalty Anda");
login = login.replace(/Data koleksi jam tangan, poin/g, "Data poin");
fs.writeFileSync('src/components/MemberLogin.tsx', login);

// src/components/EditMemberModal.tsx
let edit = fs.readFileSync('src/components/EditMemberModal.tsx', 'utf8');
edit = edit.replace(/klaim garansi jam tangan dan/g, "penggunaan poin dan");
fs.writeFileSync('src/components/EditMemberModal.tsx', edit);

// src/components/NationalActivityNotifications.tsx
let notif = fs.readFileSync('src/components/NationalActivityNotifications.tsx', 'utf8');
notif = notif.replace(/Transaksi Belanja/g, "Penambahan Poin");
notif = notif.replace(/berbelanja senilai Rp \$\{\(tx\.amount \|\| 0\)\.toLocaleString\('id-ID'\)\} \(\+\$\{tx\.pointsDelta\} Pts\)/g, "mendapatkan +${tx.pointsDelta} Pts dari struk ${tx.receiptNo}");
// Remove the dummy nationwideFeed items entirely!
notif = notif.replace(/const nationwideFeed: Omit<StoreActivityItem, 'isRead'>\[\] = \[[\s\S]*?\];/g, "const nationwideFeed: Omit<StoreActivityItem, 'isRead'>[] = [];");
fs.writeFileSync('src/components/NationalActivityNotifications.tsx', notif);

