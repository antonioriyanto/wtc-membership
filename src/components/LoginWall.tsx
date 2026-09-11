import React, { useState } from 'react';
import { WatchClubLogo } from './WatchClubLogo';
import { Lock, User, KeyRound, Smartphone, ShieldCheck, Store, Search } from 'lucide-react';
import { initialMembers } from '../data/mockData';

export const STORE_ACCOUNTS = [
  { name: "23 Paskal Bandung", username: "23PSC", password: "23PSC2026" },
  { name: "23 Semarang", username: "23SMG", password: "23SMG2026" },
  { name: "AEON Sentul", username: "AMSC", password: "AMSC2026" },
  { name: "Alianyang Singkawang", username: "ALIAN", password: "ALIAN2026" },
  { name: "Ambarukmo Plaza Jogja", username: "AMB", password: "AMB2026" },
  { name: "Ayani Pontianak", username: "AYANI", password: "AYANI2026" },
  { name: "BIG Mall Samarinda", username: "BIG", password: "BIG2026" },
  { name: "Bogor Botani", username: "BOS", password: "BOS2026" },
  { name: "Cibinong City Mall", username: "CCM", password: "CCM2026" },
  { name: "Ciputra Semarang", username: "CL", password: "CL2026" },
  { name: "DP Mall Semarang", username: "DPM", password: "DPM2026" },
  { name: "Duta Mall 1 Banjarmasin", username: "DTM1", password: "DTM12026" },
  { name: "Duta Mall 2 Banjarmasin", username: "DTM2", password: "DTM22026" },
  { name: "E-Walk Balikpapan", username: "EWALK", password: "EWALK2026" },
  { name: "Gaia Pontianak", username: "GAIA", password: "GAIA2026" },
  { name: "Gorontalo", username: "GTLO", password: "GTLO2026" },
  { name: "Jayapura", username: "JYP", password: "JYP2026" },
  { name: "Jogja City Mall", username: "JCM", password: "JCM2026" },
  { name: "Kendari", username: "KDI", password: "KDI2026" },
  { name: "Kota Kasablanka Jakarta", username: "KOKAS", password: "KOKAS2026" },
  { name: "Level 21 Bali", username: "LVL21", password: "LVL212026" },
  { name: "Mall Olympic Garden 1 Malang", username: "MOG1", password: "MOG12026" },
  { name: "Mall Olympic Garden 2 Malang", username: "MOG2", password: "MOG22026" },
  { name: "Manado Town Square", username: "MANTS", password: "MANTS2026" },
  { name: "Pakuwon Mall Yogya", username: "PMJ", password: "PMJ2026" },
  { name: "Palu", username: "PALU", password: "PALU2026" },
  { name: "Panakukang", username: "KUKA", password: "KUKA2026" },
  { name: "Paragon Semarang", username: "PRG", password: "PRG2026" },
  { name: "Penta City Balikpapan", username: "PENTA", password: "PENTA2026" },
  { name: "Puri Jakarta", username: "PIM", password: "PIM2026" },
  { name: "Singkawang Grand Mall", username: "SGM", password: "SGM2026" },
  { name: "Solo Baru", username: "SOBAR", password: "SOBAR2026" },
  { name: "Solo Square", username: "SQ", password: "SQ2026" },
  { name: "Summarecon Mall Bandung", username: "SMB", password: "SMB2026" },
  { name: "The Park Sawangan Depok", username: "SWG", password: "SWG2026" },
  { name: "The Park Solo", username: "PARK", password: "PARK2026" },
  { name: "TSM Bali", username: "BALI", password: "BALI2026" },
  { name: "TSM Bandung", username: "TSM", password: "TSM2026" },
  { name: "TSM Cibubur", username: "CBB", password: "CBB2026" },
  { name: "TSM Makassar", username: "FINE", password: "FINE2026" }
];

