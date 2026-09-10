import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Member, Transaction, Voucher, LoyaltyConfig, TabType, StoreBranch, SupportTicket, Campaign, AuditLog } from './types';
import { 
  initialStores, 
  initialMembers, 
  initialVouchers, 
  initialTransactions, 
  initialLoyaltyConfig,
  initialSupportTickets,
  initialCampaigns,
  initialAuditLogs
} from './data/mockData';
import { calculateTier } from './lib/loyalty';

// HO Components
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { OverviewTab } from './components/OverviewTab';
import { MembersTab } from './components/MembersTab';
import { LoyaltyRulesTab } from './components/LoyaltyRulesTab';
import { VouchersTab } from './components/VouchersTab';
import { AuditTrailTab } from './components/AuditTrailTab';
import { CampaignsTab } from './components/CampaignsTab';
import { SupportTicketsTab } from './components/SupportTicketsTab';
import { StoresSettingsTab } from './components/StoresSettingsTab';
import { NationalTransactionsTab } from './components/NationalTransactionsTab';
import { QuickStoreSwitchModal } from './components/QuickStoreSwitchModal';
import { CreateVoucherModal } from './components/CreateVoucherModal';
import { CreateMemberModal } from './components/CreateMemberModal';
import { ManualPointAdjustmentModal } from './components/ManualPointAdjustmentModal';

// Roles Components
import { CashierPOSView } from './components/CashierPOSView';
import { CustomerMemberView } from './components/CustomerMemberView';
import { AdminLogin, MemberLogin } from './components/LoginWall';
import { PortalSwitcher } from './components/PortalSwitcher';
import { StoreTransactionsModal } from './components/StoreTransactionsModal';
import { NationalActivityNotifications } from './components/NationalActivityNotifications';

