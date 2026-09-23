import React, { useState, useRef } from 'react';
import { Member, Transaction, StoreBranch, Voucher, LoyaltyConfig } from '../types';
import { calculateTier, calculateEarnedPoints, getLoyaltyConfig } from '../lib/loyalty';
import { CashierSidebar } from './CashierSidebar';
import { CashierSupportTicketsTab } from './CashierSupportTicketsTab';
import { CashierHeader } from './CashierHeader';
import { CashierTab } from './CashierTab';
import { CashierMembersTab } from './CashierMembersTab';
import { CashierTransactionsTab } from './CashierTransactionsTab';
import { CashierSettingsTab } from './CashierSettingsTab';
import { CashierTabType } from '../types';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { safeSetDoc, normalizePhoneNumber } from '../lib/syncFirestore';
import { generateSequentialMembershipId } from '../lib/canonicalMember';
import { CreateMemberModal } from './CreateMemberModal';
import { CustomerPinPromptModal } from './CustomerPinPromptModal';
import { useCustomDialog } from './CustomDialogProvider';
import { apiFetch } from '../lib/apiClient';

interface CashierTerminalViewProps {
  loyaltyConfig?: LoyaltyConfig;
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
  supportTickets?: any[];
  onSubmitTicket?: (ticket: any) => Promise<void>;
}

