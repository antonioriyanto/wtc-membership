const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');
code = code.replace("profileImageUrl: member.avatarUrl", "avatarUrl: member.avatarUrl");
fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
