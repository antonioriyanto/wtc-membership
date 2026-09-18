const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /content: message,\n[\s]*timestamp: new Date\(\)\.toISOString\(\),\n[\s]*attachmentUrl: fileUrl/g,
  "content: ticketData.messageText,\n        timestamp: new Date().toISOString(),\n        attachmentUrl: ticketData.fileUrl"
);

fs.writeFileSync('src/App.tsx', code);
