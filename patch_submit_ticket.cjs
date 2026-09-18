const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /const handleMemberSubmitTicket = async \(subject: string, message: string, fileUrl\?: string\) => \{/,
  "const handleMemberSubmitTicket = async (ticketData: any) => {"
);

code = code.replace(
  /subject,\n[\s]*message,\n[\s]*status: 'OPEN',/g,
  "...ticketData,\n      status: 'OPEN',"
);
code = code.replace(
  /text: message/g,
  "text: ticketData.messageText"
);

fs.writeFileSync('src/App.tsx', code);
