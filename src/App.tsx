import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Member, Transaction, Voucher, LoyaltyConfig, TabType, StoreBranch } from './types';
import { initialStores, initialMembers, initialVouchers, initialTransactions, initialLoyaltyConfig } from './data/mockData';
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
import { QuickStoreSwitchModal } from './components/QuickStoreSwitchModal';
import { CreateVoucherModal } from './components/CreateVoucherModal';
import { CreateMemberModal } from './components/CreateMemberModal';
import { ManualPointAdjustmentModal } from './components/ManualPointAdjustmentModal';

// Roles Components
import { CashierPOSView } from './components/CashierPOSView';
import { CustomerMemberView } from './components/CustomerMemberView';
import { AdminLogin, MemberLogin } from './components/LoginWall';

export default function App() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [cashierName, setCashierName] = useState('Kasir Puri');
  const [cashierStoreName, setCashierStoreName] = useState<string>('Puri Jakarta');
  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(null);
  
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

  const [loading, setLoading] = useState(false);

  const [isQuickLauncherOpen, setIsQuickLauncherOpen] = useState(false);
  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [isPointAdjustOpen, setIsPointAdjustOpen] = useState(false);
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

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
                onRefreshData={() => window.location.reload()}
              />

              <div className="flex-1 overflow-y-auto p-4 md:p-8">
                {activeTab === 'overview' && (
                  <OverviewTab 
                    stores={stores}
                    members={members}
                    transactions={transactions}
                    vouchers={vouchers}
                    loyaltyConfig={loyaltyConfig}
                    onNavigateToStores={() => setActiveTab('stores')}
                    onNavigateToMembers={() => setActiveTab('members')}
                    onNavigateToVouchers={() => setActiveTab('vouchers')}
                    onOpenManualAdjust={() => setIsPointAdjustOpen(true)}
                    onSelectStore={() => {}}
                  />
                )}
                {activeTab === 'stores' && (
                  <StoresSettingsTab stores={stores} setStores={setStores} />
                )}
                {activeTab === 'members' && (
                  <MembersTab 
                    members={members}
                    transactions={transactions}
                    onOpenCreateMember={() => setIsCreateMemberOpen(true)}
                  />
                )}
                {activeTab === 'loyalty' && (
                  <LoyaltyRulesTab config={loyaltyConfig} setConfig={setLoyaltyConfig} />
                )}
                {activeTab === 'vouchers' && (
                  <VouchersTab 
                    vouchers={vouchers} 
                    stores={stores}
                    onCreateVoucher={() => setIsCreateVoucherOpen(true)}
                    onEditVoucher={(v) => setEditingVoucher(v)}
                    onToggleVoucherStatus={() => {}} // Stub
                  />
                )}
                {activeTab === 'audit' && (
                  <AuditTrailTab />
                )}
                {activeTab === 'campaigns' && (
                  <CampaignsTab />
                )}
                {activeTab === 'support' && (
                  <SupportTicketsTab />
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
              onClose={() => setIsCreateVoucherOpen(false)} 
              stores={stores}
              onCreateVoucher={async (newVoucher) => {
                let created: Voucher = {
                  ...newVoucher,
                  id: newVoucher.id || 'vch_' + Date.now(),
                  code: (newVoucher.code || 'VOUCH-' + Date.now()).toUpperCase(),
                  totalClaimed: Number(newVoucher.totalClaimed) || 0,
                  totalUsed: Number(newVoucher.totalUsed) || 0,
                  status: newVoucher.status || 'ACTIVE'
                } as Voucher;

                try {
                  const res = await fetch('/api/vouchers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newVoucher)
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
          </div>
        ) : (
          <AdminLogin onLogin={() => setAdminAuthenticated(true)} title="HO Superadmin Portal" subtitle="Master control room and ledger." showStoreQuickSelect={false} />
        )
      } />
      </Routes>
    </>
  );
}

