const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

// Imports
const importStr = "import { QRCodeSVG } from 'qrcode.react';\nimport confetti from 'canvas-confetti';\n";
code = code.replace("import { WatchClubLogo } from './WatchClubLogo';", "import { WatchClubLogo } from './WatchClubLogo';\n" + importStr);

// Add QR Modal State
code = code.replace("const [showPointsHelp, setShowPointsHelp] = useState(false);", "const [showPointsHelp, setShowPointsHelp] = useState(false);\n  const [showQRModal, setShowQRModal] = useState(false);");

// Add Confetti Effect when tier is higher than Blue on mount
const confettiEffect = `
  useEffect(() => {
    if (member && member.tier !== 'BLUE') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#10B981', '#3B82F6']
      });
    }
  }, []);
`;
code = code.replace("const availableVouchers", confettiEffect + "\n  const availableVouchers");

// Let's add a QR Button on the main card next to "1.1.0" or somewhere prominent.
// Actually, in the Member Card itself, replacing the Logo maybe? Or next to the Tier Badge.
const qrButtonStr = `
            {/* Show QR Button */}
            <button 
              onClick={() => setShowQRModal(true)}
              className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-colors text-white flex items-center gap-2 text-xs font-bold"
            >
              <div className="w-5 h-5 border-2 border-white border-dashed rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm" />
              </div>
              Tampilkan QR
            </button>
`;
// Let's insert it right after the WatchClubLogo in the dark card
code = code.replace("<WatchClubLogo className=\"text-white w-24 h-auto opacity-50\" />", "<WatchClubLogo className=\"text-white w-24 h-auto opacity-50\" />\n" + qrButtonStr);

// Add the QR Modal at the bottom
const qrModalUI = `
      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm flex flex-col items-center relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowQRModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6 mt-4">
              <h3 className="text-xl font-black text-slate-900">Member QR Code</h3>
              <p className="text-sm text-slate-500 mt-1">Tunjukkan kode ini ke kasir untuk scan poin atau klaim voucher</p>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 shadow-inner mb-6">
              <QRCodeSVG 
                value={member.id} 
                size={200} 
                bgColor={"#f8fafc"}
                fgColor={"#0f172a"}
                level={"H"}
                includeMargin={false}
              />
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-slate-900 tracking-wider font-mono">{member.phone}</div>
              <div className="text-xs font-semibold text-slate-400 mt-1 uppercase">{member.name}</div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace("</PwaInstallPrompt>", "</PwaInstallPrompt>\n" + qrModalUI);

fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
