const fs = require('fs');

function applyThemeRules(content) {
  // Primary buttons
  // "bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white" 
  content = content.replace(/bg-slate-900( dark:text-white)? hover:bg-slate-800( dark:text-neutral-200)?/g, 'bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200');
  
  // Specific CustomerMemberView Bottom Navbar
  // bg-white/95 backdrop-blur-md border-t border-slate-200
  content = content.replace(/bg-white\/95 backdrop-blur-md border-t border-black\/5 dark:border-white\/10/g, 'bg-white/70 backdrop-blur-lg border-t border-black/5 dark:bg-black/40 dark:backdrop-blur-lg dark:border-t dark:border-white/10');
  
  // Also LoginWall has some cards
  content = content.replace(/bg-white rounded-(2xl|3xl|xl|lg|md) shadow-sm/g, 'bg-white dark:bg-white/5 rounded-$1 shadow-sm dark:shadow-none');
  
  // Cards in CustomerMemberView
  // className="bg-white m-5 p-5 rounded-[24px] shadow-[...]"
  content = content.replace(/bg-white([^"]*?shadow-[^"]*?)/g, (match, p1) => {
    // If it's a QR code container, skip
    if (p1.includes('w-[60px]') || p1.includes('w-[200px]')) return match;
    return `bg-white dark:bg-white/5${p1} dark:shadow-none`;
  });
  
  // Clean up any remaining bg-white that should be cards
  // Only replace if it contains rounded or border or shadow and doesn't have dark:bg
  content = content.replace(/className="([^"]*?)bg-white([^"]*?)"/g, (match, p1, p2) => {
    if (p1.includes('dark:bg-white') || p2.includes('dark:bg-white')) return match;
    // Don't apply dark mode bg to QR code or Logo containers which need white bg to be scannable
    if (match.includes('w-[60px]') || match.includes('h-[60px]') || match.includes('w-[200px]')) return match;
    if (match.includes('QR Code')) return match;
    
    // Apply dark:bg-white/5
    return `className="${p1}bg-white dark:bg-white/5${p2}"`;
  });
  
  return content;
}

const files = ['src/components/MemberLogin.tsx', 'src/components/CustomerMemberView.tsx'];
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = applyThemeRules(content);
  fs.writeFileSync(file, content);
}
console.log("Precise patching done");
