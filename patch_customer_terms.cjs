const fs = require('fs');

// src/components/CustomerMemberView.tsx
let cust = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');
cust = cust.replace(/Poin Belanja Belum Masuk/g, "Poin Transaksi Belum Masuk");
cust = cust.replace(/Contoh: Belanja kemarin poin belum bertambah/g, "Contoh: Transaksi kemarin poin belum bertambah");
cust = cust.replace(/Jelaskan detail belanja Anda, jam berapa, atau kendala voucher\.\.\./g, "Jelaskan detail transaksi Anda, jam berapa, atau kendala voucher...");
fs.writeFileSync('src/components/CustomerMemberView.tsx', cust);

// src/components/MemberLogin.tsx
let login = fs.readFileSync('src/components/MemberLogin.tsx', 'utf8');
login = login.replace(/data koleksi Anda/g, "aktivitas loyalty Anda");
fs.writeFileSync('src/components/MemberLogin.tsx', login);

