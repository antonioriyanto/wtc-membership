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
    <aside className="w-[260px] bg-slate-100 dark:bg-[#0f172a] text-slate-900 dark:text-white flex flex-col h-screen sticky top-0 py-6 transition-colors duration-300 z-20 shrink-0 border-r border-slate-200 dark:border-slate-800">
      <div className="text-center mb-10 px-6 flex justify-center text-slate-900 dark:text-white">
        <div className="w-[160px]">
          <WatchClubLogo />
        </div>
      </div>
      
      <ul className="list-none px-4 m-0 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <li key={item.id} className="m-0">
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                  isActive 
                    ? 'bg-white dark:bg-white/10 text-emerald-600 dark:text-white shadow-sm dark:shadow-none border border-slate-200 dark:border-transparent' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="w-5 text-center mr-3 flex justify-center">
                  <Icon className="w-[18px] h-[18px]" />
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