export default function App() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [cashierName, setCashierName] = useState('Kasir Puri');
  const [cashierStoreName, setCashierStoreName] = useState<string>('Puri Jakarta');
  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  
  const [stores, setStores] = useState<StoreBranch[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_stores');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialStores;
  });

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_members');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialMembers;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_vouchers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialVouchers;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialTransactions;
  });

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(() => {
    try {
      const saved = localStorage.getItem('wtc_loyalty_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return initialLoyaltyConfig;
  });

  // Support Tickets State with LocalStorage Persistence
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_tickets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialSupportTickets;
  });

  // Campaigns & Comms State with LocalStorage Persistence
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_campaigns');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialCampaigns;
  });

  // System Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return initialAuditLogs;
  });

  const [loading, setLoading] = useState(false);

  const [isQuickLauncherOpen, setIsQuickLauncherOpen] = useState(false);
  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [isPointAdjustOpen, setIsPointAdjustOpen] = useState(false);
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isStoreTransactionsModalOpen, setIsStoreTransactionsModalOpen] = useState(false);
  const [selectedStoreForTrx, setSelectedStoreForTrx] = useState<StoreBranch | null>(null);

  // Navigate directly to dedicated National Transactions tab (No popup!)
  const handleOpenStoreTransactions = (store: StoreBranch | null) => {
    setSelectedStoreForTrx(store);
    setActiveTab('transactions');
  };

  // Support Ticket Handlers
  const handleUpdateTicket = (updated: SupportTicket) => {
    setSupportTickets(prev => {
      const next = prev.map(t => t.id === updated.id ? updated : t);
      try { localStorage.setItem('wtc_tickets', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleDirectPointAdjustment = async (memberId: string, pointsDelta: number, note: string, ticketId: string) => {
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return false;

    const newPoints = Math.max(0, (member.points || 0) + pointsDelta);
    const newLifetime = pointsDelta > 0 ? (member.lifetimePoints || 0) + pointsDelta : (member.lifetimePoints || 0);
    const updatedMember: Member = {
      ...member,
      points: newPoints,
      lifetimePoints: newLifetime,
      tier: calculateTier(newPoints)
    };

    const savedTrx: Transaction = {
      id: 'tx_' + Date.now(),
      receiptNo: 'ADJ-' + ticketId + '-' + Date.now().toString().slice(-4),
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      storeId: 'S-HQ',
      storeName: 'Head Office (Customer Care)',
      cashierName: 'Superadmin HO',
      type: 'MANUAL_ADJUSTMENT',
      amount: 0,
      pointsDelta: pointsDelta,
      timestamp: new Date().toISOString(),
      notes: `Penyelesaian Tiket ${ticketId}: ${note}`
    };

    setMembers(prev => {
      const next = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
      try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
      return next;
    });

    setTransactions(prev => {
      const next = [savedTrx, ...prev];
      try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
      return next;
    });

    // Record system audit log
    const auditEntry: AuditLog = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: 'Superadmin HO',
      actorRole: 'HO_ADMIN',
      action: 'MANUAL_POINT_COMPENSATION',
      details: `Penyelesaian ${ticketId}: Disalurkan ${pointsDelta > 0 ? '+' : ''}${pointsDelta} Pts ke ${member.name} (${member.membershipId}). Catatan: ${note}`,
      module: 'SUPPORT_TICKETS'
    };

    setAuditLogs(prev => {
      const next = [auditEntry, ...prev];
      try { localStorage.setItem('wtc_audit_logs', JSON.stringify(next)); } catch {}
      return next;
    });

    return true;
  };

  const handleMemberSubmitTicket = (newTicket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages' | 'status'> & { initialMessage: string }) => {
    const ticketId = 'TKT-' + Math.floor(1050 + Math.random() * 8900);
    const now = new Date().toISOString();
    const created: SupportTicket = {
      id: ticketId,
      source: newTicket.source,
      memberId: newTicket.memberId,
      memberName: newTicket.memberName,
      memberPhone: newTicket.memberPhone,
      storeId: newTicket.storeId,
      storeName: newTicket.storeName,
      subject: newTicket.subject,
      category: newTicket.category,
      status: 'OPEN',
      priority: newTicket.priority || 'HIGH',
      createdAt: now,
      updatedAt: now,
      receiptNo: newTicket.receiptNo,
      messages: [
        {
          sender: 'MEMBER',
          text: newTicket.initialMessage,
          timestamp: now
        }
      ]
    };

    setSupportTickets(prev => {
      const next = [created, ...prev];
      try { localStorage.setItem('wtc_tickets', JSON.stringify(next)); } catch {}
      return next;
    });

    // Audit log
    const auditEntry: AuditLog = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: now,
      actorName: `${newTicket.memberName || 'Member'} (${newTicket.memberPhone || '-'})`,
      actorRole: 'SYSTEM',
      action: 'SUPPORT_TICKET_CREATED',
      details: `Tiket baru ${ticketId} diajukan oleh Member: "${newTicket.subject}" (Kategori: ${newTicket.category}, Toko: ${newTicket.storeName || '-'}).`,
      module: 'SUPPORT_TICKETS'
    };
    setAuditLogs(prev => {
      const next = [auditEntry, ...prev];
      try { localStorage.setItem('wtc_audit_logs', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleAddCampaign = (campaign: Campaign) => {
    setCampaigns(prev => {
      const next = [campaign, ...prev];
      try { localStorage.setItem('wtc_campaigns', JSON.stringify(next)); } catch {}
      return next;
    });

    const auditEntry: AuditLog = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: 'Superadmin HO',
      actorRole: 'HO_ADMIN',
      action: 'CAMPAIGN_PUBLISHED',
      details: `Kampanye promosi baru diterbitkan: "${campaign.name}" (Popup Web App: ${campaign.showAsPopupOnApp ? 'Ya' : 'Tidak'}).`,
      module: 'VOUCHERS'
    };
    setAuditLogs(prev => {
      const next = [auditEntry, ...prev];
      try { localStorage.setItem('wtc_audit_logs', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleToggleCampaignStatus = (id: string) => {
    setCampaigns(prev => {
      const next = prev.map(c => c.id === id ? { ...c, status: c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : c);
      try { localStorage.setItem('wtc_campaigns', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns(prev => {
      const next = prev.filter(c => c.id !== id);
      try { localStorage.setItem('wtc_campaigns', JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const handleUpdateMember = async (updatedMember: Member) => {
    setMembers(prev => {
      const next = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
      try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await fetch(`/api/members/${updatedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMember)
      });
    } catch (err) {
      console.warn("Could not sync member update to server:", err);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    setMembers(prev => {
      const next = prev.filter(m => m.id !== memberId);
      try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
      return next;
    });

    try {
      await fetch(`/api/members/${memberId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Could not sync member delete to server:", err);
    }
  };

  const handleToggleSuspendMember = async (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    const newStatus = target.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const updatedMember = { ...target, status: newStatus as 'ACTIVE' | 'SUSPENDED' };
    handleUpdateMember(updatedMember);
  };

  // Synchronize loyalty config changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wtc_loyalty_config', JSON.stringify(loyaltyConfig));
    } catch {}
  }, [loyaltyConfig]);

  useEffect(() => {
    async function loadData() {
      try {
        const [storesRes, memRes, vouchRes, trxRes, confRes] = await Promise.all([
          fetch('/api/stores').catch(() => null),
          fetch('/api/members').catch(() => null),
          fetch('/api/vouchers').catch(() => null),
          fetch('/api/transactions').catch(() => null),
          fetch('/api/config').catch(() => null)
        ]);

        if (storesRes && storesRes.ok) {
          const dbStores = await storesRes.json();
          if (Array.isArray(dbStores) && dbStores.length > 0) {
            setStores(dbStores);
            try { localStorage.setItem('wtc_stores', JSON.stringify(dbStores)); } catch {}
          }
        }
        if (memRes && memRes.ok) {
          const dbMembers = await memRes.json();
          if (Array.isArray(dbMembers) && dbMembers.length > 0) {
            setMembers(dbMembers);
            try { localStorage.setItem('wtc_members', JSON.stringify(dbMembers)); } catch {}
          }
        }
        if (vouchRes && vouchRes.ok) {
          const dbVouchers = await vouchRes.json();
          if (Array.isArray(dbVouchers) && dbVouchers.length > 0) {
            setVouchers(dbVouchers);
            try { localStorage.setItem('wtc_vouchers', JSON.stringify(dbVouchers)); } catch {}
          }
        }
        if (trxRes && trxRes.ok) {
          const dbTrx = await trxRes.json();
          if (Array.isArray(dbTrx) && dbTrx.length > 0) {
            setTransactions(dbTrx);
            try { localStorage.setItem('wtc_transactions', JSON.stringify(dbTrx)); } catch {}
          }
        }
        if (confRes && confRes.ok) {
          const dbConf = await confRes.json();
          if (dbConf && !dbConf.error) {
            setLoyaltyConfig(dbConf);
            try { localStorage.setItem('wtc_loyalty_config', JSON.stringify(dbConf)); } catch {}
          }
        }
      } catch (err) {
        console.warn("Backend database unreachable, continuing with local persistence:", err);
      }
    }
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    try {
      const [trxRes, memRes, storeRes, vouchRes, confRes] = await Promise.all([
        fetch('/api/transactions').catch(() => null),
        fetch('/api/members').catch(() => null),
        fetch('/api/stores').catch(() => null),
        fetch('/api/vouchers').catch(() => null),
        fetch('/api/loyalty-config').catch(() => null),
      ]);

      if (trxRes && trxRes.ok) {
        const data = await trxRes.json();
        if (Array.isArray(data) && data.length > 0) setTransactions(data);
      }
      if (memRes && memRes.ok) {
        const data = await memRes.json();
        if (Array.isArray(data) && data.length > 0) setMembers(data);
      }
      if (storeRes && storeRes.ok) {
        const data = await storeRes.json();
        if (Array.isArray(data) && data.length > 0) setStores(data);
      }
      if (vouchRes && vouchRes.ok) {
        const data = await vouchRes.json();
        if (Array.isArray(data) && data.length > 0) setVouchers(data);
      }
      if (confRes && confRes.ok) {
        const data = await confRes.json();
        if (data && !data.error) setLoyaltyConfig(data);
      }
    } catch (e) {
      console.warn("Manual refresh failed to reach server:", e);
    }

    setTimeout(() => {
      setIsRefreshingData(false);
    }, 1100);
  };

  // Toggle floating portal switcher (dinonaktifkan sementara sesuai permintaan pengguna)
  const SHOW_PORTAL_SWITCHER = false;

  const handleSwitchPortal = (portal: 'HO' | 'CASHIER' | 'MEMBER') => {
    if (portal === 'HO') {
      setAdminAuthenticated(true);
      navigate('/');
    } else if (portal === 'CASHIER') {
      setAdminAuthenticated(true);
      navigate('/cashier');
    } else if (portal === 'MEMBER') {
      if (!loggedInMemberId && members.length > 0) {
        setLoggedInMemberId(members[0].id);
      }
      navigate('/member');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 animate-pulse">Connecting to Database...</p></div>;
  }

  return (
    <>
      <Routes>
        <Route path="/cashier" element={
        adminAuthenticated ? (
          <CashierPOSView 
            members={members} 
            setMembers={setMembers}
            transactions={transactions} 
            setTransactions={setTransactions}
            currentStore={stores.find(s => s.name.toLowerCase() === cashierStoreName.toLowerCase() || s.code.toLowerCase() === cashierStoreName.toLowerCase()) || stores[0] || initialStores[0]}
            cashierName={cashierName}
            onSignOut={() => setAdminAuthenticated(false)}
            onSwitchPerspective={(p) => navigate(p === 'HO' ? '/' : '/' + p.toLowerCase())}
          />
        ) : (
          <AdminLogin 
            onLogin={(user, storeName) => {
              if (user) setCashierName(user);
              if (storeName) setCashierStoreName(storeName);
              setAdminAuthenticated(true);
            }} 
            title="Portal Kasir Toko" 
            subtitle="Masuk menggunakan Login ID (Username) dan Password cabang toko Anda." 
            showStoreQuickSelect={true}
          />
        )
      } />
      
      <Route path="/member" element={
        loggedInMemberId ? (
          <CustomerMemberView 
            member={members.find(m => m.id === loggedInMemberId) || members[0]}
            vouchers={vouchers}
            stores={stores}
            transactions={transactions}
            onBackToHO={() => navigate('/')}
            campaigns={campaigns}
            tickets={supportTickets}
            onSubmitTicket={handleMemberSubmitTicket}
          />
        ) : (
          <MemberLogin 
            onLogin={(id) => setLoggedInMemberId(id)} 
            onRegisterGoogle={async () => {
              // Create mock Google user
              const newMember = {
                id: 'mem_' + Date.now(),
                name: 'Google User',
                phone: '0812' + Math.floor(Math.random() * 1000000),
                email: 'user' + Date.now() + '@gmail.com',
                joinDate: new Date().toISOString().split('T')[0],
                points: 0,
                tier: 'BLUE',
                totalSpent: 0,
                registeredStore: 'Puri Jakarta',
                lastStoreVisited: 'Puri Jakarta'
              };
              try {
                await fetch('/api/members', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newMember)
                });
                setMembers([...members, newMember as any]);
                setLoggedInMemberId(newMember.id);
              } catch (e) {
                console.error(e);
              }
            }} 
          />
        )
      } />
      
      <Route path="*" element={
        adminAuthenticated ? (
          <div className="flex h-screen bg-[#f8f9fc] text-slate-800 font-sans overflow-hidden">
            <Sidebar 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              storesCount={stores.length}
              membersCount={members.length}
              vouchersCount={vouchers.length}
              onOpenQuickLauncher={() => setIsQuickLauncherOpen(true)}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
              <Header 
                onSearch={() => {}}
                onOpenCreateVoucher={() => setIsCreateVoucherOpen(true)}
                onOpenManualAdjust={() => setIsPointAdjustOpen(true)}
                onRefreshData={handleRefreshData}
                isRefreshing={isRefreshingData}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                unreadNotificationsCount={transactions.length > 0 ? 8 : 4}
              />

              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {activeTab === 'overview' && (
                  <OverviewTab 
                    stores={stores}
                    members={members}
                    transactions={transactions}
                    vouchers={vouchers}
                    loyaltyConfig={loyaltyConfig}
                    isSkeletonLoading={isRefreshingData}
                    onNavigateToStores={() => handleOpenStoreTransactions(null)}
                    onNavigateToMembers={() => setActiveTab('members')}
                    onNavigateToVouchers={() => setActiveTab('vouchers')}
                    onOpenManualAdjust={() => setIsPointAdjustOpen(true)}
                    onSelectStore={(store) => handleOpenStoreTransactions(store)}
                  />
                )}
                {activeTab === 'stores' && (
                  <StoresSettingsTab 
                    stores={stores} 
                    setStores={setStores} 
                    onViewTransactions={(store) => handleOpenStoreTransactions(store)} 
                  />
                )}
                {activeTab === 'members' && (
                  <MembersTab 
                    members={members}
                    stores={stores}
                    transactions={transactions}
                    onOpenCreateMember={() => setIsCreateMemberOpen(true)}
                    onUpdateMember={handleUpdateMember}
                    onDeleteMember={handleDeleteMember}
                    onToggleSuspendMember={handleToggleSuspendMember}
                    onOpenPointAdjust={() => setIsPointAdjustOpen(true)}
                  />
                )}
                {activeTab === 'loyalty' && (
                  <LoyaltyRulesTab config={loyaltyConfig} setConfig={setLoyaltyConfig} />
                )}
                {activeTab === 'vouchers' && (
                  <VouchersTab 
                    vouchers={vouchers} 
                    stores={stores}
                    onCreateVoucher={() => {
                      setEditingVoucher(null);
                      setIsCreateVoucherOpen(true);
                    }}
                    onEditVoucher={(v) => {
                      setEditingVoucher(v);
                      setIsCreateVoucherOpen(true);
                    }}
                    onToggleVoucherStatus={async (voucherId) => {
                      const target = vouchers.find(v => v.id === voucherId);
                      if (!target) return;
                      const nextStatus = target.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                      const updated = { ...target, status: nextStatus as any };
                      try {
                        await fetch(`/api/vouchers/${voucherId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ status: nextStatus })
                        });
                      } catch (err) {
                        console.warn('API error updating voucher status:', err);
                      }
                      setVouchers(prev => {
                        const next = prev.map(v => v.id === voucherId ? updated : v);
                        try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
                        return next;
                      });
                    }}
                  />
                )}
                {activeTab === 'transactions' && (
                  <NationalTransactionsTab 
                    stores={stores}
                    transactions={transactions}
                    members={members}
                    initialSelectedStore={selectedStoreForTrx}
                    onSelectStore={(store) => setSelectedStoreForTrx(store)}
                  />
                )}
                {activeTab === 'audit' && (
                  <AuditTrailTab logs={auditLogs} />
                )}
                {activeTab === 'campaigns' && (
                  <CampaignsTab 
                    campaigns={campaigns}
                    onAddCampaign={handleAddCampaign}
                    onToggleCampaignStatus={handleToggleCampaignStatus}
                    onDeleteCampaign={handleDeleteCampaign}
                    vouchers={vouchers}
                  />
                )}
                {activeTab === 'support' && (
                  <SupportTicketsTab 
                    tickets={supportTickets}
                    onUpdateTicket={handleUpdateTicket}
                    onDirectPointAdjustment={handleDirectPointAdjustment}
                    members={members}
                    stores={stores}
                  />
                )}
              </div>
            </main>

            <QuickStoreSwitchModal 
              isOpen={isQuickLauncherOpen} 
              onClose={() => setIsQuickLauncherOpen(false)} 
              onSwitchView={(p) => navigate(p === 'HO' ? '/' : '/' + p.toLowerCase())} 
              currentView="HO" 
            />

            <CreateMemberModal
              isOpen={isCreateMemberOpen}
              onClose={() => setIsCreateMemberOpen(false)}
              defaultStore={cashierStoreName || 'Puri Jakarta'}
              isStoreLocked={false}
              onCreateMember={async (newMember) => {
                let created: Member = {
                  id: newMember.id || 'mem_' + Date.now(),
                  membershipId: newMember.membershipId || 'MBR-' + Math.floor(100000 + Math.random() * 900000),
                  name: newMember.name || '',
                  phone: newMember.phone || '',
                  email: newMember.email || '',
                  birthDate: newMember.birthDate,
                  gender: (newMember.gender as any) || 'Pria',
                  registeredStore: newMember.registeredStore || 'Puri Jakarta',
                  lastStoreVisited: newMember.lastStoreVisited || 'Puri Jakarta',
                  lastVisitDate: (newMember as any).lastVisitDate || new Date().toISOString(),
                  joinDate: newMember.joinDate || new Date().toISOString(),
                  points: Number(newMember.points) || 0,
                  lifetimePoints: Number(newMember.lifetimePoints) || Number(newMember.points) || 0,
                  totalSpend: Number(newMember.totalSpend) || 0,
                  tier: (newMember.tier as any) || 'BLUE',
                  status: (newMember.status as any) || 'ACTIVE',
                  address: newMember.address
                };

                try {
                  const res = await fetch('/api/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMember)
                  });
                  if (res.ok) {
                    const serverCreated = await res.json();
                    if (serverCreated && serverCreated.id) created = serverCreated;
                  }
                } catch (err) {
                  console.warn("Backend API unavailable, saved member locally:", err);
                }

                setMembers(prev => {
                  const next = [created, ...prev.filter(m => m.id !== created.id)];
                  try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
                  return next;
                });
              }}
            />
            
            <CreateVoucherModal 
              isOpen={isCreateVoucherOpen} 
              onClose={() => {
                setIsCreateVoucherOpen(false);
                setEditingVoucher(null);
              }} 
              stores={stores}
              existingVoucher={editingVoucher}
              onCreateVoucher={async (voucherData) => {
                if (editingVoucher) {
                  let updated: Voucher = {
                    ...editingVoucher,
                    ...voucherData,
                  };

                  try {
                    const res = await fetch(`/api/vouchers/${editingVoucher.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(voucherData)
                    });
                    if (res.ok) {
                      const serverUpdated = await res.json();
                      if (serverUpdated && serverUpdated.id) updated = serverUpdated;
                    }
                  } catch (err) {
                    console.warn("Backend API unavailable, updated voucher locally:", err);
                  }

                  setVouchers(prev => {
                    const next = prev.map(v => v.id === updated.id ? updated : v);
                    try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
                    return next;
                  });
                  setEditingVoucher(null);
                  setIsCreateVoucherOpen(false);
                } else {
                  let created: Voucher = {
                    ...voucherData,
                    id: voucherData.id || 'vch_' + Date.now(),
                    code: (voucherData.code || 'VOUCH-' + Date.now()).toUpperCase(),
                    totalClaimed: Number(voucherData.totalClaimed) || 0,
                    totalUsed: Number(voucherData.totalUsed) || 0,
                    status: voucherData.status || 'ACTIVE'
                  } as Voucher;

                  try {
                    const res = await fetch('/api/vouchers', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(voucherData)
                    });
                    if (res.ok) {
                      const serverCreated = await res.json();
                      if (serverCreated && serverCreated.id) created = serverCreated;
                    }
                  } catch (err) {
                    console.warn("Backend API unavailable, saved voucher locally:", err);
                  }

                  setVouchers(prev => {
                    const next = [created, ...prev.filter(v => v.id !== created.id)];
                    try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
                    return next;
                  });
                  setIsCreateVoucherOpen(false);
                }
              }}
            />
            <ManualPointAdjustmentModal 
              isOpen={isPointAdjustOpen} 
              onClose={() => setIsPointAdjustOpen(false)} 
              members={members} 
              isSubmitting={isAdjustingPoints}
              onSubmitAdjustment={async (memberId, pointsDelta, reason) => {
                if (isAdjustingPoints) return;
                setIsAdjustingPoints(true);
                const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
                if (!member) {
                  setIsAdjustingPoints(false);
                  return;
                }

                const newPoints = Math.max(0, (member.points || 0) + pointsDelta);
                const newLifetime = pointsDelta > 0 ? (member.lifetimePoints || 0) + pointsDelta : (member.lifetimePoints || 0);
                const updatedMember: Member = {
                  ...member,
                  points: newPoints,
                  lifetimePoints: newLifetime,
                  tier: calculateTier(newPoints)
                };

                let savedTrx: Transaction = {
                  id: 'tx_' + Date.now(),
                  receiptNo: 'ADJ-' + Date.now().toString().slice(-6),
                  memberId: member.id,
                  memberName: member.name,
                  memberPhone: member.phone,
                  storeId: 'S-HQ',
                  storeName: 'Head Office',
                  cashierName: 'Superadmin',
                  type: 'MANUAL_ADJUSTMENT',
                  amount: 0,
                  pointsDelta: pointsDelta,
                  timestamp: new Date().toISOString(),
                  notes: reason
                };

                try {
                  const res = await fetch('/api/transactions', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({
                      memberId: member.id,
                      storeId: 'S-HQ',
                      storeName: 'Head Office',
                      cashierName: 'Superadmin',
                      type: 'MANUAL_ADJUSTMENT',
                      amount: 0,
                      pointsDelta: pointsDelta,
                      notes: reason
                    }) 
                  });

                  if (res.ok) {
                    const data = await res.json();
                    if (data.transaction) savedTrx = data.transaction;
                    if (data.member) Object.assign(updatedMember, data.member);
                  }
                } catch (e: any) {
                  console.warn("Backend API unavailable, applied adjustment locally:", e);
                }

                setTransactions(prev => {
                  const next = [savedTrx, ...prev];
                  try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
                  return next;
                });
                setMembers(prev => {
                  const next = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
                  try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
                  return next;
                });
                alert('Penyesuaian poin berhasil disimpan!');
                setIsAdjustingPoints(false);
              }}
            />

            {/* MODAL TRANSAKSI NASIONAL & CABANG TOKO */}
            <StoreTransactionsModal 
              isOpen={isStoreTransactionsModalOpen}
              onClose={() => setIsStoreTransactionsModalOpen(false)}
              selectedStore={selectedStoreForTrx}
              stores={stores}
              transactions={transactions}
              members={members}
              onSelectStore={(store) => setSelectedStoreForTrx(store)}
            />

            {/* MODAL NOTIFIKASI AKTIVITAS SELURUH TOKO DI INDONESIA */}
            <NationalActivityNotifications
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              stores={stores}
              transactions={transactions}
              members={members}
              onSelectStore={(store) => {
                setIsNotificationsOpen(false);
                handleOpenStoreTransactions(store);
              }}
              onRefreshData={handleRefreshData}
              isRefreshing={isRefreshingData}
            />
          </div>
        ) : (
          <AdminLogin onLogin={() => setAdminAuthenticated(true)} title="HO Superadmin Portal" subtitle="Master control room and ledger." showStoreQuickSelect={false} />
        )
      } />
      </Routes>

      {/* FLOATING PORTAL SWITCHER (HO - KASIR - CUSTOMER) - Sementara disembunyikan */}
      {SHOW_PORTAL_SWITCHER && <PortalSwitcher onSwitch={handleSwitchPortal} />}
    </>
  );
}

