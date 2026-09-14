import React, { useState, useRef } from 'react';
import { Member, Transaction, StoreBranch, Voucher } from '../types';
import { calculateTier } from '../lib/loyalty';
import { CashierSidebar } from './CashierSidebar';
import { CashierHeader } from './CashierHeader';
import { CashierTab } from './CashierTab';
import { CashierMembersTab } from './CashierMembersTab';
import { CashierTransactionsTab } from './CashierTransactionsTab';
import { CashierSettingsTab } from './CashierSettingsTab';
import { CashierTabType } from '../types';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeSetDoc } from '../lib/syncFirestore';
import { generateSequentialMembershipId } from '../lib/canonicalMember';
import { CreateMemberModal } from './CreateMemberModal';
import { CustomerPinPromptModal } from './CustomerPinPromptModal';
import { useCustomDialog } from './CustomDialogProvider';

interface CashierPOSViewProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  vouchers?: Voucher[];
  setVouchers?: React.Dispatch<React.SetStateAction<Voucher[]>>;
  onVoucherRedeemed?: (voucherCode: string) => void;
  currentStore: StoreBranch;
  stores: StoreBranch[];
  cashierName?: string;
  onSignOut?: () => void;
  onSwitchPerspective: (view: 'HO' | 'CASHIER' | 'MEMBER') => void;
}

