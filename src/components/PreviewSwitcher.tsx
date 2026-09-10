import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const PreviewSwitcher: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/50 flex items-center gap-3 text-xs font-medium transition-all">
      <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-slate-200">Portal Switcher</span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => navigate('/')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${location.pathname === '/' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          HO Admin
        </button>
        <button
          onClick={() => navigate('/cashier')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${location.pathname === '/cashier' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Kasir Toko
        </button>
        <button
          onClick={() => navigate('/member')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${location.pathname === '/member' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
        >
          Customer
        </button>
      </div>
    </div>
  );
};
