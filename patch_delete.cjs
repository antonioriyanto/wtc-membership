const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `await Promise.all(deletePromises);`;
const replacement = `await Promise.all(deletePromises);\n      showAlert('Akun member dan seluruh data terkait telah dihapus secara permanen dari sistem.', 'Penghapusan Berhasil', 'success');`;

content = content.replace(target, replacement);

fs.writeFileSync('src/App.tsx', content);
