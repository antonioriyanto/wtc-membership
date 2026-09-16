const fs = require('fs');
let modal = fs.readFileSync('src/components/MemberPreviewModal.tsx', 'utf8');

modal = modal.replace(
  "Yakin ingin menghapus akun <strong>{member.name}</strong> ({member.membershipId})? Tindakan ini tidak dapat dibatalkan.",
  "Yakin ingin menghapus akun <strong>{member.name}</strong> ({member.membershipId}) beserta seluruh Poin dan Riwayat Transaksinya secara permanen? Tindakan ini tidak dapat dibatalkan."
);

fs.writeFileSync('src/components/MemberPreviewModal.tsx', modal);
