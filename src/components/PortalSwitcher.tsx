import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Building2, Store, Smartphone, Layers, ChevronDown, ChevronUp } from 'lucide-react';

interface PortalSwitcherProps {
  onSwitch: (portal: 'HO' | 'CASHIER' | 'MEMBER') => void;
}

export const PortalSwitcher: React.FC<PortalSwitcherProps> = ({ onSwitch }) => {
  const location = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);

  // Determine current active portal based on URL pathname
  let currentPortal: 'HO' | 'CASHIER' | 'MEMBER' = 'HO';
  if (location.pathname.startsWith('/cashier')) {
    currentPortal = 'CASHIER';
  } else if (location.pathname.startsWith('/member')) {
    currentPortal = 'MEMBER';
  }

  const portals = [
    {
      id: 'HO' as const,
      label: 'HO',
      fullLabel: 'Head Office',
      icon: Building2,
      description: 'Superadmin HO Dashboard'
    },
    {
      id: 'CASHIER' as const,
      label: 'Kasir',
      fullLabel: 'Kasir Toko',
      icon: Store,
      description: 'POS Kasir & Transaksi'
    },
    {
      id: 'MEMBER' as const,
      label: 'Customer',
      fullLabel: 'Customer App',
      icon: Smartphone,
      description: 'Portal Loyalitas Member'
    }
  ];

  if (isMinimized) {
    return (
      <aside 
        aria-label="Portal Switcher Mini"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999]"
      >
        <button
          id="portal-switcher-restore-btn"
          onClick={() => setIsMinimized(false)}
          title="Buka Portal Switcher (HO / Kasir / Customer)"
          className="flex items-center gap-2 bg-slate-900/95 hover:bg-slate-800 text-white px-3.5 py-2.5 rounded-full shadow-2xl border border-slate-700/80 backdrop-blur-md transition-all transform hover:scale-105 group"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <Layers className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
          <span className="text-xs font-bold tracking-wide">
            Portal: <span className="text-amber-400">{currentPortal}</span>
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
        </button>
      </aside>
    );
  }

  return (
    <aside 
      aria-label="Portal Switcher"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[99999] select-none"
    >
      <div 
        id="floating-portal-switcher"
        className="bg-slate-900/95 text-white backdrop-blur-md p-1.5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-slate-700/80 flex items-center gap-1 transition-all"
      >
        {/* Title Tag */}
        <div className="hidden md:flex items-center gap-1.5 pl-3 pr-2 text-[11px] font-bold tracking-wider uppercase text-slate-400">
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Portal:</span>
        </div>

        {/* Portal Options */}
        <div className="flex items-center gap-1">
          {portals.map((portal) => {
            const Icon = portal.icon;
            const isActive = currentPortal === portal.id;

            return (
              <button
                key={portal.id}
                id={`portal-btn-${portal.id.toLowerCase()}`}
                onClick={() => onSwitch(portal.id)}
                title={`Beralih ke ${portal.fullLabel} (${portal.description})`}
                className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-full text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 scale-100 ring-2 ring-amber-300/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/90 active:scale-95'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                <span>{portal.label}</span>
              </button>
            );
          })}
        </div>

        {/* Minimize Button */}
        <button
          id="portal-switcher-minimize-btn"
          onClick={() => setIsMinimized(true)}
          title="Kecilkan Switcher"
          className="p-1.5 ml-0.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
};
