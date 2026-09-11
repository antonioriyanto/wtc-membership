const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Add new state for the Google Profile Modal
const stateReplacement = `  const [selectedStoreForTrx, setSelectedStoreForTrx] = useState<StoreBranch | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const [googlePhoneInput, setGooglePhoneInput] = useState('');`;
content = content.replace('  const [selectedStoreForTrx, setSelectedStoreForTrx] = useState<StoreBranch | null>(null);', stateReplacement);

// 2. Change onRegisterGoogle to trigger the modal instead of window.prompt
const googleTarget = `                // 3. Brand new member
                if (!targetPhone) {
                   // Let's use our custom dialog to ask for the phone number
                   targetPhone = await new Promise((resolve) => {
                     const modalHtml = \`
                       <div style="text-align: left;">
                         <p style="font-size: 14px; margin-bottom: 12px; color: #475569;">Kami tidak menemukan nomor handphone pada akun Google Anda. Masukkan nomor Anda untuk mengamankan poin.</p>
                         <input type="tel" id="google-phone-prompt" placeholder="08123456789" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #cbd5e1; outline: none; font-size: 16px;" />
                       </div>
                     \`;
                     
                     // We are hacking the showAlert UI temporarily by injecting HTML if possible, 
                     // but since showAlert doesn't support input easily, let's just use window.prompt for now
                     // because building a full React modal dynamically here is too complex.
                     
                     // ACTUALLY, let's use window.prompt but with better text.
                     const res = window.prompt("Lengkapi Profil\\n\\nSatu langkah lagi! Masukkan nomor WhatsApp/Handphone Anda untuk menghubungkan poin:");
                     resolve(res || '');
                   });
                   
                   if (!targetPhone) {
                      showAlert('Pendaftaran dibatalkan. Nomor handphone wajib diisi untuk mengamankan poin Anda.', 'Peringatan', 'warning');
                      return; // Cancel sign in
                   }
                   
                   // Re-check merge just in case they typed a cashier-registered phone
                   const cleanDigits = targetPhone.replace(/[^0-9]/g, '');
                   if (cleanDigits.length >= 4) {
                     existingMember = members.find(m => {
                       const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
                       return m.phone === targetPhone || (mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
                     });
                   }
                   if (existingMember && existingMember.id !== user.uid) {
                      const mergedData = {
                        ...existingMember,
                        id: user.uid,
                        name: existingMember.name || user.displayName || 'Google User',
                        email: existingMember.email || user.email || '',
                        googleMergedAt: new Date().toISOString()
                      };
                      await setDoc(userRef, mergedData);
                      try { await deleteDoc(doc(db, 'members', existingMember.id)); } catch(e) {}
                      setLoggedInMemberId(user.uid);
                      return;
                   }
                }

                const shortUid = user.uid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
                const membershipId = 'ONL' + shortUid;
                
                const newMember = {
                  id: user.uid,
                  membershipId: membershipId,
                  name: user.displayName || 'Google User',
                  phone: targetPhone, 
                  email: user.email || '',
                  joinDate: new Date().toISOString().split('T')[0],
                  points: 0,
                  tier: 'BLUE',
                  totalSpent: 0,
                  registeredStore: 'Online',
                  lastStoreVisited: 'Online',
                  createdAt: new Date().toISOString()
                };
                
                await setDoc(userRef, newMember);
                setLoggedInMemberId(user.uid);
              } catch (e: any) {`;

const googleReplacement = `                // 3. Brand new member
                if (!targetPhone) {
                   setPendingGoogleUser(user);
                   return;
                }

                const shortUid = user.uid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
                const membershipId = 'ONL' + shortUid;
                
                const newMember = {
                  id: user.uid,
                  membershipId: membershipId,
                  name: user.displayName || 'Google User',
                  phone: targetPhone, 
                  email: user.email || '',
                  joinDate: new Date().toISOString().split('T')[0],
                  points: 0,
                  tier: 'BLUE',
                  totalSpent: 0,
                  registeredStore: 'Online',
                  lastStoreVisited: 'Online',
                  createdAt: new Date().toISOString()
                };
                
                await setDoc(userRef, newMember);
                setLoggedInMemberId(user.uid);
              } catch (e: any) {`;

content = content.replace(googleTarget, googleReplacement);

// 3. Add the Modal UI at the bottom of the return statement
const modalTarget = `      <PortalSwitcher 
        currentPortal="HO" 
        onSwitch={handlePortalSwitch} 
        cashierAuthenticated={cashierAuthenticated}
      />
    </div>
  );
}`;

const modalReplacement = `      <PortalSwitcher 
        currentPortal="HO" 
        onSwitch={handlePortalSwitch} 
        cashierAuthenticated={cashierAuthenticated}
      />

      {/* Google Complete Profile Modal */}
      {pendingGoogleUser && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex justify-center items-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="font-bold text-xl mb-2 text-slate-900">Lengkapi Profil</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Satu langkah lagi! Masukkan nomor Handphone / WhatsApp Anda untuk menghubungkan poin.
            </p>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Nomor Handphone</label>
              <input 
                type="tel"
                value={googlePhoneInput}
                onChange={e => setGooglePhoneInput(e.target.value)}
                className="w-full px-4 py-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 focus:bg-white transition-colors font-medium text-slate-900 placeholder:text-slate-400"
                placeholder="Contoh: 08123456789"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setPendingGoogleUser(null);
                  setGooglePhoneInput('');
                }}
                className="flex-1 py-3 text-slate-500 hover:bg-slate-50 font-bold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button 
                disabled={!googlePhoneInput.trim()}
                onClick={async () => {
                   if (!googlePhoneInput.trim()) return;
                   
                   try {
                     const user = pendingGoogleUser;
                     const userRef = doc(db, 'members', user.uid);
                     
                     // Check merge
                     let existingMember = null;
                     const cleanDigits = googlePhoneInput.replace(/[^0-9]/g, '');
                     if (cleanDigits.length >= 4) {
                       existingMember = members.find(m => {
                         const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
                         return m.phone === googlePhoneInput || (mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
                       });
                     }
                     
                     if (existingMember && existingMember.id !== user.uid) {
                        const mergedData = {
                          ...existingMember,
                          id: user.uid,
                          name: existingMember.name || user.displayName || 'Google User',
                          email: existingMember.email || user.email || '',
                          googleMergedAt: new Date().toISOString()
                        };
                        await setDoc(userRef, mergedData);
                        try { await deleteDoc(doc(db, 'members', existingMember.id)); } catch(e) {}
                        setPendingGoogleUser(null);
                        setLoggedInMemberId(user.uid);
                        return;
                     }
                     
                     // New Member
                     const shortUid = user.uid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
                     const membershipId = 'ONL' + shortUid;
                     
                     const newMember = {
                        id: user.uid,
                        membershipId: membershipId,
                        name: user.displayName || 'Google User',
                        phone: googlePhoneInput, 
                        email: user.email || '',
                        joinDate: new Date().toISOString().split('T')[0],
                        points: 0,
                        tier: 'BLUE',
                        totalSpent: 0,
                        registeredStore: 'Online',
                        lastStoreVisited: 'Online',
                        createdAt: new Date().toISOString()
                     };
                     
                     await setDoc(userRef, newMember);
                     setPendingGoogleUser(null);
                     setLoggedInMemberId(user.uid);
                   } catch (e: any) {
                     showAlert('Terjadi kesalahan saat menyimpan profil: ' + e.message, 'Gagal', 'error');
                     setPendingGoogleUser(null);
                   }
                }}
                className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

content = content.replace(modalTarget, modalReplacement);

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx with Google Phone Modal!');
