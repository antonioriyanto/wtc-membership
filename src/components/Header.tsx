import React from 'react';
import { Search, Plus, RefreshCcw, Bell } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenCreateVoucher: () => void;
  onOpenManualAdjust: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch, 
  onOpenCreateVoucher, 
  onOpenManualAdjust, 
  onRefreshData,
  isRefreshing = false,
  onOpenNotifications,
  unreadNotificationsCount
}) => {
  return (
    <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-20">
      <div className="relative w-96">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search members, vouchers, stores..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
        />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onOpenManualAdjust} className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl shadow-sm transition-all cursor-pointer">
          Point Adjustment
        </button>
        <button onClick={onOpenCreateVoucher} className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
          <Plus className="w-3.5 h-3.5" /> Create Voucher
        </button>
        <div className="h-8 w-px bg-slate-200 mx-1"></div>
        <button 
          onClick={onRefreshData} 
          disabled={isRefreshing}
          title="Segarkan Data"
          className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex justify-center items-center transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
        <button 
          onClick={onOpenNotifications}
          title="Lihat Seluruh Aktivitas Toko di Indonesia"
          className="w-9 h-9 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 flex justify-center items-center transition-colors relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
              {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
            </span>
          ) : (
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          )}
        </button>
      </div>
    </header>
  );
};
