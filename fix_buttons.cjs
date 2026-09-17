const fs = require('fs');
const files = ['src/components/MemberLogin.tsx', 'src/components/CustomerMemberView.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Fix messed up buttons
  content = content.replace(/bg-black text-white hover:bg-neutral-800 dark:bg-white dark:bg-white\/5 dark:text-black dark:hover:bg-neutral-200 text-white/g, 
    'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200');
  content = content.replace(/bg-black text-white hover:bg-neutral-800 dark:bg-white dark:bg-white\/5 dark:text-black dark:hover:bg-neutral-200/g, 
    'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200');

  // Fix other buttons that might have been bg-slate-900 (now bg-black but missing dark mode)
  // Let's replace any `bg-slate-900` that's left
  content = content.replace(/bg-slate-900 hover:bg-slate-800 text-white/g, 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200');
  content = content.replace(/bg-slate-900/g, 'bg-black dark:bg-white dark:text-black');
  
  fs.writeFileSync(file, content);
}
console.log("Fixed buttons");
