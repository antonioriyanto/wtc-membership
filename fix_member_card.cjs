const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

// The member card starts at `<div className={\`rounded-[10px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)]`
// Let's replace the whole block back to its original state

const originalCard = `              <div 
                className={\`rounded-[10px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden grid grid-cols-[1.3fr_0.7fr] p-6 aspect-[2/1] cursor-pointer hover:scale-[1.02] transition-transform \${
                  member.tier === 'BLUE' || member.tier === 'GOLD' ? 'text-white' : member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-900' : 'text-white bg-[radial-gradient(circle_at_top_left,#1e293b,#0f172a)]'
                }\`}
                style={tierBackgroundStyle}
                onClick={() => {
                  setSelectedVoucherForQr(null);
                  setIsQrModalOpen(true);
                }}
              >
                <div className="flex flex-col justify-between h-full">
                  <div className={\`text-[0.65rem] sm:text-xs tracking-widest font-bold uppercase \${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-700' : member.tier === 'GOLD' ? 'text-amber-950 font-extrabold' : 'text-slate-300'}\`}>{member.tier} MEMBER</div>
                  <div className={\`text-xl sm:text-2xl font-bold tracking-wide uppercase mt-auto mb-0 leading-none \${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-900' : member.tier === 'GOLD' ? 'text-amber-950' : 'text-slate-100'}\`}>{member.name}</div>
                  <div className={\`text-xs sm:text-sm tracking-[3px] font-semibold mt-1 whitespace-nowrap \${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-700' : member.tier === 'GOLD' ? 'text-amber-900 font-bold' : 'text-slate-300'}\`}>{member.membershipId}</div>
                </div>
                <div className="flex flex-col justify-between items-end text-right h-full">
                  <div className={\`w-full max-w-[110px] mb-1 \${member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-900' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-white'}\`}>
                    <WatchClubLogo variant={member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'dark' : member.tier === 'GOLD' ? 'dark' : 'white'} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 w-full mt-auto">
                    <div className="w-[60px] sm:w-[70px] h-[60px] sm:h-[70px] bg-white rounded-[4px] p-1 flex justify-center items-center shadow-lg transition-transform hover:scale-105">
                      <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(member.membershipId)}\`} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div className={\`text-[0.55rem] sm:text-[0.65rem] font-semibold uppercase tracking-wider \${member.tier === 'SILVER' || member.tier === 'PLATINUM' ? 'text-slate-700' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-slate-300'}\`}>Tap for QR</div>
                  </div>
                </div>
              </div>`;

// Find the buggy card block in content. It starts with `className={\`rounded-[10px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden grid grid-cols-[1.3fr_0.7fr] p-6 aspect-[2/1]`
// and ends with `</div>\n              </div>`

const startIdx = content.indexOf('className={`rounded-[10px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden');
if (startIdx !== -1) {
  // Find the exact block
  // We'll just regex replace the chunk
  content = content.replace(/<div \s*className=\{\`rounded-\[10px\] shadow-\[0_20px_40px_-10px_rgba\(0,0,0,0\.1\)\] relative overflow-hidden[\s\S]*?Tap for QR<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/, originalCard);
  fs.writeFileSync('src/components/CustomerMemberView.tsx', content);
  console.log('Restored Membership Card original styling.');
} else {
  console.log('Could not find start block.');
}
