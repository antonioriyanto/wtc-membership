const fs = require('fs');
let h = fs.readFileSync('src/components/CashierHeader.tsx', 'utf8');

const target = `{/* Online Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-bold shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 
          <span>Sistem Aktif</span>
        </div>`;

const inject = `{/* Online Status */}
        {isOfflineModeActive ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-lg text-[10px] sm:text-xs font-bold shrink-0 shadow-sm" title="Transaksi akan disinkronkan nanti">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div> 
            <span>MODE LURING</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-bold shrink-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 
            <span>Sistem Aktif</span>
          </div>
        )}`;

h = h.replace(target, inject);
fs.writeFileSync('src/components/CashierHeader.tsx', h);
