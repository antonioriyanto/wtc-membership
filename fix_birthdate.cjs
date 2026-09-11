const fs = require('fs');
let file = 'src/components/CreateMemberModal.tsx';
let content = fs.readFileSync(file, 'utf-8');
content = content.replace(
  "birthDate: birthDate ? new Date(birthDate).toISOString() : undefined,",
  "birthDate: birthDate ? new Date(birthDate).toISOString() : '',"
);
fs.writeFileSync(file, content);

let file2 = 'src/components/CustomerMemberView.tsx';
let content2 = fs.readFileSync(file2, 'utf-8');
content2 = content2.replace(
  "} : undefined",
  "} : null"
);
fs.writeFileSync(file2, content2);
console.log('Fixed explicit undefined');
