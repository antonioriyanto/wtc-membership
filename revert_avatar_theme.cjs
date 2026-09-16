const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

// 1. Fix Header Avatar
const headerAvatarRegex = /<div className="flex items-center gap-2">\s*<button[\s\S]*?<\/button>\s*<\/div>/;
const newHeaderAvatar = `<div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className="w-10 h-10 rounded-full border border-slate-300 bg-slate-200 flex justify-center items-center font-bold text-slate-500 overflow-hidden shrink-0 transition-all cursor-pointer hover:bg-slate-300 shadow-sm"
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                member.name.charAt(0).toUpperCase()
              )}
            </button>
          </div>`;
code = code.replace(headerAvatarRegex, newHeaderAvatar);

// 2. Fix Profile Avatar
const profileAvatarRegex = /<div className="relative mb-6">\s*<div\s*className="w-\[100px\] h-\[100px\][^>]*?style=\{tierBackgroundStyle\}[\s\S]*?<\/div>\s*<\/div>/;
const newProfileAvatar = `<div className="relative mb-6">
                  <div 
                    className="w-[80px] h-[80px] rounded-full bg-slate-900 text-white flex justify-center items-center text-2xl font-bold shadow-sm overflow-hidden group relative cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      member.name.charAt(0).toUpperCase()
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload}
                  />
                  <div className="text-center mt-3">
                    <p className="text-xs text-slate-500 font-medium">Click to change picture</p>
                  </div>
                </div>`;
code = code.replace(profileAvatarRegex, newProfileAvatar);

fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
