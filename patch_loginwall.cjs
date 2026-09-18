const fs = require('fs');
let l = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

// 1. Add imports for authHelper
if (!l.includes('hashStringSHA256')) {
    l = l.replace(
        "import { findMemberByPhoneInFirestore, normalizePhoneNumber, isSamePhoneNumber } from '../lib/syncFirestore';",
        "import { findMemberByPhoneInFirestore, normalizePhoneNumber, isSamePhoneNumber } from '../lib/syncFirestore';\nimport { hashStringSHA256, STORE_PIN_HASHES, setOfflineMode } from '../lib/authHelper';"
    );
}

// 2. Remove plain text PINs from STORE_ACCOUNTS
l = l.replace(/(username:\s*['"][^'"]+['"]),\s*pin:\s*['"][^'"]+['"]/g, '$1');

// 3. Replace handleLogin logic
const handleLoginStart = l.indexOf('const handleLogin = async (e: React.FormEvent) => {');
const endMarker = '  // Helper function: if login is successful, redirect dynamically';
const handleLoginEnd = l.indexOf(endMarker);

const oldHandleLogin = l.substring(handleLoginStart, handleLoginEnd);

const newHandleLogin = `const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const u = username.trim().toUpperCase();
    const p = pin.trim();

    if (!u || !p) {
      setError('Mohon lengkapi ID Toko dan PIN');
      setIsLoading(false);
      return;
    }

    let isHO = false;
    if (u === 'ADMIN' || u === 'HO' || u === 'ADMINWTC') {
      isHO = true;
    } else {
      const isStoreAccount = STORE_ACCOUNTS.some(s => s.username.toUpperCase() === u);
      if (!isStoreAccount && !showStoreQuickSelect) {
         setError('Akun ini adalah akun Kasir Toko. Silakan masuk melalui portal kasir.');
         setIsLoading(false);
         return;
      } else if (!isStoreAccount) {
         setError('Login ID (Username) toko tidak ditemukan.');
         setIsLoading(false);
         return;
      }
    }

    try {
      const type = isHO ? 'HO' : 'CASHIER';
      const currentStoreId = storeId || u;
      
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username: u, pin: p, type, storeId: currentStoreId })
      });
      
      const rawText = await response.text();
      const isIntercepted = rawText.includes('<!doctype html>') || rawText.includes('<html') || rawText.includes('Action required');
      
      if (!response.ok || isIntercepted) {
        throw new Error('Network Issue or Proxy Interception');
      }

      const result = JSON.parse(rawText);
      if (result.success) {
        setOfflineMode(false);
        
        let finalStoreId = currentStoreId;
        if (!isHO && showStoreQuickSelect) {
           const foundStore = STORE_ACCOUNTS.find(s => s.username.toUpperCase() === u);
           if (foundStore) {
             finalStoreId = foundStore.username;
             // Store name can be set to foundStore.name later if needed by loginMock
           }
        }
        
        loginMock(result.role, finalStoreId);
      } else {
        setError(result.error || 'Gagal masuk');
      }
    } catch (err) {
      console.warn('Peladen utama tidak dapat dijangkau. Beralih ke verifikasi kriptografi lokal (Secure Offline Mode)...');
      
      try {
        const hashedInputPin = await hashStringSHA256(p);
        const targetStoreId = isHO ? 'HO' : (storeId || u);
        
        const validHashForStore = STORE_PIN_HASHES[targetStoreId];
        
        if (validHashForStore && validHashForStore === hashedInputPin) {
          setOfflineMode(true);
          const role = isHO ? 'HO_ADMIN' : 'CASHIER';
          
          let finalStoreId = targetStoreId;
          if (!isHO && showStoreQuickSelect) {
             const foundStore = STORE_ACCOUNTS.find(s => s.username.toUpperCase() === u);
             if (foundStore) finalStoreId = foundStore.username;
          }
          
          loginMock(role, finalStoreId);
        } else {
          setError('Kredensial tidak valid (Verifikasi Luring Gagal)');
        }
      } catch (hashErr) {
        setError('Terjadi kesalahan sistem saat memverifikasi keamanan (Kriptografi Gagal).');
      }
    } finally {
      setIsLoading(false);
    }
  };

`;

l = l.replace(oldHandleLogin, newHandleLogin);
fs.writeFileSync('src/components/LoginWall.tsx', l);
