const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const regex = /<MemberLogin\s+members=\{members\}\s+onLogin=\{\(id\) => setLoggedInMemberId\(id\)\}\s+onRegisterGoogle=\{async \(phoneNum: string\) => \{[\s\S]*?\}\}\s+\/>/m;

const replacement = `<MemberLogin 
            members={members}
            onLogin={(id) => setLoggedInMemberId(id)} 
            onRegisterGoogle={async (phoneNum: string) => {
              try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                let targetPhone = phoneNum || user.phoneNumber || '';
                
                // 1. If we have a phone number, check if a member already exists with this phone
                let existingMember = null;
                if (targetPhone) {
                  const cleanDigits = targetPhone.replace(/[^0-9]/g, '');
                  if (cleanDigits.length >= 4) {
                    existingMember = members.find(m => {
                      const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
                      return m.phone === targetPhone || (mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
                    });
                  }
                }
                
                const userRef = doc(db, 'members', user.uid);
                
                if (existingMember) {
                  // MERGE: Existing member found by phone (created by cashier)
                  // We copy their data into the Google UID document, and delete the old one.
                  if (existingMember.id !== user.uid) {
                    const mergedData = {
                      ...existingMember,
                      id: user.uid,
                      name: existingMember.name || user.displayName || 'Google User',
                      email: existingMember.email || user.email || '',
                      googleMergedAt: new Date().toISOString()
                    };
                    await setDoc(userRef, mergedData);
                    // Attempt to delete old cashier-created document
                    try {
                      await deleteDoc(doc(db, 'members', existingMember.id));
                    } catch(e) {
                      console.warn("Could not delete old member doc:", e);
                    }
                  }
                  setLoggedInMemberId(user.uid);
                  return;
                }
                
                // 2. Check if this Google UID already exists
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                   // Update phone if we have one and they didn't
                   const data = userSnap.data();
                   if (targetPhone && !data.phone) {
                      await setDoc(userRef, { phone: targetPhone }, { merge: true });
                   }
                   setLoggedInMemberId(user.uid);
                   return;
                }
                
                // 3. Brand new member
                if (!targetPhone) {
                   // In a real app we'd show a "Complete Profile" modal here.
                   // For now, prompt via window.prompt if missing.
                   targetPhone = window.prompt("Satu langkah lagi! Masukkan nomor WhatsApp/Handphone Anda untuk menghubungkan poin:") || '';
                   if (!targetPhone) {
                      showAlert('Nomor handphone wajib diisi untuk mengumpulkan poin.', 'Peringatan', 'warning');
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
              } catch (e: any) {
                console.error("Google Sign-In Error", e);
                showAlert('Gagal login dengan Google: ' + e.message, 'Login Gagal', 'error');
              }
            }}
          />`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync('src/App.tsx', content);
  console.log('Fixed App.tsx onRegisterGoogle completely with merging!');
} else {
  console.log('Regex target not found in App.tsx');
}
