const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

// Fix big QR modal
content = content.replace(
  'className="w-[200px] h-[200px] mx-auto mb-5 bg-white dark:bg-white/5 rounded-2xl flex justify-center items-center p-3 shadow- dark:shadow-noneinner border border-black/5 dark:border-white/10"',
  'className="w-[200px] h-[200px] mx-auto mb-5 bg-white rounded-2xl flex justify-center items-center p-3 shadow-inner border border-black/5 dark:border-white/10"'
);

// Fix other broken shadows
content = content.replace(/shadow- dark:shadow-none/g, 'shadow-sm dark:shadow-none ');
content = content.replace(/shadow-sm dark:shadow-none sm /g, 'shadow-sm dark:shadow-none ');

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
