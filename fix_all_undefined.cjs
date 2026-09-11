const fs = require('fs');

const files = [
  'src/components/CreateMemberModal.tsx',
  'src/components/CreateVoucherModal.tsx',
  'src/components/CampaignsTab.tsx',
  'src/components/CustomerMemberView.tsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    content = content.replace(/\|\| undefined/g, "|| ''");
    fs.writeFileSync(file, content);
  }
});

console.log('Fixed undefined properties across all files');
