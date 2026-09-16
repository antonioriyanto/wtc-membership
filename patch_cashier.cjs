const fs = require('fs');
let code = fs.readFileSync('src/components/CashierTab.tsx', 'utf8');

// The cashier should have a button "Scan QR" that opens a modal using some html5-qrcode or just simulate it for now if we didn't install a scanner library.
// Since we didn't install a scanner library (like html5-qrcode or react-qr-reader), we'll add a prominent note that in production this triggers the device camera, and maybe a simulated scanner window for demo.
const scannerImport = "import { QrCode, Camera } from 'lucide-react';\n";
code = code.replace("import { ", scannerImport + "import { ");

// Find search input and add a "Scan QR" button next to it.
const searchInput = `
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder="Cari No HP / Nama / ID Member..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performSearch(searchQuery);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
              />
            </div>
`;
// Replace this with the input AND a scan button.
const replacement = `
            <div className="flex w-full gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Cari No HP / Nama / ID Member / Scan ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      performSearch(searchQuery);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-emerald-500 dark:focus:border-emerald-500 transition-colors text-slate-900 dark:text-white"
                />
              </div>
              <button
                onClick={() => setIsScannerOpen(true)}
                className="px-4 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/50 dark:hover:bg-emerald-800 dark:text-emerald-400 rounded-xl flex items-center justify-center transition-colors"
                title="Scan QR Member"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
`;
code = code.replace(searchInput.trim(), replacement.trim());

fs.writeFileSync('src/components/CashierTab.tsx', code);
