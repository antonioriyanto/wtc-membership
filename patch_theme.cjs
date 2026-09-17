const fs = require('fs');

const files = ['src/components/MemberLogin.tsx', 'src/components/CustomerMemberView.tsx'];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Replace text-slate-X with text-neutral-X dark:text-...
  content = content.replace(/text-slate-900/g, 'text-neutral-900 dark:text-white');
  content = content.replace(/text-slate-800/g, 'text-neutral-800 dark:text-neutral-200');
  content = content.replace(/text-slate-700/g, 'text-neutral-700 dark:text-neutral-300');
  content = content.replace(/text-slate-600/g, 'text-neutral-600 dark:text-neutral-400');
  content = content.replace(/text-slate-500/g, 'text-neutral-500 dark:text-neutral-400');
  content = content.replace(/text-slate-400/g, 'text-neutral-400 dark:text-neutral-500');

  // Replace border-slate-X with border-neutral-X
  content = content.replace(/border-slate-200(\/90)?/g, 'border-black/5 dark:border-white/10');
  content = content.replace(/border-slate-100/g, 'border-black/5 dark:border-white/10');
  content = content.replace(/border-slate-300/g, 'border-black/10 dark:border-white/20');
  
  // Replace global background
  content = content.replace(/bg-slate-50/g, 'bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950');
  
  // Replace general card backgrounds
  // We need to avoid bg-white inside the member card. The member card uses `bg-white` for the QR code container.
  // Wait, let's just do a manual regex for bg-white to `bg-white dark:bg-white/5` but only if it's not the QR code container?
  // Let's just blindly replace `bg-white` with `bg-white dark:bg-white/5` except in the member card.
  // We can do this by first masking the member card.
  
  fs.writeFileSync(file, content);
}
console.log("Basic text/border/bg replacements done");
