const fs = require('fs');
let code = fs.readFileSync('src/components/CashierTab.tsx', 'utf8');

code = code.replace("const [isProcessing, setIsProcessing] = useState(false);", "const [isProcessing, setIsProcessing] = useState(false);\n  const [isScannerOpen, setIsScannerOpen] = useState(false);\n");

const scannerModalUI = `
      {/* SCANNER SIMULATION MODAL */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-600" /> Scan QR Member
              </h3>
              <button onClick={() => setIsScannerOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="w-full aspect-square bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center mb-4">
                <div className="absolute inset-0 border-4 border-emerald-500/30 m-8 rounded-xl"></div>
                <div className="w-full h-1 bg-emerald-500 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
                <Camera className="w-12 h-12 text-white/20 absolute" />
                <p className="text-emerald-400 text-xs font-mono absolute bottom-4">Kamera Aktif. Arahkan ke QR Code</p>
              </div>
              <div className="text-center text-sm text-slate-500">
                <p className="mb-4">Fitur ini menggunakan API Kamera Device Anda (Tablet/Webcam).</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setSearchQuery('MEM-1');
                      setIsScannerOpen(false);
                      setTimeout(() => performSearch('MEM-1'), 300);
                    }}
                    className="flex-1 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold hover:bg-emerald-200 transition-colors"
                  >
                    Simulasi Scan: Budi
                  </button>
                  <button 
                    onClick={() => {
                      setSearchQuery('MEM-2');
                      setIsScannerOpen(false);
                      setTimeout(() => performSearch('MEM-2'), 300);
                    }}
                    className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-200 transition-colors"
                  >
                    Simulasi Scan: Siti
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("return (", "return (\n" + scannerModalUI);

fs.writeFileSync('src/components/CashierTab.tsx', code);
