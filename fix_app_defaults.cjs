const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace("try { return localStorage.getItem('wtc_cashier_name') || 'Kasir Puri'; } catch {}", "try { return localStorage.getItem('wtc_cashier_name') || 'Kasir Aktif'; } catch {}");
content = content.replace("return 'Kasir Puri';", "return 'Kasir Aktif';");

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx defaults');
