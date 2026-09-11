const fs = require('fs');

let content = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

const replacement = `              {filteredStores.map((store, idx) => (
                <div key={store.id} className="bg-white rounded-[24px] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5 border border-slate-100">
                  {/* Photo Placeholder */}
                  <div className="w-full h-32 bg-slate-100 overflow-hidden relative border-b border-slate-100">
                    <img 
                      src={store.image || 'https://images.unsplash.com/photo-1549429532-6804ff69b22b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80'} 
                      alt={store.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 right-4">
                      <div className="text-[0.65rem] font-bold uppercase tracking-wider text-white/90 mb-0.5 shadow-sm">{store.region}</div>
                      <h3 className="text-base sm:text-lg font-bold text-white leading-snug drop-shadow-md">
                        {store.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-3">
                    <div className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="font-semibold text-slate-800">{store.mallName}</div>
                      <div className="text-slate-500 mt-0.5 flex items-start gap-1">
                        <MapPin className="text-slate-400 w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{store.address || \`\${store.mallName}, Indonesia\`}</span>
                      </div>
                    </div>
                    {store.whatsapp && (
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <div className="flex items-center gap-1.5">
                          <MessageCircle className="text-[#25D366] w-4 h-4 shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">WhatsApp:</span>
                        </div>
                        <a 
                          href={\`https://wa.me/\${store.whatsapp.replace(/[^0-9]/g, '')}\`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline bg-emerald-50 px-2 py-1 rounded-md transition-colors"
                        >
                          {store.whatsapp}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}`;

// I'll read the file, split by lines and replace the exact lines
let lines = content.split('\n');
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{filteredStores.map((store, idx) => (')) {
    startIndex = i;
  }
  // Look for the end of the PROFILE tab block since it immediately follows STORES
  if (lines[i].includes('{activeTab === \'PROFILE\' && (')) {
    endIndex = i - 1;
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  lines.splice(startIndex, endIndex - startIndex, replacement);
  fs.writeFileSync('src/components/CustomerMemberView.tsx', lines.join('\n'));
  console.log('Successfully updated CustomerMemberView stores UI');
} else {
  console.log('Could not find store rendering block');
}
