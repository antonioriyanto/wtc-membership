import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Member, Transaction, Voucher, LoyaltyConfig, TabType, StoreBranch } from './types';
import { initialStores, initialLoyaltyConfig } from './data/mockData';

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
  
  const [stores, setStores] = useState<StoreBranch[]>(initialStores);
  const [members, setMembers] = useState<Member[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>(initialLoyaltyConfig);
  const [loading, setLoading] = useState(true);

  const [isQuickLauncherOpen, setIsQuickLauncherOpen] = useState(false);
  const [isCreateVoucherOpen, setIsCreateVoucherOpen] = useState(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [isPointAdjustOpen, setIsPointAdjustOpen] = useState(false);
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [storesRes, memRes, vouchRes, trxRes, confRes] = await Promise.all([
          fetch('/api/stores'),
          fetch('/api/members'),
          fetch('/api/vouchers'),
          fetch('/api/transactions'),
          fetch('/api/config')
        ]);
        if (storesRes.ok) {
          const dbStores = await storesRes.json();
          if (Array.isArray(dbStores) && dbStores.length > 0) setStores(dbStores);
        }
        if (memRes.ok) {
          const dbMembers = await memRes.json();
          if (Array.isArray(dbMembers)) setMembers(dbMembers);
        }
        if (vouchRes.ok) {
          const dbVouchers = await vouchRes.json();
          if (Array.isArray(dbVouchers)) setVouchers(dbVouchers);
        }
        if (trxRes.ok) {
          const dbTrx = await trxRes.json();
          if (Array.isArray(dbTrx)) setTransactions(dbTrx);
        }
        if (confRes.ok) {
          const dbConf = await confRes.json();
          if (dbConf && !dbConf.error) setLoyaltyConfig(dbConf);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 5000);
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
                try {
                  const res = await fetch('/api/members', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMember)
                  });
                  const created = await res.json();
                  if (res.ok && created && created.id) {
                    setMembers(prev => [created, ...prev.filter(m => m.id !== created.id)]);
                  } else {
                    throw new Error(created?.error || 'Failed to create member');
                  }
                } catch (err) {
                  console.error("Failed to create member", err);
                  throw err;
                }
              }}
            />
            
            <CreateVoucherModal 
              isOpen={isCreateVoucherOpen} 
              onClose={() => setIsCreateVoucherOpen(false)} 
              stores={stores}
              onCreateVoucher={async (newVoucher) => {
                try {
                  const res = await fetch('/api/vouchers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newVoucher)
                  });
                  const created = await res.json();
                  if (res.ok) {
                    setVouchers([created, ...vouchers]);
                  } else {
                    console.error(created.error);
                  }
                } catch (err) {
                  console.error("Failed to create voucher", err);
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
                if (!member) return;

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

                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || `Status ${res.status}`);
                  }

                  const data = await res.json();
                  const savedTrx = data.transaction;
                  const updatedMember = data.member;

                  setTransactions(prev => [savedTrx, ...prev]);
                  setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                  alert('Point adjustment applied successfully.');
                } catch (e: any) {
                  console.error("Error adjusting points:", e);
                  alert("Failed to adjust points: " + e.message);
                } finally {
                  setIsAdjustingPoints(false);
                }
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