interface AdminLoginProps {
  onLogin: (userName: string, storeName?: string) => void;
  title: string;
  subtitle: string;
  showStoreQuickSelect?: boolean;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ 
  onLogin, 
  title, 
  subtitle, 
  showStoreQuickSelect = true 
}) => {
  const [username, setUsername] = useState(showStoreQuickSelect ? '' : 'admin');
  const [password, setPassword] = useState(showStoreQuickSelect ? '' : 'wtc26');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [error, setError] = useState('');

  const filteredStores = STORE_ACCOUNTS.filter(s =>
    s.name.toLowerCase().includes(username.toLowerCase()) ||
    s.username.toLowerCase().includes(username.toLowerCase())
  );

  const selectedStoreObj = STORE_ACCOUNTS.find(s => s.username === username);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Silakan masukkan Username dan Password.');
      return;
    }
    const u = username.trim();

    // Check superadmin HO
    if ((u.toLowerCase() === 'admin' || u.toLowerCase() === 'ho') && password === 'wtc26') {
      onLogin(u, 'Puri Jakarta');
      return;
    }

    // Check store accounts
    const foundStore = STORE_ACCOUNTS.find(
      s => s.username.toUpperCase() === u.toUpperCase() && s.password === password
    );

    if (foundStore) {
      onLogin(foundStore.username, foundStore.name);
    } else {
      setError('Login ID (Username) atau Password toko tidak valid. Silakan periksa kembali.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="flex justify-center mb-6">
          <WatchClubLogo variant="dark" className="scale-110" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 tracking-tight">{title}</h2>
        <p className="text-center text-slate-500 text-sm mt-1 mb-6">{subtitle}</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={username}
                onFocus={() => showStoreQuickSelect && setIsStoreDropdownOpen(true)}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (showStoreQuickSelect) setIsStoreDropdownOpen(true);
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 uppercase"
                placeholder={showStoreQuickSelect ? "Ketikkan nama toko" : "Ketikkan login ID"}
                autoComplete="off"
                name="store_login_username"
                required
              />

              {showStoreQuickSelect && isStoreDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-56">
                  <div className="overflow-y-auto p-1.5 space-y-1">
                    {filteredStores.map((acc) => {
                      const isSelected = username.toUpperCase() === acc.username.toUpperCase();
                      return (
                        <div
                          key={acc.username}
                          onClick={() => {
                            setUsername(acc.username);
                            setPassword(acc.password);
                            setIsStoreDropdownOpen(false);
                          }}
                          className={`p-2 rounded-lg border flex items-center gap-2.5 cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {acc.username}
                          </div>
                          <div className="text-xs font-semibold truncate">
                            {acc.name}
                          </div>
                        </div>
                      );
                    })}
                    {filteredStores.length === 0 && (
                      <div className="p-3 text-center text-xs text-slate-400">
                        Tidak ada cabang ditemukan.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Password</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-slate-900"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{showStoreQuickSelect ? 'Masuk Kasir Toko' : 'Masuk Sistem Superadmin'}</span>
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Sistem Loyalitas Resmi Watch Club Indonesia
          </p>
        </div>
      </div>
    </div>
  );
};

interface MemberLoginProps {
  onLogin: (memberId: string) => void;
  onRegisterGoogle: () => void;
  members: any[];
}

export const MemberLogin: React.FC<MemberLoginProps> = ({ onLogin, onRegisterGoogle, members }) => {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return setError('Silakan masukkan nomor telepon Anda.');
    
    setLoading(true);
    setError('');
    setIsNotRegistered(false);
    try {
      const membersList = members;

      const cleanDigits = phone.replace(/[^0-9]/g, '');
      const found = membersList.find((m: any) => {
        const mDigits = (m.phone || '').replace(/[^0-9]/g, '');
        return m.phone === phone || (cleanDigits.length >= 4 && mDigits.length >= 4 && (mDigits.includes(cleanDigits) || cleanDigits.includes(mDigits)));
      });
      if (found) {
        onLogin(found.id);
      } else {
        setError('Nomor handphone belum terdaftar sebagai member.');
        setIsNotRegistered(true);
      }
    } catch (err) {
      setError('Gagal memproses data member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="flex justify-center mb-6">
          <WatchClubLogo variant="dark" className="scale-110" />
        </div>
        <h2 className="text-2xl font-extrabold text-center text-slate-900 tracking-tight">Portal Loyalitas Member</h2>
        <p className="text-center text-slate-500 text-sm mt-1 mb-6">Masuk untuk melihat poin, status tier, dan klaim voucher eksklusif.</p>
        
        {error && !isNotRegistered && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Nomor Handphone Terdaftar</label>
            <div className="relative">
              <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (isNotRegistered) setIsNotRegistered(false);
                  if (error) setError('');
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-400 focus:bg-white transition-all text-slate-900"
                placeholder="Contoh: 081288889999"
                required
                disabled={isNotRegistered}
              />
            </div>
          </div>
          
          {!isNotRegistered ? (
            <>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Memverifikasi...' : 'Masuk'}
              </button>
              
              <div className="mt-6">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-3 text-slate-400 text-xs uppercase tracking-wider font-semibold">Pengguna Baru?</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <button 
                  type="button"
                  onClick={onRegisterGoogle} 
                  className="w-full mt-4 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-3 cursor-pointer shadow-sm"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  Daftar dengan Google
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 animate-fadeIn">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl mb-4">
                <p className="text-sm text-amber-800 font-medium text-center">
                  Nomor <strong>{phone}</strong> belum terdaftar.
                </p>
                <p className="text-xs text-amber-700 text-center mt-1">
                  Daftar sekarang untuk mulai mengumpulkan poin!
                </p>
              </div>
              
              <button 
                type="button"
                onClick={onRegisterGoogle}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm shadow-md transition-colors flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                Lanjutkan Daftar dengan Google
              </button>
              
              <button 
                type="button"
                onClick={() => {
                  setIsNotRegistered(false);
                  setPhone('');
                  setError('');
                }}
                className="w-full mt-3 py-3 text-slate-500 hover:text-slate-700 text-xs font-semibold transition-colors"
              >
                Gunakan nomor lain
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