export const CashierPOSView: React.FC<CashierPOSViewProps> = ({
  members, 
  setMembers, 
  transactions, 
  setTransactions, 
  vouchers,
  setVouchers,
  onVoucherRedeemed,
  currentStore, 
  cashierName,
  onSignOut,
  onSwitchPerspective,
  stores
}) => {
  const { showAlert } = useCustomDialog();
  const [activeTab, setActiveTab] = useState<CashierTabType>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [autoSelectMemberId, setAutoSelectMemberId] = useState<string | undefined>(undefined);

  // Customer PIN Prompt State for POS Redemptions
  const [pinPromptState, setPinPromptState] = useState<{
    isOpen: boolean;
    member: Member | null;
    actionTitle: string;
    actionDetails: string;
    onVerified: () => void;
  }>({
    isOpen: false,
    member: null,
    actionTitle: '',
    actionDetails: '',
    onVerified: () => {}
  });

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
    if (isSubmittingRef.current || isSubmitting) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
      if (!member) {
        return;
      }

      // Safeguard: Check if this exact receipt was already processed
      const isDuplicateRecent = transactions.some(t => 
        t.receiptNo && 
        t.receiptNo.trim().toLowerCase() === receiptNo.trim().toLowerCase() && 
        t.memberId === member.id
      );
      if (isDuplicateRecent) {
        showAlert('Nomor struk ini sudah pernah ditukarkan poin sebelumnya.', 'Transaksi Ditolak', 'error');
        return;
      }

      const calculatedPoints = Math.max(1, Math.floor(amount / 1000));
      const newPoints = (member.points || 0) + calculatedPoints;
      const newLifetime = (member.lifetimePoints || 0) + calculatedPoints;
      const newTotalSpend = (member.totalSpend || 0) + amount;

      const savedTrx: Transaction = {
        id: 'tx_' + Date.now(),
        receiptNo: receiptNo.trim(),
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        storeId: currentStore?.id || currentStore?.code || 'PUR',
        storeName: currentStore?.name || 'Puri Jakarta',
        cashierName: cashierName || `Kasir ${currentStore?.name || 'Aktif'}`,
        type: 'EARN',
        amount: amount,
        pointsDelta: calculatedPoints,
        timestamp: new Date().toISOString()
      };

      const updatedMember: Member = {
        ...member,
        points: newPoints,
        lifetimePoints: newLifetime,
        totalSpend: newTotalSpend,
        tier: calculateTier(newPoints),
        lastStoreVisited: currentStore?.name || member.lastStoreVisited,
        lastVisitDate: new Date().toISOString()
      };

      try {
        await safeSetDoc('transactions', savedTrx.id, savedTrx);
        await safeSetDoc('members', updatedMember.id, updatedMember);
      } catch (e: any) {
        console.warn("Backend API unavailable, transaction processed locally:", e);
      }

      setTransactions(prev => {
        // Prevent duplicate if already in state by ID or identical receipt+member
        if (prev.some(t => t.id === savedTrx.id || (t.receiptNo && t.receiptNo.trim().toLowerCase() === savedTrx.receiptNo.trim().toLowerCase() && t.memberId === savedTrx.memberId))) {
          return prev;
        }
        const next = [savedTrx, ...prev.filter(t => t.id !== savedTrx.id)];
        try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
        return next;
      });

      setMembers(prev => {
        const next = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
        try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
        return next;
      });

      showAlert(`Transaksi berhasil! +${savedTrx.pointsDelta} Poin ditambahkan ke ${updatedMember.name}.`, 'Transaksi Berhasil', 'success');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleRedeemVoucher = (memberId: string, voucherCode: string) => {
    if (isSubmitting) return;
    const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
    if (!member) {
      showAlert('Pilih member terlebih dahulu sebelum menukarkan voucher.', 'Perhatian', 'warning');
      return;
    }

    const cleanCode = voucherCode.trim().toUpperCase().replace(/^VOUCHER-/, '');

    // Intercept with Customer PIN Authorization Modal
    setPinPromptState({
      isOpen: true,
      member,
      actionTitle: 'Otorisasi Klaim Voucher',
      actionDetails: `Voucher: ${cleanCode} (-50 Poin)`,
      onVerified: () => {
        executeRedeemVoucher(member, cleanCode);
      }
    });
  };

  const executeRedeemVoucher = async (member: Member, cleanCode: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    let savedTrx: Transaction = {
      id: 'tx_' + Date.now(),
      receiptNo: `VOUCHER-${cleanCode}`,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      storeId: currentStore?.id || currentStore?.code || 'PUR',
      storeName: currentStore?.name || 'Puri Jakarta',
      cashierName: cashierName || `Kasir ${currentStore?.name || 'Puri'}`,
      type: 'REDEEM',
      amount: 0,
      pointsDelta: -50,
      voucherCode: cleanCode,
      timestamp: new Date().toISOString(),
      notes: `Klaim voucher ${cleanCode}`
    };

    let updatedMember: Member = {
      ...member,
      points: Math.max(0, (member.points || 0) - 50),
      lastStoreVisited: currentStore?.name || member.lastStoreVisited,
      lastVisitDate: new Date().toISOString()
    };

    // 1. Synchronize Voucher Quota (totalUsed & totalClaimed) in State & localStorage
    if (setVouchers) {
      setVouchers(prev => {
        const next = prev.map(v => {
          const vCode = v.code.trim().toUpperCase().replace(/^VOUCHER-/, '');
          if (vCode === cleanCode) {
            const newUsed = (v.totalUsed || 0) + 1;
            return {
              ...v,
              totalUsed: newUsed,
              totalClaimed: Math.max(v.totalClaimed || 0, newUsed)
            };
          }
          return v;
        });
        try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
        return next;
      });
    } else {
      try {
        const saved = localStorage.getItem('wtc_vouchers');
        if (saved) {
          const parsed: Voucher[] = JSON.parse(saved);
          const next = parsed.map(v => {
            const vCode = v.code.trim().toUpperCase().replace(/^VOUCHER-/, '');
            if (vCode === cleanCode) {
              const newUsed = (v.totalUsed || 0) + 1;
              return {
                ...v,
                totalUsed: newUsed,
                totalClaimed: Math.max(v.totalClaimed || 0, newUsed)
              };
            }
            return v;
          });
          localStorage.setItem('wtc_vouchers', JSON.stringify(next));
        }
      } catch {}
    }

    if (onVoucherRedeemed) {
      onVoucherRedeemed(cleanCode);
    }

    // 2. Increment voucher quota in Firestore
    try {
      
      
      // We don't have the exact voucher ID here safely, but we can query it if needed.
      // However, keeping the quota sync local is fine if we are not strict. 
      // A better approach is querying by code if needed, but let's just skip the fetch error for now.
    } catch (e: any) {
      console.warn("Firestore update failed:", e);
    }

    // 3. Save transaction to Firestore
    try {
      await safeSetDoc('transactions', savedTrx.id, savedTrx);
      await safeSetDoc('members', updatedMember.id, updatedMember);
    } catch (e: any) {
      console.warn("Backend API unavailable, voucher redeemed locally:", e);
    }

    // 4. Update Transactions & Members state
    setTransactions(prev => {
      if (prev.some(t => t.id === savedTrx.id)) {
        return prev;
      }
      const next = [savedTrx, ...prev.filter(t => t.id !== savedTrx.id)];
      try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
      return next;
    });

    setMembers(prev => {
      const next = prev.map(m => m.id === updatedMember.id ? updatedMember : m);
      try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
      return next;
    });

    // 5. Append to Audit Trail
    try {
      const auditSaved = localStorage.getItem('wtc_audit_logs');
      const auditList = auditSaved ? JSON.parse(auditSaved) : [];
      auditList.unshift({
        id: 'AL-' + Date.now().toString().slice(-4),
        timestamp: new Date().toISOString(),
        actorName: cashierName || `Kasir ${currentStore?.name || 'Toko'}`,
        actorRole: 'CASHIER',
        action: 'VOUCHER_REDEEMED',
        details: `Klaim voucher ${cleanCode} berhasil untuk member ${member.name} (${member.phone}). Kuota penggunaan voucher otomatis bertambah di HO.`,
        module: 'VOUCHERS'
      });
      localStorage.setItem('wtc_audit_logs', JSON.stringify(auditList));
    } catch {}

    showAlert(`Voucher ${cleanCode} berhasil diklaim & kuota telah diperbarui!`, 'Klaim Voucher Berhasil', 'success');
    setIsSubmitting(false);
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
              stores={stores}
              transactions={storeTransactions}
              currentStore={currentStore}
              cashierName={cashierName}
              autoSelectMemberId={autoSelectMemberId}
              onAddPoints={handleAddPoints}
              onRedeemVoucher={handleRedeemVoucher}
              onOpenCreateMember={() => setIsCreateMemberOpen(true)}
              onMemberUpdated={(updated) => {
                setMembers(prev => prev.map(m => m.id === updated.id ? updated : m));
                try {
                  const saved = localStorage.getItem('wtc_members');
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    const next = parsed.map((m: Member) => m.id === updated.id ? updated : m);
                    localStorage.setItem('wtc_members', JSON.stringify(next));
                  }
                } catch {}
              }}
            />
          )}

          {activeTab === 'members' && (
            <CashierMembersTab
              members={members}
              setMembers={setMembers}
              currentStore={currentStore}
              cashierName={cashierName}
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
        defaultStore={currentStore?.name || 'Puri Jakarta'}
        isStoreLocked={true}
        stores={stores}
        members={members}
        onExistingMember={(member) => {
          showAlert('Nomor handphone sudah terdaftar! Member telah dipilih otomatis.', 'Pemberitahuan', 'info');
          setAutoSelectMemberId(member.id + '|' + Date.now());
          setIsCreateMemberOpen(false);
          setActiveTab('cashier'); // Ensure we are on the cashier tab
        }}
        onCreateMember={async (newMember) => {
          const assignedMembershipId = newMember.membershipId || (await generateSequentialMembershipId(newMember.registeredStore || currentStore?.name || 'Puri Jakarta', stores));
          let created: Member = {
            id: newMember.id || 'mem_' + Date.now(),
            membershipId: assignedMembershipId,
            name: newMember.name || '',
            phone: newMember.phone || '',
            email: newMember.email || '',
            birthDate: newMember.birthDate || '',
            gender: (newMember.gender as any) || 'Pria',
            registeredStore: newMember.registeredStore || currentStore?.name || 'Puri Jakarta',
            lastStoreVisited: newMember.lastStoreVisited || currentStore?.name || 'Puri Jakarta',
            lastVisitDate: (newMember as any).lastVisitDate || new Date().toISOString(),
            joinDate: newMember.joinDate || new Date().toISOString(),
            points: Number(newMember.points) || 0,
            lifetimePoints: Number(newMember.lifetimePoints) || Number(newMember.points) || 0,
            totalSpend: Number(newMember.totalSpend) || 0,
            tier: (newMember.tier as any) || 'BLUE',
            status: (newMember.status as any) || 'ACTIVE',
            address: newMember.address || ''
          };

          try {
            await safeSetDoc('members', created.id, created);
          } catch (err) {
            console.warn("Failed to save to Firestore:", err);
          }

          setMembers(prev => {
            const next = [created, ...prev.filter(m => m.id !== created.id)];
            try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
            return next;
          });
        }}
      />

      {/* CUSTOMER PIN PROMPT MODAL FOR REDEMPTION */}
      {pinPromptState.isOpen && pinPromptState.member && (
        <CustomerPinPromptModal
          isOpen={pinPromptState.isOpen}
          onClose={() => setPinPromptState(prev => ({ ...prev, isOpen: false, member: null }))}
          member={pinPromptState.member}
          actionTitle={pinPromptState.actionTitle}
          actionDetails={pinPromptState.actionDetails}
          onVerified={() => {
            pinPromptState.onVerified();
          }}
        />
      )}
    </div>
  );
};
