import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Member, Transaction, Voucher, LoyaltyConfig, TabType, StoreBranch, SupportTicket, Campaign, AuditLog } from './types';
import { useCustomDialog } from './components/CustomDialogProvider';
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
import { setupFirestoreListeners, seedFirestoreIfEmpty } from './lib/syncFirestore';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './lib/firebase';

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
  const { showAlert } = useCustomDialog();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [adminAuthenticated, setAdminAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('wtc_admin_auth') === 'true';
    } catch {}
    return false;
  });

  const [cashierAuthenticated, setCashierAuthenticated] = useState(() => {
    try {
      return localStorage.getItem('wtc_cashier_auth') === 'true';
    } catch {}
    return false;
  });

  const [cashierName, setCashierName] = useState('Kasir Puri');
  const [cashierStoreName, setCashierStoreName] = useState<string>('Puri Jakarta');
  
  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('wtc_logged_in_member') || null;
    } catch {}
    return null;
  });

  useEffect(() => {
    try {
      localStorage.setItem('wtc_admin_auth', String(adminAuthenticated));
    } catch {}
  }, [adminAuthenticated]);

  useEffect(() => {
    try {
      localStorage.setItem('wtc_cashier_auth', String(cashierAuthenticated));
    } catch {}
  }, [cashierAuthenticated]);

  useEffect(() => {
    try {
      if (loggedInMemberId) {
        localStorage.setItem('wtc_logged_in_member', loggedInMemberId);
      } else {
        localStorage.removeItem('wtc_logged_in_member');
      }
    } catch {}
  }, [loggedInMemberId]);

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

  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('wtc_read_notifs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return new Set(parsed);
      }
    } catch {}
    return new Set();
  });

  useEffect(() => {
    try {
      localStorage.setItem('wtc_read_notifs', JSON.stringify(Array.from(readNotificationIds)));
    } catch {}
  }, [readNotificationIds]);

  const unreadNotificationsCount = useMemo(() => {
    const allIds: string[] = [];
    transactions.forEach(tx => allIds.push(`tx-act-${tx.id}`));
    members.slice(0, 15).forEach(mem => allIds.push(`mem-act-${mem.id}`));
    ['nw-act-1', 'nw-act-2', 'nw-act-3', 'nw-act-4', 'nw-act-5', 'nw-act-6', 'nw-act-7', 'nw-act-8'].forEach(id => allIds.push(id));
    return allIds.filter(id => !readNotificationIds.has(id)).length;
  }, [transactions, members, readNotificationIds]);

  const handleMarkAsRead = (id: string) => {
    setReadNotificationIds(prev => new Set([...prev, id]));
  };

  const handleMarkAllAsRead = () => {
    const allIds: string[] = [];
    transactions.forEach(tx => allIds.push(`tx-act-${tx.id}`));
    members.slice(0, 15).forEach(mem => allIds.push(`mem-act-${mem.id}`));
    ['nw-act-1', 'nw-act-2', 'nw-act-3', 'nw-act-4', 'nw-act-5', 'nw-act-6', 'nw-act-7', 'nw-act-8'].forEach(id => allIds.push(id));
    setReadNotificationIds(new Set(allIds));
  };

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
  const handleUpdateTicket = async (updated: SupportTicket) => {
    try {
      await setDoc(doc(db, 'support', updated.id), updated);
    } catch(err) {}
  };

  const handleMemberSubmitTicket = async (subject: string, message: string, fileUrl?: string) => {
    if (!loggedInMemberId) return;
    const member = members.find(m => m.id === loggedInMemberId);
    if (!member) return;

    const ticketId = 'TCK-' + Date.now().toString().slice(-6);
    const created: any = {
      id: ticketId,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      subject,
      message,
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      messages: [{
        id: 'msg_' + Date.now(),
        sender: 'MEMBER',
        content: message,
        timestamp: new Date().toISOString(),
        attachmentUrl: fileUrl
      }]
    };

    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: member.name,
      actorRole: 'CUSTOMER',
      action: 'TICKET_CREATED',
      details: `Pelanggan mengirimkan tiket bantuan baru: "${subject}".`,
      module: 'SUPPORT_TICKETS'
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'support', ticketId), created);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch (err) {
      console.error("Firestore error:", err);
    }
  };

  const handleAddCampaign = async (campaign: any) => {
    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: 'Superadmin HO',
      actorRole: 'HO_ADMIN',
      action: 'CAMPAIGN_PUBLISHED',
      details: `Kampanye promosi baru diterbitkan: "${campaign.name}" (Popup Web App: ${campaign.showAsPopupOnApp ? 'Ya' : 'Tidak'}).`,
      module: 'VOUCHERS'
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'campaigns', campaign.id), campaign);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch (err) {}
  };

  const handleToggleCampaignStatus = async (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (!target) return;
    try {
      await setDoc(doc(db, 'campaigns', id), { ...target, status: target.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' });
    } catch (err) {}
  };

  const handleDirectPointAdjustment = async (memberId: string, pointsDelta: number, note: string, ticketId: string) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    const updatedMember = { ...target, points: Math.max(0, target.points + pointsDelta) };
    
    const savedTrx: any = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      receiptNo: 'ADJ-' + ticketId,
      memberId: memberId,
      storeId: 'SYS',
      storeName: 'Sistem HO',
      cashierName: 'Admin HO',
      type: pointsDelta > 0 ? 'EARN' : 'REDEEM',
      amount: 0,
      points: Math.abs(pointsDelta),
      timestamp: new Date().toISOString()
    };
    
    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: 'Superadmin HO',
      actorRole: 'HO_ADMIN',
      action: 'MANUAL_POINT_COMPENSATION',
      details: `Penyelesaian ${ticketId}: Disalurkan ${pointsDelta > 0 ? '+' : ''}${pointsDelta} Pts ke ${target.name} (${target.id}). Catatan: ${note}`,
      module: 'SUPPORT_TICKETS'
    };
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'members', updatedMember.id), updatedMember);
      batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch(err) {}
  };


  const handleUpdateMember = async (updatedMember: Member) => {
    try {
      await setDoc(doc(db, 'members', updatedMember.id), updatedMember);
    } catch (err) {
      console.warn("Could not sync member update to Firestore:", err);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteDoc(doc(db, 'members', memberId));
    } catch (err) {
      console.warn("Could not sync member delete to Firestore:", err);
    }
  };

  const handleToggleSuspendMember = async (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    const newStatus = target.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const updatedMember = { ...target, status: newStatus as 'ACTIVE' | 'SUSPENDED' };
    handleUpdateMember(updatedMember);
  };

  // Synchronize loyalty config changes to Firestore
  useEffect(() => {
    try {
      localStorage.setItem('wtc_loyalty_config', JSON.stringify(loyaltyConfig));
      setDoc(doc(db, 'config', 'loyalty'), loyaltyConfig).catch(() => {});
    } catch {}
  }, [loyaltyConfig]);

  useEffect(() => {
    let unsubscribe = () => {};
    async function initFirestore() {
      try {
        await seedFirestoreIfEmpty();
        unsubscribe = setupFirestoreListeners({
          setStores,
          setMembers,
          setVouchers,
          setTransactions,
          setSupportTickets,
          setCampaigns,
          setAuditLogs,
          setLoyaltyConfig
        });
      } catch (err) {
        console.warn("Firestore initialization failed, continuing with local persistence:", err);
      }
    }
    initFirestore();
    return () => unsubscribe();
  }, []);

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    // Realtime listeners already handle this, but we keep the visual feedback
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
        cashierAuthenticated ? (
          <CashierPOSView 
            members={members} 
            setMembers={setMembers}
            transactions={transactions} 
            setTransactions={setTransactions}
            currentStore={stores.find(s => s.name.toLowerCase() === cashierStoreName.toLowerCase() || s.code.toLowerCase() === cashierStoreName.toLowerCase()) || stores[0] || initialStores[0]}
            cashierName={cashierName}
            onSignOut={() => {
              setCashierAuthenticated(false);
              try { localStorage.removeItem('wtc_cashier_auth'); } catch {}
              navigate('/cashier');
            }}
            onSwitchPerspective={(p) => navigate(p === 'HO' ? '/' : '/' + p.toLowerCase())}
          />
        ) : (
          <AdminLogin 
            onLogin={(user, storeName) => {
              if (user) setCashierName(user);
              if (storeName) setCashierStoreName(storeName);
              setCashierAuthenticated(true);
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
            onBackToHO={() => {
              setLoggedInMemberId(null);
              try { localStorage.removeItem('wtc_logged_in_member'); } catch {}
              navigate('/member');
            }}
            campaigns={campaigns}
            tickets={supportTickets}
            onSubmitTicket={handleMemberSubmitTicket}
          />
        ) : (
          <MemberLogin 
            members={members}
            onLogin={(id) => setLoggedInMemberId(id)} 
            onRegisterGoogle={async () => {
              try {
                const { signInWithPopup } = await import('firebase/auth');
                const { auth, googleProvider, db } = await import('./lib/firebase');
                const { doc, getDoc, setDoc, serverTimestamp } = await import('firebase/firestore');
                
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                const userRef = doc(db, 'members', user.uid);
                const userSnap = await getDoc(userRef);
                
                if (!userSnap.exists()) {
                  // Generate a realistic membership ID instead of using the raw Firebase UID for the UI
                  const shortUid = user.uid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
                  const membershipId = 'ONL' + shortUid;
                  
                  const newMember = {
                    id: user.uid,
                    membershipId: membershipId, // Added readable membership ID
                    name: user.displayName || 'Google User',
                    phone: user.phoneNumber || '', 
                    email: user.email || '',
                    joinDate: new Date().toISOString().split('T')[0],
                    points: 0,
                    tier: 'BLUE',
                    totalSpent: 0,
                    registeredStore: 'Online',
                    lastStoreVisited: 'Online',
                    createdAt: new Date().toISOString()
                  };
                  await setDoc(userRef, newMember);
                }
                
                setLoggedInMemberId(user.uid);
              } catch (e: any) {
                console.error("Google Sign-In Error", e);
                showAlert('Gagal login dengan Google: ' + e.message, 'Login Gagal', 'error');
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
              onLogout={() => {
                setAdminAuthenticated(false);
                try { localStorage.removeItem('wtc_admin_auth'); } catch {}
                navigate('/');
              }}
            />

            <main className="flex-1 flex flex-col h-full overflow-hidden relative z-0">
              <Header 
                onSearch={() => {}}
                onOpenCreateVoucher={() => setIsCreateVoucherOpen(true)}
                onOpenManualAdjust={() => setIsPointAdjustOpen(true)}
                onRefreshData={handleRefreshData}
                isRefreshing={isRefreshingData}
                onOpenNotifications={() => setIsNotificationsOpen(true)}
                unreadNotificationsCount={unreadNotificationsCount}
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
                    isSkeletonLoading={isRefreshingData}
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
                    isSkeletonLoading={isRefreshingData}
                  />
                )}
                {activeTab === 'loyalty' && (
                  <LoyaltyRulesTab config={loyaltyConfig} setConfig={setLoyaltyConfig} isSkeletonLoading={isRefreshingData} />
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
                        await setDoc(doc(db, 'vouchers', voucherId), updated);
                      } catch (err) {
                        console.warn('API error updating voucher status:', err);
                      }
                    }}
                    isSkeletonLoading={isRefreshingData}
                  />
                )}
                {activeTab === 'transactions' && (
                  <NationalTransactionsTab 
                    stores={stores}
                    transactions={transactions}
                    members={members}
                    initialSelectedStore={selectedStoreForTrx}
                    onSelectStore={(store) => setSelectedStoreForTrx(store)}
                    isSkeletonLoading={isRefreshingData}
                  />
                )}
                {activeTab === 'audit' && (
                  <AuditTrailTab logs={auditLogs} isSkeletonLoading={isRefreshingData} />
                )}
                {activeTab === 'campaigns' && (
                  <CampaignsTab 
                    campaigns={campaigns}
                    onAddCampaign={handleAddCampaign}
                    onToggleCampaignStatus={handleToggleCampaignStatus}
                    onDeleteCampaign={handleDeleteCampaign}
                    vouchers={vouchers}
                    isSkeletonLoading={isRefreshingData}
                  />
                )}
                {activeTab === 'support' && (
                  <SupportTicketsTab 
                    tickets={supportTickets}
                    onUpdateTicket={handleUpdateTicket}
                    onDirectPointAdjustment={handleDirectPointAdjustment}
                    members={members}
                    stores={stores}
                    isSkeletonLoading={isRefreshingData}
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
                  await setDoc(doc(db, 'members', created.id), created);
                } catch (err) {
                  console.warn("Backend API unavailable, saved member locally:", err);
                }
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
                    await setDoc(doc(db, 'vouchers', updated.id), updated);
                  } catch (err) {}
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
                    await setDoc(doc(db, 'vouchers', created.id), created);
                  } catch (err) {}
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
                  const batch = writeBatch(db);
                  batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
                  batch.set(doc(db, 'members', updatedMember.id), updatedMember);
                  await batch.commit();
                } catch (e: any) {
                  console.warn("Backend API unavailable, applied adjustment locally:", e);
                }
                showAlert('Penyesuaian poin berhasil disimpan!', 'Poin Berhasil Disesuaikan', 'success');
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
              readIds={readNotificationIds}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
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

