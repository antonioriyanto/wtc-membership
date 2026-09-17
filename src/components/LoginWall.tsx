import React, { useState } from 'react';
import { WatchClubLogo } from './WatchClubLogo';
import { Lock, User, KeyRound, Smartphone, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { initialMembers } from '../data/mockData';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { findMemberByPhoneInFirestore, normalizePhoneNumber, isSamePhoneNumber } from '../lib/syncFirestore';

export const STORE_ACCOUNTS = [
  { name: "23 Paskal Bandung", username: "23PSC", pin: "23PSC2026" },
  { name: "23 Semarang", username: "23SMG", pin: "23SMG2026" },
  { name: "AEON Sentul", username: "AMSC", pin: "AMSC2026" },
  { name: "Alianyang Singkawang", username: "ALIAN", pin: "ALIAN2026" },
  { name: "Ambarukmo Plaza Jogja", username: "AMB", pin: "AMB2026" },
  { name: "Ayani Pontianak", username: "AYANI", pin: "AYANI2026" },
  { name: "BIG Mall Samarinda", username: "BIG", pin: "BIG2026" },
  { name: "Bogor Botani", username: "BOS", pin: "BOS2026" },
  { name: "Cibinong City Mall", username: "CCM", pin: "CCM2026" },
  { name: "Ciputra Semarang", username: "CL", pin: "CL2026" },
  { name: "DP Mall Semarang", username: "DPM", pin: "DPM2026" },
  { name: "Duta Mall 1 Banjarmasin", username: "DTM1", pin: "DTM12026" },
  { name: "Duta Mall 2 Banjarmasin", username: "DTM2", pin: "DTM22026" },
  { name: "E-Walk Balikpapan", username: "EWALK", pin: "EWALK2026" },
  { name: "Gaia Pontianak", username: "GAIA", pin: "GAIA2026" },
  { name: "Gorontalo", username: "GTLO", pin: "GTLO2026" },
  { name: "Jayapura", username: "JYP", pin: "JYP2026" },
  { name: "Jogja City Mall", username: "JCM", pin: "JCM2026" },
  { name: "Kendari", username: "KDI", pin: "KDI2026" },
  { name: "Kota Kasablanka Jakarta", username: "KOKAS", pin: "KOKAS2026" },
  { name: "Level 21 Bali", username: "LVL21", pin: "LVL212026" },
  { name: "Mall Olympic Garden 1 Malang", username: "MOG1", pin: "MOG12026" },
  { name: "Mall Olympic Garden 2 Malang", username: "MOG2", pin: "MOG22026" },
  { name: "Manado Town Square", username: "MANTS", pin: "MANTS2026" },
  { name: "Pakuwon Mall Yogya", username: "PMJ", pin: "PMJ2026" },
  { name: "Palu", username: "PALU", pin: "PALU2026" },
  { name: "Panakukang", username: "KUKA", pin: "KUKA2026" },
  { name: "Paragon Semarang", username: "PRG", pin: "PRG2026" },
  { name: "Penta City Balikpapan", username: "PENTA", pin: "PENTA2026" },
  { name: "Puri Jakarta", username: "PIM", pin: "PIM2026" },
  { name: "Singkawang Grand Mall", username: "SGM", pin: "SGM2026" },
  { name: "Solo Baru", username: "SOBAR", pin: "SOBAR2026" },
  { name: "Solo Square", username: "SQ", pin: "SQ2026" },
  { name: "Summarecon Mall Bandung", username: "SMB", pin: "SMB2026" },
  { name: "The Park Sawangan Depok", username: "SWG", pin: "SWG2026" },
  { name: "The Park Solo", username: "PARK", pin: "PARK2026" },
  { name: "TSM Bali", username: "BALI", pin: "BALI2026" },
  { name: "TSM Bandung", username: "TSM", pin: "TSM2026" },
  { name: "TSM Cibubur", username: "CBB", pin: "CBB2026" },
  { name: "TSM Makassar", username: "FINE", pin: "FINE2026" }
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
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [error, setError] = useState('');

  const filteredStores = STORE_ACCOUNTS.filter(s =>
    s.name.toLowerCase().includes(username.toLowerCase()) ||
    s.username.toLowerCase().includes(username.toLowerCase())
  );

  const selectedStoreObj = STORE_ACCOUNTS.find(s => s.username.toUpperCase() === username.toUpperCase());

  const handleLogin = (e: React.FormEvent) => {
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
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="flex justify-center mb-5">
          <WatchClubLogo variant="dark" className="scale-110" />
        </div>

        {!showStoreQuickSelect && (
          <div className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold uppercase tracking-wider mb-4 mx-auto w-fit">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            <span>Restricted · Khusus Staf Head Office</span>
          </div>
        )}

        <h2 className="text-2xl font-extrabold text-center text-slate-900 tracking-tight">{title}</h2>
        <p className="text-center text-slate-500 text-sm mt-1 mb-6">{subtitle}</p>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold mb-4 text-center border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {showStoreQuickSelect ? "Login ID Cabang Toko" : "Username Head Office"}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={username || ''}
                onFocus={() => showStoreQuickSelect && setIsStoreDropdownOpen(true)}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (showStoreQuickSelect) setIsStoreDropdownOpen(true);
                }}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900 uppercase"
                placeholder={showStoreQuickSelect ? "Pilih / ketik kode cabang (contoh: PIM)" : "Ketik Username HO (contoh: admin)"}
                autoComplete="off"
                data-lpignore="true"
                name="wtc_user_field"
                required
              />

              {showStoreQuickSelect && isStoreDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden flex flex-col max-h-56">
                  <div className="p-2 bg-slate-50 border-b border-slate-100 text-[11px] font-semibold text-slate-500 flex justify-between items-center">
                    <span>Pilih Cabang (Hanya mengisi ID Toko)</span>
                    <button 
                      type="button" 
                      onClick={() => setIsStoreDropdownOpen(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="overflow-y-auto p-1.5 space-y-1">
                    {filteredStores.map((acc) => {
                      const isSelected = username.toUpperCase() === acc.username.toUpperCase();
                      return (
                        <div
                          key={acc.username}
                          onClick={() => {
                            setUsername(acc.username);
                            setPin(''); // STRICTLY NO FAST LOGIN: Cashier must type password manually!
                            setIsStoreDropdownOpen(false);
                            setError('');
                          }}
                          className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-sm' 
                              : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                              isSelected ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {acc.username}
                            </div>
                            <div className="text-xs font-semibold truncate">
                              {acc.name}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0">Pilih ID</span>
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
            {showStoreQuickSelect && selectedStoreObj && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                ✓ Cabang terpilih: {selectedStoreObj.name} ({selectedStoreObj.username})
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {showStoreQuickSelect ? "PIN Cabang (Input Manual)" : "PIN Head Office"}
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type={showPin ? "text" : "password"} maxLength={10} 
                value={pin || ''}
                onChange={(e) => setPin(e.target.value)}
                className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900 focus:bg-white transition-all text-slate-900"
                placeholder={showStoreQuickSelect ? "Ketikkan PIN cabang Anda" : "••••••••"}
                autoComplete="off"
                data-lpignore="true"
                name="wtc_pwd_field"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 cursor-pointer"
                title={showPin ? "Sembunyikan PIN" : "Lihat PIN"}
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {showStoreQuickSelect ? (
              <p className="text-[11px] text-slate-400 mt-1.5">
                PIN tidak disimpan otomatis. Format: <strong>[KODE]2026</strong> (Contoh: PIM2026)
              </p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1.5">
                Ketikkan PIN admin Head Office secara manual.
              </p>
            )}
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{showStoreQuickSelect ? 'Verifikasi & Masuk Terminal Kasir' : 'Verifikasi & Masuk HO'}</span>
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col items-center gap-2">
          <a 
            href="/member" 
            className="text-xs text-slate-500 hover:text-slate-900 font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer py-1"
          >
            <span>←</span> {showStoreQuickSelect ? 'Buka Halaman Member Pelanggan' : 'Bukan Staf Head Office? Buka Portal Member'}
          </a>
          <p className="text-[11px] text-slate-400">
            Sistem Loyalitas Resmi Watch Club Indonesia
          </p>
        </div>
      </div>
    </div>
  );
};

export { MemberLogin } from './MemberLogin';
