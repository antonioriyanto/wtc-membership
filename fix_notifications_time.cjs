const fs = require('fs');
let content = fs.readFileSync('src/components/NationalActivityNotifications.tsx', 'utf-8');

const regex = /timeAgo: \`\$\{\(idx \+ 1\) \* 22\} menit lalu\`,/g;
const replacement = `timeAgo: (() => {
          const m = Math.floor((Date.now() - new Date(mem.joinDate).getTime()) / 60000);
          return m < 1 ? 'Baru saja' : m < 60 ? \`\${m} menit lalu\` : \`\${Math.floor(m/60)} jam lalu\`;
        })(),`;
        
content = content.replace(regex, replacement);
fs.writeFileSync('src/components/NationalActivityNotifications.tsx', content);
console.log('Fixed timeAgo in notifications');
