import React from 'react';
import { 
  Monitor, 
  Users, 
  History, 
  Settings
} from 'lucide-react';
import { CashierTabType } from '../types';
import { WatchClubLogo } from './WatchClubLogo';

interface SidebarProps {
  activeTab: CashierTabType;
  setActiveTab: (tab: CashierTabType) => void;
}

export const CashierSidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab
}) => {
  const navItems: { id: CashierTabType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'cashier', label: 'Kasir Toko', icon: Monitor },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside className="w-[200px] xl:w-[230px] bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-white flex flex-col h-screen sticky top-0 py-6 transition-colors duration-300 z-20 shrink-0 border-r border-slate-200 dark:border-slate-800">
      <div className="text-center mb-8 px-4 flex justify-center text-slate-900 dark:text-white">
        <div className="w-[120px] xl:w-[145px] transition-all">
          <WatchClubLogo />
        </div>
      </div>
      
      <ul className="list-none px-3 m-0 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id} className="m-0">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3.5 py-2.5 rounded-xl text-xs xl:text-sm font-semibold transition-all duration-300 ${
                  isActive 
                    ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-white shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                }`}
              >
                <div className="w-5 text-center mr-2.5 flex justify-center">
                  <Icon className="w-[16px] xl:w-[18px] h-[16px] xl:h-[18px]" />
                </div>
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};
