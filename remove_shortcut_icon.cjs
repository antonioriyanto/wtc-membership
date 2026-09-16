const fs = require('fs');
let header = fs.readFileSync('src/components/Header.tsx', 'utf8');

// The exact block containing the ⌘ K icons:
const targetBlock = `<div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">⌘</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-200 text-slate-500 rounded">K</span>
          </div>`;

header = header.replace(targetBlock, "");
fs.writeFileSync('src/components/Header.tsx', header);