export const CashierTerminalView: React.FC<CashierTerminalViewProps> = ({
  loyaltyConfig,
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
  stores,
  supportTickets,
  onSubmitTicket
}) => {
  const { showAlert } = useCustomDialog();
  const [activeTab, setActiveTab] = useState<CashierTabType>('cashier');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const [isCreateMemberOpen, setIsCreateMemberOpen] = useState(false);
  const [autoSelectMemberId, setAutoSelectMemberId] = useState<string | undefined>(undefined);

  // Customer PIN Prompt State for Cashier Redemptions
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
        showAlert('Data member tidak ditemukan dalam sistem.', 'Member Tidak Ditemukan', 'error');
        return false;
      }

      const cleanReceipt = (receiptNo || '').trim();
      const numericAmount = Math.max(0, Number(amount) || 0);

      if (!cleanReceipt) {
        showAlert('Silakan masukkan nomor struk transaksi.', 'Nomor Struk Kosong', 'warning');
        return false;
      }

      if (numericAmount <= 0) {
        showAlert('Nilai transaksi belanja harus lebih besar dari Rp 0.', 'Nominal Tidak Valid', 'warning');
        return false;
      }

      // Safeguard: Check locally first (optimistic check)
      const isDuplicateRecent = transactions.some(t => 
        t.receiptNo && 
        (t.receiptNo || '').trim().toLowerCase() === cleanReceipt.toLowerCase()
      );
      if (isDuplicateRecent) {
        showAlert('Nomor struk ini sudah pernah ditukarkan poin sebelumnya.', 'Transaksi Ditolak', 'error');
        return false;
      }

      const effectiveConfig = loyaltyConfig || getLoyaltyConfig();
      const effectiveMemberId = member.id || member.membershipId || memberId;
      const effectiveMemberTier = member.tier || 'BLUE';

      // Prepare local deterministic calculation fallback
      const calculatedPointsFallback = calculateEarnedPoints(numericAmount, effectiveMemberTier, effectiveConfig);
      const newPointsFallback = (member.points || 0) + calculatedPointsFallback;
      const newTierFallback = calculateTier(newPointsFallback, effectiveConfig);

      let savedTrx: Transaction | null = null;
      let updatedMember: Member | null = null;

      // CALL SECURE SERVER-SIDE BACKEND API (FAIL-CLOSED)
      try {
        const result = await apiFetch('/api/loyalty/add-points', {
          method: 'POST',
          body: JSON.stringify({
            memberId: effectiveMemberId,
            membershipId: member.membershipId || '',
            memberName: member.name || 'Member',
            memberPhone: member.phone || '',
            amount: numericAmount.toString(),
            receiptNo: cleanReceipt,
            storeId: currentStore?.id || currentStore?.code || 'PUR',
            storeName: currentStore?.name || 'Puri Jakarta',
            cashierName: cashierName || `Kasir ${currentStore?.name || 'Aktif'}`
          })
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || 'Gagal menambahkan poin.');
        }

        savedTrx = result.data.transactionData;
        updatedMember = {
          ...member,
          points: result.data.newPoints,
          tier: result.data.newTier,
          totalSpend: (member.totalSpend || 0) + numericAmount,
          lifetimePoints: (member.lifetimePoints || 0) + (result.data.calculatedPoints || 0),
          lastStoreVisited: currentStore?.name || 'Puri Jakarta',
          lastVisitDate: new Date().toISOString()
        };
      } catch (err: any) {
        console.error('Add points error:', err);
        showAlert(err?.message || 'Gagal memproses transaksi poin pada server.', 'Transaksi Gagal', 'error');
        return false;
      }

      // PERSIST SAFELY TO FIRESTORE AND LOCAL CACHE
      try {
        await safeSetDoc('transactions', savedTrx.id, savedTrx);
        await safeSetDoc('members', updatedMember.id, updatedMember);

        // Audit Trail Entry
        const auditId = 'AL-' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
        const auditData = {
          id: auditId,
          timestamp: new Date().toISOString(),
          actorName: cashierName || 'Kasir',
          actorRole: 'STORE_CASHIER',
          action: 'POINTS_EARNED',
          details: `Kasir menambahkan +${savedTrx.pointsDelta} poin untuk ${updatedMember.name} (Struk: ${cleanReceipt})`,
          module: 'LOYALTY_PROGRAM'
        };
        await safeSetDoc('audit', auditId, auditData);
      } catch (storageErr) {
        console.warn('Firestore safeSetDoc warning:', storageErr);
      }

      // Update React state optimistically
      setTransactions(prev => {
        if (prev.some(t => t.id === savedTrx!.id)) return prev;
        const next = [savedTrx!, ...prev];
        try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
        return next;
      });

      setMembers(prev => {
        const next = prev.map(m => m.id === updatedMember!.id ? updatedMember! : m);
        try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
        return next;
      });

      showAlert(`Transaksi berhasil! +${savedTrx.pointsDelta} Poin ditambahkan ke ${updatedMember.name}.`, 'Transaksi Berhasil', 'success');

      if (loyaltyConfig?.enableWhatsAppNotifications && updatedMember.phone) {
        try {
          let phoneNum = updatedMember.phone.replace(/\D/g, '');
          if (phoneNum.startsWith('0')) {
            phoneNum = '62' + phoneNum.substring(1);
          }
          if (phoneNum.length >= 10) {
            const waText = `Halo ${updatedMember.name}, Terima kasih telah berbelanja di ${savedTrx.storeName}. Transaksi Anda (Struk: ${savedTrx.receiptNo}) senilai Rp ${savedTrx.amount.toLocaleString('id-ID')} telah berhasil. Anda mendapatkan +${savedTrx.pointsDelta} Poin! Total Poin Anda saat ini adalah ${updatedMember.points} Poin.`;
            const encodedText = encodeURIComponent(waText);
            window.open(`https://wa.me/${phoneNum}?text=${encodedText}`, '_blank');
          }
        } catch (waErr) {
          console.warn("WhatsApp notification popup blocked or unsupported:", waErr);
        }
      }
      return true;
    } catch (unexpectedErr: any) {
      console.error("Unexpected points handler error:", unexpectedErr);
      showAlert(unexpectedErr?.message || 'Terjadi kesalahan sistem saat memproses poin.', 'Error', 'error');
      return false;
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
    
    // Auto-execute redemption without PIN authorization
    executeRedeemVoucher(member, cleanCode);
  };

  const executeRedeemVoucher = async (member: Member, cleanCode: string) => {
    if (isSubmitting) return;
    
    // Atomic Single-Use Voucher Lock check
    if (loyaltyConfig?.enableStrictVoucherSingleUse && vouchers) {
       const targetVoucher = vouchers.find(v => v.code.trim().toUpperCase().replace(/^VOUCHER-/, '') === cleanCode);
       if (targetVoucher) {
         if ((targetVoucher.totalUsed || 0) >= (targetVoucher.maxUsageLimit || 1)) {
            showAlert('Peringatan Keamanan: Voucher ini sudah diklaim maksimal atau terkunci (Atomic Lock).', 'Gagal', 'error');
            return;
         }
       } else {
         // If voucher not found in the active list, we might want to block it, but we'll let it pass or show error.
         // Wait, it might be a general code without a specific record.
       }
    }

    setIsSubmitting(true);

    let savedTrx: Transaction = {
      id: 'tx_' + Date.now(),
      receiptNo: `VOUCHER-${cleanCode}`,
      memberId: member.id,
      membershipId: member.membershipId || '',
      memberName: member.name,
      memberPhone: member.phone,
      memberPhoneNormalized: normalizePhoneNumber(member.phone || ''),
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
      if (vouchers) {
        const targetVoucher = vouchers.find(v => v.code.trim().toUpperCase().replace(/^VOUCHER-/, '') === cleanCode);
        if (targetVoucher) {
          const voucherRef = doc(db, 'vouchers', targetVoucher.id);
          await updateDoc(voucherRef, {
            totalUsed: increment(1),
            totalClaimed: increment(1)
          });
        }
      }
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
        
      />

      {/* MAIN CASHIER CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto bg-slate-50 dark:bg-slate-900 transition-colors duration-200 relative">
        <CashierHeader
          cashierName={cashierName}
          storeName={currentStore?.name || 'Puri Jakarta'}
        />

        <div className="p-4 md:p-6 lg:p-8 flex-1 w-full max-w-full lg:max-w-[1440px] xl:max-w-[1560px] ml-0 mr-auto transition-all">
          {activeTab === 'cashier' && (
            <CashierTab 
              loyaltyConfig={loyaltyConfig}
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

          {activeTab === 'tickets' && (
            <CashierSupportTicketsTab
              currentStore={currentStore}
              cashierName={cashierName}
              supportTickets={supportTickets}
              onSubmitTicket={async (ticket) => {
                if (onSubmitTicket) {
                  await onSubmitTicket(ticket);
                } else {
                  console.warn('onSubmitTicket not provided from App.tsx');
                }
              }}
            />
          )}
          
          {activeTab === 'settings' && (
            <CashierSettingsTab
              cashierName={cashierName}
              storeName={currentStore?.name || 'Puri Jakarta'}
              currentStore={currentStore}
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
          setAutoSelectMemberId(created.id + '|' + Date.now());
          setActiveTab('cashier');
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
