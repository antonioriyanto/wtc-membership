import React from 'react';
import { 
  LayoutDashboard, 
  Award, 
  Ticket, 
  Users, 
  ExternalLink,
  ChevronRight,
  ClipboardList,
  Megaphone,
  MessageSquare,
  Store,
  Receipt
} from 'lucide-react';
import { TabType } from '../types';
import { WatchClubLogo } from './WatchClubLogo';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  storesCount: number;
  membersCount: number;
  vouchersCount: number;
  transactionsCount?: number;
  onOpenQuickLauncher: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  storesCount,
  membersCount,
  vouchersCount,
  transactionsCount,
  onOpenQuickLauncher
}) => {
  const navItems: { id: TabType; label: string; icon: React.ComponentType<{ className?: string }>; badge?: string | number }[] = [
    { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaksi Toko Nasional', icon: Receipt, badge: transactionsCount },
    { id: 'stores', label: 'Store & Branch Settings', icon: Store, badge: storesCount },
    { id: 'members', label: 'Member CRM & Ledger', icon: Users, badge: membersCount },
    { id: 'loyalty', label: 'Loyalty & Tier Engine', icon: Award },
    { id: 'vouchers', label: 'Vouchers & Promos', icon: Ticket, badge: vouchersCount },
    { id: 'campaigns', label: 'Comms & Campaigns', icon: Megaphone },
    { id: 'support', label: 'Support Tickets', icon: MessageSquare },
    { id: 'audit', label: 'System Audit Trail', icon: ClipboardList }
  ];

  return (
    <aside className="w-72 bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-200 dark:border-slate-800 shadow-2xl z-30 transition-colors">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex items-center justify-between gap-3 mb-3">
          <WatchClubLogo className="w-36" />
          <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-md">
            HO PIK
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
            Enterprise Cloud Sync • Online
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar">
        <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Management Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 group text-left ${
                isActive
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-sm dark:shadow-inner border border-slate-200 dark:border-slate-700/60'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg transition-colors ${
                  isActive ? 'bg-slate-100 dark:bg-slate-700 text-emerald-600 dark:text-emerald-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 text-xs rounded-full font-semibold ${
                  isActive ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        <div className="pt-6 px-3 pb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          Quick Portals & Switcher
        </div>
        <button
          onClick={onOpenQuickLauncher}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm text-amber-300 bg-amber-950/30 hover:bg-amber-900/40 border border-amber-500/30 transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-200">System Role Switcher</div>
              <div className="text-[10px] text-amber-400/80">Kasir Toko / Member Web</div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-bold flex items-center justify-center text-sm shadow-md">
              HO
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-200 truncate">Head Office</div>
              <div className="text-[11px] text-slate-400 truncate">HO PIK</div>
            </div>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" title="Full Super Admin Authorization"></div>
        </div>
      </div>
    </aside>
  );
};
