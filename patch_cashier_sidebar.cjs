const fs = require('fs');

let sidebar = fs.readFileSync('src/components/CashierSidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  "hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white",
  "hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:translate-x-1"
);
fs.writeFileSync('src/components/CashierSidebar.tsx', sidebar);
