import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCcw, Bell, User, Receipt as ReceiptIcon, Store, Gift, Megaphone, Ticket, ClipboardList, ShieldAlert, BadgePercent, MessageSquare } from 'lucide-react';

interface HeaderProps {
  onSearch: (query: string) => void;
  onOpenCreateVoucher: () => void;
  onOpenManualAdjust: () => void;
  onRefreshData: () => void;
  isRefreshing?: boolean;
  onOpenNotifications?: () => void;
  unreadNotificationsCount?: number;
  members?: any[];
  transactions?: any[];
  stores?: any[];
  vouchers?: any[];
  campaigns?: any[];
  supportTickets?: any[];
  auditLogs?: any[];
  loyaltyConfig?: any;
  onSelectMember?: (member: any) => void;
  onSelectTransaction?: (transaction: any) => void;
  onSelectTab?: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSearch, 
  onOpenCreateVoucher, 
  onOpenManualAdjust, 
  onRefreshData,
  isRefreshing = false,
  onOpenNotifications,
  unreadNotificationsCount,
  members = [],
  transactions = [],
  stores = [],
  vouchers = [],
  campaigns = [],
  supportTickets = [],
  auditLogs = [],
  loyaltyConfig,
  onSelectMember,
  onSelectTransaction,
  onSelectTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
    if (val.trim().length > 1) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const sq = searchQuery.toLowerCase();

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(sq) || 
    (m.phone || '').includes(sq) || 
    (m.membershipId || '').toLowerCase().includes(sq)
  ).slice(0, 3);

  const filteredTransactions = transactions.filter(t => 
    (t.id || '').toLowerCase().includes(sq) || 
    (t.receiptNumber || '').toLowerCase().includes(sq) ||
    (t.memberName || '').toLowerCase().includes(sq)
  ).slice(0, 3);

  const filteredStores = stores.filter(s =>
    (s.name || '').toLowerCase().includes(sq) ||
    (s.branchCode || '').toLowerCase().includes(sq) ||
    (s.city || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredVouchers = vouchers.filter(v =>
    (v.code || '').toLowerCase().includes(sq) ||
    (v.title || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredCampaigns = campaigns.filter(c =>
    (c.title || '').toLowerCase().includes(sq) ||
    (c.status || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredSupportTickets = supportTickets.filter(st =>
    (st.id || '').toLowerCase().includes(sq) ||
    (st.subject || '').toLowerCase().includes(sq) ||
    (st.customerName || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  const filteredAuditLogs = auditLogs.filter(a =>
    (a.id || '').toLowerCase().includes(sq) ||
    (a.action || '').toLowerCase().includes(sq) ||
    (a.details || '').toLowerCase().includes(sq) ||
    (a.actorName || '').toLowerCase().includes(sq)
  ).slice(0, 2);

  // Consider loyalty as matching if keyword is 'loyalty', 'point', 'rule'
  const matchLoyalty = ['loyalty', 'point', 'rule', 'tier'].some(kw => sq.includes(kw));

  const hasResults = filteredMembers.length > 0 || 
                     filteredTransactions.length > 0 || 
                     filteredStores.length > 0 ||
                     filteredVouchers.length > 0 ||
                     filteredCampaigns.length > 0 ||
                     filteredSupportTickets.length > 0 ||
                     filteredAuditLogs.length > 0 ||
                     matchLoyalty;

  return (
    <header className="bg-white px-8 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-20">
      <div className="relative w-[500px] z-50">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Global Omnisearch (Members, Vouchers, Stores, Logs...)"
            value={searchQuery || ''}
            onChange={handleSearchChange}
            onFocus={() => { if (searchQuery.length > 1) setShowDropdown(true); }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all shadow-sm font-medium placeholder:font-normal"
          />
          
        </div>
        
        {/* Global Search Dropdown */}
        {showDropdown && (
          <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden animate-slideUp">
            {!hasResults ? (
              <div className="p-8 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-900">No results found</p>
                <p className="text-xs mt-1">We couldn't find anything matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                
                {matchLoyalty && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <BadgePercent className="w-3 h-3" /> Loyalty & Rules
                    </div>
                    <div 
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTab) onSelectTab('loyalty');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">Loyalty Configuration & Tiers</span>
                        </div>
                        <div className="flex items-center mt-1 pl-1">
                          <span className="text-xs font-medium text-slate-500">Manage point rates, tier thresholds, and expiration rules.</span>
                        </div>
                      </div>
                  </div>
                )}

                {filteredMembers.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3 h-3" /> Members
                    </div>
                    {filteredMembers.map(m => (
                      <div 
                        key={m.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectMember) onSelectMember(m);
                          if (onSelectTab) onSelectTab('members');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{m.name}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{m.tier}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 pl-1">
                          <span className="text-xs font-medium text-slate-500">{m.membershipId}</span>
                          <span className="text-xs font-medium text-slate-500">{m.phone}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredTransactions.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <ReceiptIcon className="w-3 h-3" /> Transactions
                    </div>
                    {filteredTransactions.map(t => (
                      <div 
                        key={t.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTransaction) onSelectTransaction(t);
                          if (onSelectTab) onSelectTab('transactions');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{t.receiptNumber || t.id.slice(0,8)}</span>
                          </div>
                          <span className="text-xs font-bold text-emerald-600">{(t.pointsDelta || 0) > 0 ? '+' : ''}{t.pointsDelta || 0} Pts</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 pl-1">
                          <span className="text-xs font-medium text-slate-500">{t.memberName || 'Unknown Member'}</span>
                          <span className="text-xs font-medium text-slate-400">Rp {(t.amount || 0).toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredVouchers.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Gift className="w-3 h-3" /> Vouchers & Promos
                    </div>
                    {filteredVouchers.map(v => (
                      <div 
                        key={v.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTab) onSelectTab('vouchers');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{v.code}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{v.status}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 pl-1">
                          <span className="text-xs font-medium text-slate-500 line-clamp-1">{v.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredStores.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Store className="w-3 h-3" /> Stores & Branches
                    </div>
                    {filteredStores.map(s => (
                      <div 
                        key={s.id || s.branchCode}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTab) onSelectTab('stores');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">{s.name}</span>
                          <span className="text-xs font-bold text-slate-400">({s.branchCode})</span>
                        </div>
                        <div className="flex items-center mt-1 pl-1">
                          <span className="text-xs font-medium text-slate-500">{s.city}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredCampaigns.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Megaphone className="w-3 h-3" /> Comms & Campaigns
                    </div>
                    {filteredCampaigns.map(c => (
                      <div 
                        key={c.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTab) onSelectTab('campaigns');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{c.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredSupportTickets.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="w-3 h-3" /> Support Tickets
                    </div>
                    {filteredSupportTickets.map(st => (
                      <div 
                        key={st.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTab) onSelectTab('support');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{st.id}</span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">{st.status}</span>
                        </div>
                        <div className="flex items-center mt-1 pl-1">
                          <span className="text-xs font-medium text-slate-500 line-clamp-1">{st.subject} - {st.customerName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {filteredAuditLogs.length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-slate-100/50 border-y border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <ClipboardList className="w-3 h-3" /> System Audit Trail
                    </div>
                    {filteredAuditLogs.map(a => (
                      <div 
                        key={a.id}
                        className="p-3 hover:bg-slate-50 border-b border-slate-50 flex flex-col cursor-pointer transition-colors"
                        onClick={() => {
                          setShowDropdown(false);
                          setSearchQuery('');
                          if (onSelectTab) onSelectTab('audit');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{a.action}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{a.actorName}</span>
                        </div>
                        <div className="flex items-center mt-1 pl-1">
                          <span className="text-[10px] font-medium text-slate-500 line-clamp-1">{a.details}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <div 
          className="flex items-center justify-center px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-help border border-transparent hover:border-slate-200 mr-1"
          title={isOnline ? "Connected to Firestore: Real-time syncing active" : "Offline: Real-time syncing paused until connection restores"}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex h-2.5 w-2.5">
              {isOnline ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" style={{ animationDuration: '2s' }}></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
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
