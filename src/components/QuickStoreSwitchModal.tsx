import React from 'react';
import { X, Building2, MonitorSmartphone, Smartphone } from 'lucide-react';

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
    { id: 'HO', name: 'Head Office Admin', desc: 'Central management dashboard', icon: Building2 },
    { id: 'CASHIER', name: 'Kasir Toko', desc: 'Store-level checkout and points', icon: MonitorSmartphone },
    { id: 'MEMBER', name: 'Customer App', desc: 'Mobile membership view', icon: Smartphone }
  ] as const;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scaleUp">
        <div className="flex justify-between items-center p-5 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">Switch System Role</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
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
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  isActive 
                    ? 'border-emerald-500 bg-emerald-50' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className={`p-3 rounded-lg ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <div className={`font-bold ${isActive ? 'text-emerald-700' : 'text-slate-900'}`}>{role.name}</div>
                  <div className={`text-sm ${isActive ? 'text-emerald-600/80' : 'text-slate-500'}`}>{role.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
