const fs = require('fs');
const files = ['src/components/MemberLogin.tsx', 'src/components/CustomerMemberView.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/shadow- dark:shadow-nonesm/g, 'shadow-sm dark:shadow-none');
  content = content.replace(/shadow- dark:shadow-nonexs/g, 'shadow-xs dark:shadow-none');
  content = content.replace(/shadow- dark:shadow-none2xl/g, 'shadow-2xl dark:shadow-none');
  content = content.replace(/shadow- dark:shadow-none/g, 'shadow-sm dark:shadow-none');
  content = content.replace(/dark:bg-white\/5 dark:bg-white\/5/g, 'dark:bg-white/5');
  fs.writeFileSync(file, content);
}
console.log("Cleaned up shadows");
