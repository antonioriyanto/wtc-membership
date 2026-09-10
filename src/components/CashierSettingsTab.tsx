import React, { useState, useEffect } from 'react';
import { ShieldCheck, Monitor, Sliders, LogOut, Moon, Check, Key, HelpCircle, Smartphone } from 'lucide-react';

interface SettingsTabProps {
  cashierName: string | null;
  storeName: string;
  onSignOut: () => void;
}

export const CashierSettingsTab: React.FC<SettingsTabProps> = ({ cashierName, storeName, onSignOut }) => {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = (enabled: boolean) => {
    setIsDarkMode(enabled);
    if (enabled) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordUpdated(true);
    setTimeout(() => setPasswordUpdated(false), 3000);
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Pengaturan Sistem</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Konfigurasi akun kasir, preferensi tampilan, dan perangkat.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CARD 1: AKUN & KEAMANAN */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
          <div className="text-base font-bold mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Akun & Keamanan
          </div>
          
          <div className="py-4 border-b border-slate-200 dark:border-slate-700">
            <h4 className="text-[0.95rem] text-slate-900 dark:text-white font-semibold mb-1">Detail Kasir Aktif</h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-1 font-medium">{cashierName || 'Kasir Default'}</p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Store: {storeName}</p>
          </div>

          <div className="py-4">
            <div className="mb-3">
              <h4 className="text-[0.95rem] text-slate-900 dark:text-white font-semibold mb-1 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-slate-500" /> Ubah Kata Sandi
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Perbarui kata sandi untuk keamanan akses kasir.</p>
            </div>

            {passwordUpdated && (
              <div className="mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4" /> Kata sandi berhasil diperbarui!
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
              <input 
                type="password" 
                placeholder="Kata Sandi Saat Ini" 
                required 
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" 
              />
              <input 
                type="password" 
                placeholder="Kata Sandi Baru" 
                required 
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" 
              />
              <input 
                type="password" 
                placeholder="Konfirmasi Kata Sandi Baru" 
                required 
                className="w-full px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors" 
              />
              <button 
                type="submit" 
                className="self-start mt-2 px-5 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors"
              >
                Simpan Kata Sandi
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          
          {/* HARDWARE CONTROLS */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="text-base font-bold mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">
              <Monitor className="w-5 h-5 text-emerald-500" /> Perangkat Keras & Antarmuka
            </div>

            <div className="py-4 border-b border-slate-200 dark:border-slate-700">
              <h4 className="text-[0.95rem] text-slate-900 dark:text-white font-semibold mb-1">Preferensi Scanner</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Metode utama untuk memindai QR code dan barcode.</p>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="scanner" defaultChecked className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Scanner Barcode Fisik (USB / Bluetooth)</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="radio" name="scanner" className="w-4 h-4 accent-emerald-500" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Kamera HP / Komputer</span>
                </label>
              </div>
            </div>

            <div className="py-4 flex justify-between items-center">
              <div>
                <h4 className="text-[0.95rem] text-slate-900 dark:text-white font-semibold mb-1">Izin Akses Kamera</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Atur ulang jika scanner kamera tidak muncul.</p>
              </div>
              <button 
                onClick={() => alert('Izin kamera telah diatur ulang. Silakan izinkan akses saat membuka scanner.')}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Reset Akses
              </button>
            </div>
          </div>

          {/* SYSTEM PREFERENCES */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="text-base font-bold mb-5 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-white">
              <Sliders className="w-5 h-5 text-emerald-500" /> Preferensi Tampilan & Suara
            </div>

            <div className="py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <h4 className="text-[0.95rem] text-slate-900 dark:text-white font-semibold mb-1">Suara Notifikasi</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Bunyikan nada konfirmasi saat scan barcode berhasil.</p>
              </div>
              <label className="relative inline-block w-11 h-6 cursor-pointer">
                <input type="checkbox" defaultChecked className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
              </label>
            </div>

            <div className="py-4 flex justify-between items-center">
              <div>
                <h4 className="text-[0.95rem] text-slate-900 dark:text-white font-semibold mb-1 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-emerald-500" /> Mode Gelap (Dark Mode)
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Beralih ke antarmuka gelap untuk kenyamanan mata.</p>
              </div>
              <label className="relative inline-block w-11 h-6 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isDarkMode}
                  onChange={(e) => toggleDarkMode(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-300 dark:bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
              </label>
            </div>
          </div>

          {/* BANTUAN & LOGOUT */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
            <div className="text-center mb-6">
              <h4 className="text-[0.95rem] text-slate-900 dark:text-white font-bold mb-1 flex items-center justify-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-emerald-500" /> Butuh Bantuan Kasir?
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Hubungi tim IT Support Head Office Watch Club.</p>
              <a 
                href="https://wa.me/628118888888" 
                target="_blank" 
                rel="noreferrer"
                className="w-full flex justify-center items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-lg font-semibold transition-colors"
              >
                <Smartphone className="w-4 h-4" /> Hubungi IT Support (WhatsApp)
              </a>
            </div>
            
            <div className="border-t border-slate-200 dark:border-slate-700 my-4"></div>
            
            <button 
              onClick={() => setIsSignOutModalOpen(true)}
              className="w-full flex justify-center items-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3.5 rounded-lg font-semibold transition-colors"
            >
              <LogOut className="w-5 h-5" /> Keluar dari Akun (Logout)
            </button>
          </div>

        </div>
      </div>

      {isSignOutModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[20px] p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-700">
            <div className="text-5xl text-red-500 mb-4 flex justify-center"><LogOut /></div>
            <h3 className="font-bold text-xl mb-2 text-slate-900 dark:text-white">Keluar Akun</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Apakah Anda yakin ingin mengakhiri sesi kasir ini? Anda perlu login kembali untuk mengakses sistem.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsSignOutModalOpen(false)} className="flex-1 px-5 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700">Batal</button>
              <button onClick={() => { setIsSignOutModalOpen(false); onSignOut(); }} className="flex-1 px-5 py-3 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
