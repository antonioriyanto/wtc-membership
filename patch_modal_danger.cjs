const fs = require('fs');
let modal = fs.readFileSync('src/components/EditMemberModal.tsx', 'utf8');

modal = modal.replace(
  "Menghapus akun <strong>{member.name}</strong> ({member.membershipId}) akan menghapus seluruh data profil, hak poin sejumlah <strong>{(member.points || 0).toLocaleString('id-ID')} Pts</strong>, dan akses masuk member dari sistem.",
  "Menghapus akun <strong>{member.name}</strong> ({member.membershipId}) akan menghapus akun secara permanen dari database, termasuk hak poin sejumlah <strong>{(member.points || 0).toLocaleString('id-ID')} Pts</strong>, dan seluruh riwayat transaksi terkait otomatis dihapus dari sistem tanpa bisa dipulihkan."
);

fs.writeFileSync('src/components/EditMemberModal.tsx', modal);
