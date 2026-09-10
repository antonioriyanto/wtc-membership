import React, { useState } from 'react';
import { Member, Transaction, StoreBranch } from '../types';
import { CashierSidebar } from './CashierSidebar';
import { CashierHeader } from './CashierHeader';
import { CashierTab } from './CashierTab';
import { CashierMembersTab } from './CashierMembersTab';
import { CashierTransactionsTab } from './CashierTransactionsTab';
import { CashierSettingsTab } from './CashierSettingsTab';
import { CashierTabType } from '../types';
import { CreateMemberModal } from './CreateMemberModal';

interface CashierPOSViewProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  currentStore: StoreBranch;
  cashierName?: string;
  onSignOut?: () => void;
  onSwitchPerspective: (view: 'HO' | 'CASHIER' | 'MEMBER') => void;
}

export const CashierPOSView: React.FC<CashierPOSViewProps> = ({
  members, 
  setMembers, 
  transactions, 
  setTransactions, 
  currentStore, 
  cashierName = 'Kasir Puri',
  onSignOut,
  onSwitchPerspective
}) => {
  const [activeTab, setActiveTab] = useState<CashierTabType>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);

  // Filter transactions specifically for this cashier's store
  const storeTransactions = React.useMemo(() => {
    if (!currentStore) return transactions;
    const curName = (currentStore.name || '').toLowerCase().trim();
    const curCode = (currentStore.code || '').toLowerCase().trim();
    const curId = (currentStore.id || '').toLowerCase().trim();

    return transactions.filter(t => {
      const tName = (t.storeName || '').toLowerCase().trim();
      const tId = (t.storeId || '').toLowerCase().trim();

      if (tName && (tName === curName || curName.includes(tName) || tName.includes(curName))) {
        return true;
      }
      if (tId && (tId === curId || tId === curCode)) {
        return true;
      }
      return false;
    });
  }, [transactions, currentStore]);

  const handleAddPoints = async (memberId: string, amount: number, receiptNo: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;

    try {
      const res = await fetch('/api/transactions', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          receiptNo,
          memberId: member.id,
          storeId: currentStore?.id || currentStore?.code || 'PUR',
          storeName: currentStore?.name || 'Puri Jakarta',
          cashierName: cashierName || `Kasir ${currentStore?.name || 'Puri'}`,
          type: 'EARN',
          amount: amount
        }) 
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Status ${res.status}`);
      }

      const data = await res.json();
      const savedTrx = data.transaction;
      const updatedMember = data.member;

      setTransactions(prev => [savedTrx, ...prev]);
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
    } catch (e: any) {
      console.error("Error adding points:", e);
      alert("Transaction failed: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRedeemVoucher = async (memberId: string, voucherCode: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) return;

    try {
      const res = await fetch('/api/transactions', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({
          receiptNo: `VOUCHER-${voucherCode}`,
          memberId: member.id,
          storeId: currentStore?.id || currentStore?.code || 'PUR',
          storeName: currentStore?.name || 'Puri Jakarta',
          cashierName: cashierName || `Kasir ${currentStore?.name || 'Puri'}`,
          type: 'REDEEM',
          voucherCode: voucherCode,
          amount: 0,
          pointsDelta: -50
        }) 
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Status ${res.status}`);
      }

      const data = await res.json();
      const savedTrx = data.transaction;
      const updatedMember = data.member;

      setTransactions(prev => [savedTrx, ...prev]);
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      alert('Voucher redeemed successfully!');
    } catch (e: any) {
      console.error("Error redeeming voucher:", e);
      alert("Failed to redeem voucher: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* CASHIER SIDEBAR NAVIGATION */}
      <CashierSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchPerspective={onSwitchPerspective}
      />

      {/* MAIN CASHIER CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative">
        <CashierHeader
          cashierName={cashierName}
          storeName={currentStore?.name || 'Puri Jakarta'}
        />

        <div className="p-4 sm:p-6 lg:p-8 flex-1 max-w-7xl w-full mx-auto">
          {activeTab === 'cashier' && (
            <CashierTab 
              isSubmitting={isSubmitting}
              members={members}
              transactions={storeTransactions}
              currentStore={currentStore}
              onAddPoints={handleAddPoints}
              onRedeemVoucher={handleRedeemVoucher}
              onOpenCreateMember={() => setIsCreateMemberOpen(true)}
            />
          )}

          {activeTab === 'members' && (
            <CashierMembersTab
              members={members}
              setMembers={setMembers}
              currentStore={currentStore}
              onOpenCreateMember={() => setIsCreateMemberOpen(true)}
            />
          )}

          {activeTab === 'transactions' && (
            <CashierTransactionsTab 
              transactions={storeTransactions}
              currentStoreName={currentStore?.name || 'Puri Jakarta'}
            />
          )}

          {activeTab === 'settings' && (
            <CashierSettingsTab
              cashierName={cashierName}
              storeName={currentStore?.name || 'Puri Jakarta'}
              onSignOut={() => {
                if (onSignOut) {
                  onSignOut();
                } else {
                  window.location.reload();
                }
              }}
            />
          )}
        </div>
      </main>

      {/* CREATE MEMBER MODAL */}
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
    </div>
  );
};
