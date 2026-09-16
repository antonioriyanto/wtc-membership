const fs = require('fs');
let path = 'src/components/CustomerMemberView.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<div className="relative mb-6">',
  '<div className="relative mb-6 flex flex-col items-center">'
);

content = content.replace(
  '<img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />',
  '<img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover object-center" />'
);

fs.writeFileSync(path, content);
