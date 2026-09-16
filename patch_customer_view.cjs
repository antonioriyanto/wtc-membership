const fs = require('fs');
let code = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf8');

// Add imports
if (!code.includes("import { doc, updateDoc } from 'firebase/firestore';")) {
  code = code.replace("import { WatchClubLogo } from './WatchClubLogo';", "import { WatchClubLogo } from './WatchClubLogo';\nimport { doc, updateDoc } from 'firebase/firestore';\nimport { db } from '../lib/firebase';\nimport { Camera } from 'lucide-react';");
}

// Ensure Camera is imported if not already, wait, Camera might not be there. Let's just import it from lucide-react.
if (!code.includes("Camera")) {
  code = code.replace("import { ArrowLeft,", "import { Camera, ArrowLeft,");
}

// Look for the CustomerMemberView definition
const viewDef = "const [storeSearch, setStoreSearch] = useState('');";
const viewDefReplace = viewDef + `

  const fileInputRef = useRef<HTMLInputElement>(null);

  const compressImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Failed to get canvas context'));
          
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size? Even if large, we compress it immediately.
    try {
      showAlert('Processing', 'Compressing and uploading image...');
      const compressedBase64 = await compressImage(file, 400, 400, 0.7);
      
      const memberRef = doc(db, 'members', member.id);
      await updateDoc(memberRef, { avatarUrl: compressedBase64 });
      
      showAlert('Success', 'Profile picture updated successfully!');
    } catch (err) {
      showAlert('Error', 'Failed to update profile picture.');
      console.error(err);
    }
  };

  const tierBackgroundStyle = member.tier === 'BLUE' ? {
    background: 'linear-gradient(135deg, #4375A6 0%, #30466E 25%, #222649 50%, #17182C 75%, #101010 100%)'
  } : member.tier === 'SILVER' ? {
    background: 'linear-gradient(135deg, #F8F4F3 0%, #A3A3A3 25%, #FCFCFC 50%, #909090 75%, #F4F0F1 100%)'
  } : member.tier === 'GOLD' ? {
    background: 'linear-gradient(135deg, #EEC944 0%, #FAE56F 25%, #DDAF1D 50%, #FFFA8A 75%, #B96F15 100%)'
  } : member.tier === 'PLATINUM' ? {
    background: 'linear-gradient(135deg, #ECF1F7 0%, #A7B8CA 25%, #E2E7ED 50%, #A7B8CA 75%, #F8F7FC 100%)'
  } : member.tier === 'DIAMOND' ? {
    background: 'linear-gradient(135deg, #F9FFFF 0%, #FFFFFF 12.5%, #CCD7E7 25%, #FDE2CA 30.61%, #B9C9DD 38.27%, #E7F7E0 50%, #FFFFFF 62.29%, #FEEBF0 70.02%, #DCE4EE 75%, #B9C9DD 85.2%, #FFFFFF 100%)'
  } : {
    background: 'linear-gradient(110deg, #1e293b 0%, #0f172a 100%)'
  };

  const tierTextColorClass = member.tier === 'BLUE' || member.tier === 'GOLD' ? 'text-white' : member.tier === 'SILVER' || member.tier === 'PLATINUM' || member.tier === 'DIAMOND' ? 'text-slate-900' : 'text-white';
`;

code = code.replace(viewDef, viewDefReplace);

// Header Avatar
const headerAvatar = `<div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full border border-slate-300 bg-slate-200 flex justify-center items-center font-bold text-slate-500 overflow-hidden shrink-0">
              {member.name.charAt(0).toUpperCase()}
            </div>
          </div>`;
          
const headerAvatarReplace = `<div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('PROFILE')}
              className="w-10 h-10 rounded-full border-2 border-transparent hover:border-slate-300 bg-slate-200 flex justify-center items-center font-bold overflow-hidden shrink-0 transition-all cursor-pointer shadow-sm"
              style={tierBackgroundStyle}
            >
              {member.avatarUrl ? (
                <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span className={tierTextColorClass}>{member.name.charAt(0).toUpperCase()}</span>
              )}
            </button>
          </div>`;

code = code.replace(headerAvatar, headerAvatarReplace);

// Main Profile Avatar
const profileAvatar = `<div className="relative mb-6">
                  <div className="w-[80px] h-[80px] rounded-full bg-slate-900 text-white flex justify-center items-center text-2xl font-bold shadow-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                </div>`;
                
const profileAvatarReplace = `<div className="relative mb-6">
                  <div 
                    className="w-[100px] h-[100px] rounded-full flex justify-center items-center text-3xl font-bold shadow-lg overflow-hidden group relative cursor-pointer ring-4 ring-white"
                    style={tierBackgroundStyle}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className={tierTextColorClass}>{member.name.charAt(0).toUpperCase()}</span>
                    )}
                    
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="w-8 h-8 text-white" />
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

code = code.replace(profileAvatar, profileAvatarReplace);

// Fix the card background code duplication
const cardBg = `style={
                  member.tier === 'BLUE' ? {
                    background: 'linear-gradient(135deg, #4375A6 0%, #30466E 25%, #222649 50%, #17182C 75%, #101010 100%)'
                  } : member.tier === 'SILVER' ? {
                    background: 'linear-gradient(135deg, #F8F4F3 0%, #A3A3A3 25%, #FCFCFC 50%, #909090 75%, #F4F0F1 100%)'
                  } : member.tier === 'GOLD' ? {
                    background: 'linear-gradient(135deg, #EEC944 0%, #FAE56F 25%, #DDAF1D 50%, #FFFA8A 75%, #B96F15 100%)'
                  } : member.tier === 'PLATINUM' ? {
                    background: 'linear-gradient(135deg, #ECF1F7 0%, #A7B8CA 25%, #E2E7ED 50%, #A7B8CA 75%, #F8F7FC 100%)'
                  } : member.tier === 'DIAMOND' ? {
                    background: 'linear-gradient(135deg, #F9FFFF 0%, #FFFFFF 12.5%, #CCD7E7 25%, #FDE2CA 30.61%, #B9C9DD 38.27%, #E7F7E0 50%, #FFFFFF 62.29%, #FEEBF0 70.02%, #DCE4EE 75%, #B9C9DD 85.2%, #FFFFFF 100%)'
                  } : null
                }`;
code = code.replace(cardBg, "style={tierBackgroundStyle}");

fs.writeFileSync('src/components/CustomerMemberView.tsx', code);
