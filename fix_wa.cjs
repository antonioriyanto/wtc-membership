const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

content = content.replace(
  'className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2 py-1 rounded-md transition-colors"',
  'className="text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:text-[#25D366] transition-colors bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 px-3 py-1.5 rounded-lg flex items-center justify-center"'
);

fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
