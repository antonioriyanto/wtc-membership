const fs = require('fs');
let content = fs.readFileSync('src/components/LoginWall.tsx', 'utf8');

const targetImport = `import { User, Lock, Store, KeyRound, ArrowRight } from 'lucide-react';`;
const newImport = `import { User, Lock, Store, KeyRound, ArrowRight } from 'lucide-react';
import { getAuth, signInWithCustomToken } from 'firebase/auth';`;
content = content.replace(targetImport, newImport);

const targetHandleLogin = `  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const u = username.trim();
    const p = pin.trim();

    if (!u || !p) {
      setError('Silakan masukkan Username dan PIN.');
      return;
    }

    // Check superadmin HO
    if ((u.toLowerCase() === 'admin' || u.toLowerCase() === 'ho') && (p === 'wtc26' || p.toLowerCase() === 'wtc26')) {
      onLogin(u, 'Puri Jakarta');
      return;
    }

    // If on HO restricted portal (!showStoreQuickSelect) and entered store cashier credentials
    if (!showStoreQuickSelect) {
      const isStoreAccount = STORE_ACCOUNTS.some(
        s => s.username.toUpperCase() === u.toUpperCase()
      );
      if (isStoreAccount) {
        setError('Akun ini adalah akun Kasir Toko. Silakan masuk melalui portal kasir di point.watchclub.co.id/cashier');
        return;
      }
      setError('Kredensial Admin Head Office tidak valid atau Anda tidak memiliki hak akses.');
      return;
    }

    // Check store accounts for Cashier portal (strict manual password check)
    const foundStore = STORE_ACCOUNTS.find(
      s => s.username.toUpperCase() === u.toUpperCase() && (s.pin === p || s.pin.toUpperCase() === p.toUpperCase())
    );

    if (foundStore) {
      // Forcefully update the store name immediately before login proceeds to ensure App state sync
      try {
        localStorage.setItem('wtc_cashier_store', foundStore.name);
      } catch (e) {}
      
      onLogin(foundStore.username, foundStore.name);
    } else {
      setError('Login ID (Username) atau PIN toko salah. Silakan periksa dan ketik kembali.');
    }
  };`;

const newHandleLogin = `  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const u = username.trim();
    const p = pin.trim();

    if (!u || !p) {
      setError('Silakan masukkan Username dan PIN.');
      setIsLoading(false);
      return;
    }

    // Local validation
    let isHO = false;
    let storeName = 'Puri Jakarta';
    let storeId = u;

    if ((u.toLowerCase() === 'admin' || u.toLowerCase() === 'ho') && (p === 'wtc26' || p.toLowerCase() === 'wtc26')) {
      isHO = true;
    } else if (!showStoreQuickSelect) {
      const isStoreAccount = STORE_ACCOUNTS.some(s => s.username.toUpperCase() === u.toUpperCase());
      if (isStoreAccount) {
        setError('Akun ini adalah akun Kasir Toko. Silakan masuk melalui portal kasir.');
        setIsLoading(false);
        return;
      }
      setError('Kredensial Admin Head Office tidak valid atau Anda tidak memiliki hak akses.');
      setIsLoading(false);
      return;
    } else {
      const foundStore = STORE_ACCOUNTS.find(
        s => s.username.toUpperCase() === u.toUpperCase() && (s.pin === p || s.pin.toUpperCase() === p.toUpperCase())
      );
      if (foundStore) {
        storeName = foundStore.name;
        storeId = foundStore.username;
      } else {
        setError('Login ID (Username) atau PIN toko salah. Silakan periksa dan ketik kembali.');
        setIsLoading(false);
        return;
      }
    }

    // Call Backend to get Custom Token
    try {
      const type = isHO ? 'HO' : 'CASHIER';
      const response = await fetch('/api/auth/employee-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, pin: p, type, storeId })
      });
      
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Autentikasi ke server gagal');
      }

      // Sign in with Firebase Auth Custom Token
      const auth = getAuth();
      await signInWithCustomToken(auth, result.token);
      
      if (!isHO) {
        try { localStorage.setItem('wtc_cashier_store', storeName); } catch (e) {}
      }
      
      onLogin(u, storeName);
    } catch (err: any) {
      setError(err.message || 'Gagal login. Periksa koneksi jaringan.');
    } finally {
      setIsLoading(false);
    }
  };`;

content = content.replace(targetHandleLogin, newHandleLogin);

const targetState = `  const [error, setError] = useState('');`;
const newState = `  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);`;
content = content.replace(targetState, newState);

const targetBtn = `<button 
            type="submit" 
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[0.95rem] font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20"
          >
            Masuk ke Portal <ArrowRight className="w-4 h-4" />
          </button>`;
const newBtn = `<button 
            type="submit" 
            disabled={isLoading}
            className={\`w-full flex items-center justify-center gap-2 py-3 \${isLoading ? 'bg-slate-700' : 'bg-slate-900 hover:bg-slate-800'} text-white rounded-xl text-[0.95rem] font-bold transition-colors shadow-lg shadow-slate-900/20\`}
          >
            {isLoading ? 'Mengautentikasi...' : 'Masuk ke Portal'} {!isLoading && <ArrowRight className="w-4 h-4" />}
          </button>`;
content = content.replace(targetBtn, newBtn);

fs.writeFileSync('src/components/LoginWall.tsx', content);
