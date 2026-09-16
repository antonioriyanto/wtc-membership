const fs = require('fs');

let sidebar = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');
sidebar = sidebar.replace(
  "hover:bg-slate-200 dark:hover:bg-slate-800/50",
  "hover:bg-slate-200 dark:hover:bg-slate-800/50 hover:translate-x-1"
);
fs.writeFileSync('src/components/Sidebar.tsx', sidebar);

let indexCss = fs.readFileSync('src/index.css', 'utf8');
if (!indexCss.includes('@keyframes modalIn')) {
  indexCss += `
@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.97) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
.animate-modalIn {
  animation: modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
`;
  fs.writeFileSync('src/index.css', indexCss);
}

