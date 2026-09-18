const fs = require('fs');

let c = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

const oldCardStart = `<div 
                className={\`rounded-[10px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] relative overflow-hidden grid grid-cols-[1.3fr_0.7fr] p-6 aspect-[2/1] cursor-pointer hover:scale-[1.02] transition-transform \${
                  member.tier === 'BLUE' ? 'text-white' : member.tier === 'GOLD' ? 'text-amber-950' : 'text-slate-900'
                }\`}
                style={tierBackgroundStyle}
                onClick={() => {
                  setSelectedVoucherForQr(null);
                  setIsQrModalOpen(true);
                }}
              >
                <div className="flex flex-col justify-between h-full">
                  <div className={\`text-[0.65rem] sm:text-xs tracking-widest font-bold uppercase \${member.tier === 'BLUE' ? 'text-slate-300' : member.tier === 'GOLD' ? 'text-amber-950 font-extrabold' : 'text-slate-700'}\`}>{member.tier} MEMBER</div>
                  <div className={\`text-xl sm:text-2xl font-bold tracking-wide uppercase mt-auto mb-0 leading-none \${member.tier === 'BLUE' ? 'text-slate-100' : member.tier === 'GOLD' ? 'text-amber-950' : 'text-slate-900'}\`}>{member.name}</div>
                  <div className={\`text-xs sm:text-sm tracking-[3px] font-semibold mt-1 whitespace-nowrap \${member.tier === 'BLUE' ? 'text-slate-300' : member.tier === 'GOLD' ? 'text-amber-900 font-bold' : 'text-slate-700'}\`}>{member.membershipId}</div>
                </div>
                <div className="flex flex-col justify-between items-end text-right h-full">
                  <div className={\`w-full max-w-[110px] mb-1 \${member.tier === 'BLUE' ? 'text-white' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-slate-900'}\`}>
                    <WatchClubLogo variant={member.tier === 'BLUE' ? 'white' : 'dark'} />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 w-full mt-auto">
                    <div className="w-[60px] sm:w-[70px] h-[60px] sm:h-[70px] bg-white rounded-[4px] p-1 flex justify-center items-center shadow-lg transition-transform hover:scale-105">
                      <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(member.membershipId)}\`} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <div className={\`text-[0.55rem] sm:text-[0.65rem] font-semibold uppercase tracking-wider \${member.tier === 'BLUE' ? 'text-slate-300' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-slate-700'}\`}>Tap for QR</div>
                  </div>
                </div>
              </div>`;

const newCard = `<div onClick={() => {
                  setSelectedVoucherForQr(null);
                  setIsQrModalOpen(true);
                }} className="cursor-pointer">
                <MembershipCard member={member} />
                <div className="mt-4 flex justify-center">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <div className="w-8 h-8 bg-white rounded p-1 shadow-sm flex items-center justify-center">
                      <img src={\`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=\${encodeURIComponent(member.membershipId)}\`} alt="QR Code" className="w-full h-full object-contain" />
                    </div>
                    <span>Tap card to view full QR Code</span>
                  </div>
                </div>
              </div>`;

c = c.replace(oldCardStart, newCard);
fs.writeFileSync('src/components/CustomerMemberView.tsx', c);
