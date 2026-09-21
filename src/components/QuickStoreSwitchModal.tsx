import React from 'react';
import { X, Building2, MonitorSmartphone, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';

interface QuickStoreSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchView: (view: 'HO' | 'CASHIER' | 'MEMBER') => void;
  currentView: 'HO' | 'CASHIER' | 'MEMBER';
}

export const QuickStoreSwitchModal: React.FC<QuickStoreSwitchModalProps> = ({
  isOpen, onClose, onSwitchView, currentView
}) => {
  if (!isOpen) return null;

  const roles = [
    { 
      id: 'HO', 
      name: 'Head Office Admin', 
      desc: 'Pusat Manajemen Omnichannel, Aturan Loyalty & Laporan Nasional', 
      badge: 'Superadmin HO',
      detail: 'Akses penuh seluruh 40+ cabang, audit trail, dan analitik pusat.',
      icon: Building2 
    },
    { 
      id: 'CASHIER', 
      name: 'Kasir Toko (POS)', 
      desc: 'Terminal Kasir & Scanner QR Loyalitas', 
      badge: 'Default: 23 Semarang',
      detail: 'Cabang Default: 23 Semarang Shopping Center (23SMG)',
      icon: MonitorSmartphone 
    },
    { 
      id: 'MEMBER', 
      name: 'Customer App (PWA)', 
      desc: 'Portal Loyalitas Pelanggan & QR Barcode Member', 
      badge: 'Default: 081903987051',
      detail: 'Akun Default: Aan (081903987051, Tier BLUE, 857 Pts)',
      icon: Smartphone 
    }
  ] as const;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-modalIn">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Pengalih Peran Sistem (Switch System Role)</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pratinjau Sinkronisasi Lintas Portal (Akses Khusus Admin HO)</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <p className="leading-relaxed">
            <span className="font-bold">Limitasi Keamanan:</span> Floating portal switcher hanya aktif ketika sesi Admin HO membuka preview pengalih peran ini. Pada web cashier dan web PWA customer publik, pengalih peran ini otomatis disembunyikan dan tidak dapat diakses.
          </p>
        </div>

        {/* Roles List */}
        <div className="p-5 space-y-3">
          {roles.map(role => {
            const Icon = role.icon;
            const isActive = currentView === role.id;
            return (
              <button
                key={role.id}
                onClick={() => {
                  onSwitchView(role.id);
                  onClose();
                }}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all group ${
                  isActive 
                    ? 'border-amber-500 bg-amber-500/10 shadow-sm' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-3 rounded-xl ${
                    isActive 
                      ? 'bg-amber-500 text-slate-950 font-bold' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:text-amber-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-sm ${isActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                        {role.name}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isActive 
                          ? 'bg-amber-500 text-slate-950' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        {role.badge}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">{role.desc}</div>
                    <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-0.5 flex items-center gap-1">
                      <span>• {role.detail}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-1 transition-all shrink-0 ml-2" />
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Sinkronisasi database live terhubung</span>
          <button 
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold transition-colors text-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

