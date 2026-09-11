import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-bounce">
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700">
        <div className="flex-grow pr-4">
          <p className="font-bold text-sm">Install Watch Club App</p>
          <p className="text-xs text-slate-300">Tambahkan ke layar utama untuk akses lebih cepat</p>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-slate-100 transition-colors shrink-0 flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Install
        </button>
      </div>
    </div>
  );
};
