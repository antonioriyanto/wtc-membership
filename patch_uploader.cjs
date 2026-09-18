const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileUploader.tsx', 'utf8');
code = code.replace("profileImageUrl: base64String", "avatarUrl: base64String");
fs.writeFileSync('src/components/ProfileUploader.tsx', code);
