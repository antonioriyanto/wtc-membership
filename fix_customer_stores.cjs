const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

const targetStr = `              {filteredStores.map((store, idx) => (
                <div key={store.id} className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5 border border-slate-100">
                  <div className="p-5 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-[0.7rem] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{store.region}</div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                          {store.name.startsWith('Watch Club') ? store.name : \`Watch Club - \${store.name}\`}
                        </h3>
                      </div>
                      <span className="text-[0.65rem] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider shrink-0 border border-slate-200">
                        {store.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-800">{store.mallName}</div>
                      <div className="text-slate-500 mt-0.5">{store.city}</div>
                    </div>
                    <div className="flex items-start gap-2.5 text-[0.8rem] text-slate-500 leading-relaxed font-medium">
                      <MapPin className="text-slate-700 w-4 h-4 mt-0.5 shrink-0" />
                      <span>{store.address || \`\${store.mallName}, Indonesia\`}</span>
                    </div>
                    {store.whatsapp && (
                      <div className="flex items-center gap-2 pt-1 mt-1 border-t border-slate-100">
                        <MessageCircle className="text-[#25D366] w-4 h-4 shrink-0" />
                        <a 
                          href={\`https://wa.me/\${store.whatsapp.replace(/[^0-9]/g, '')}\`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-[#25D366] hover:underline"
                        >
                          WhatsApp: {store.whatsapp}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}`;

// I'll use regex to make it safer to replace
const regexTarget = /\{filteredStores\.map\(\(store, idx\) => \([\s\S]*?\}\)\]\}[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?\)\}/;
// Actually I'll replace line by line or find the exact block.
