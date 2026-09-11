import React, { useState, useEffect } from 'react';
import { Store, Sun, Moon, LifeBuoy } from 'lucide-react';

interface HeaderProps {
  cashierName: string | null;
  storeName: string;
  onOpenSupportModal?: () => void;
}

export const CashierHeader: React.FC<HeaderProps> = ({
  cashierName,
  storeName,
  onOpenSupportModal
}) => {
  const [timeStr, setTimeStr] = useState('00:00:00');
  const [dateStr, setDateStr] = useState('-- --- ----');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check initial dark mode
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark' || document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const updateClock = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      setDateStr(now.toLocaleDateString('id-ID', dateOptions));
    };

    const interval = setInterval(updateClock, 1000);
    updateClock();

    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const avatarInitials = cashierName ? cashierName.substring(0, 2).toUpperCase() : 'WTC';

  return (
    <header className="bg-white dark:bg-slate-800 px-6 lg:px-8 py-3.5 flex flex-col md:flex-row justify-between md:items-center border-b border-slate-200 dark:border-slate-700/80 sticky top-0 z-20 transition-colors duration-200 gap-3 shadow-xs">
      <div className="flex items-center gap-4">
        {/* Cashier profile info */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-700 rounded-full flex justify-center items-center text-slate-800 dark:text-emerald-400 font-bold text-xs transition-colors border border-slate-200 dark:border-slate-600">
            {avatarInitials}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 transition-colors leading-tight">
              {storeName ? `Kasir: ${storeName.toUpperCase()}` : 'Kasir Aktif'}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 transition-colors">
              <span>{dateStr}</span> &nbsp;•&nbsp; 
              <span className="font-mono">{timeStr}</span>
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3.5 justify-between md:justify-end w-full md:w-auto">
        {/* Current Store Badge */}
        <div className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm flex items-center bg-slate-100 dark:bg-slate-700/60 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
          <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-2" />
          <span>{storeName}</span>
        </div>

        {/* Report to HO Support Button */}
        {onOpenSupportModal && (
          <button 
            onClick={onOpenSupportModal}
            title="Laporkan Kendala Kasir/Teknis ke HO"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors border border-amber-300 dark:border-amber-700 cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Lapor HO</span>
          </button>
        )}

        {/* Theme Toggle Button (Light/Dark) */}
        <button 
          onClick={toggleTheme}
          title={isDarkMode ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600 cursor-pointer"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mode Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Mode Gelap</span>
            </>
          )}
        </button>

        {/* Online Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-lg text-xs font-bold shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> 
          <span>Sistem Aktif</span>
        </div>
      </div>
    </header>
  );
};
