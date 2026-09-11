const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /targetPhone = window\.prompt[\s\S]*?if \(!targetPhone\) \{/m;
const replacement = `// We need a custom modal to ask for phone in a real app.
                   // Here we use a safe prompt, but we style it via a custom dialog if possible.
                   targetPhone = window.prompt("Lengkapi Profil\\n\\nSatu langkah lagi! Masukkan nomor WhatsApp/Handphone Anda untuk menghubungkan poin:") || '';
                   if (!targetPhone) {`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/App.tsx', content);
console.log('Fixed prompt in App.tsx');
