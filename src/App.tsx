import { doc, getDoc, query, where, setDoc, deleteDoc, serverTimestamp, writeBatch, collection, getDocs } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from './lib/firebase';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Member, MemberTier, Transaction, Voucher, LoyaltyConfig, TabType, StoreBranch, SupportTicket, Campaign, AuditLog } from './types';
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
import { setupFirestoreListeners, seedFirestoreIfEmpty, safeSetDoc, cleanForFirestore, findMemberByPhoneInFirestore, findMemberByGoogleUidInFirestore, normalizePhoneNumber, isSamePhoneNumber, cleanAndEnrichStore } from './lib/syncFirestore';
import { startSyncWorker, runMemberSyncPass, recordDeletedMemberId } from './lib/sync-worker';
import { apiFetch } from './lib/apiClient';

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
import { MemberPreviewModal } from './components/MemberPreviewModal';
import { ManualPointAdjustmentModal } from './components/ManualPointAdjustmentModal';

// Roles Components
import { CashierTerminalView } from './components/CashierTerminalView';
import { CustomerMemberView } from './components/CustomerMemberView';
import { AdminLogin, MemberLogin } from './components/LoginWall';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { PortalSwitcher } from './components/PortalSwitcher';
import { calculateTier } from './lib/loyalty';
import { generateSequentialMembershipId } from './lib/canonicalMember';
import { StoreTransactionsModal } from './components/StoreTransactionsModal';
import { NationalActivityNotifications } from './components/NationalActivityNotifications';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useCustomDialog();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    const p = location.pathname.toLowerCase();
    if (p.startsWith('/admin') || p.startsWith('/ho')) {
      document.title = "Watch Club - HO Management Portal (Restricted)";
    } else if (p.startsWith('/cashier') || p.startsWith('/pos') || p.startsWith('/kasir')) {
      document.title = "Watch Club - Terminal Kasir";
    } else {
      document.title = "Watch Club - Loyalty Member Portal";
    }
  }, [location.pathname]);
  
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

  const [cashierName, setCashierName] = useState(() => {
    try { return localStorage.getItem('wtc_cashier_name') || 'Kasir Aktif'; } catch {}
    return 'Kasir Aktif';
  });
  const [cashierStoreName, setCashierStoreName] = useState<string>(() => {
    try { return localStorage.getItem('wtc_cashier_store') || 'Puri Jakarta'; } catch {}
    return 'Puri Jakarta';
  });
  
  const [loggedInMemberId, setLoggedInMemberId] = useState<string | null>(() => {
    try {
      return localStorage.getItem('wtc_logged_in_member') || null;
    } catch {}
    return null;
  });

  // State preview pengalih peran sistem - HANYA aktif jika ada sesi admin HO yang membuka preview
  const [isRolePreviewActive, setIsRolePreviewActive] = useState(() => {
    try {
      const isAdmin = localStorage.getItem('wtc_admin_auth') === 'true';
      if (!isAdmin) return false;
      return sessionStorage.getItem('wtc_ho_role_preview') === 'true' || localStorage.getItem('wtc_ho_role_preview') === 'true';
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      if (adminAuthenticated && isRolePreviewActive) {
        sessionStorage.setItem('wtc_ho_role_preview', 'true');
        localStorage.setItem('wtc_ho_role_preview', 'true');
      } else {
        sessionStorage.removeItem('wtc_ho_role_preview');
        localStorage.removeItem('wtc_ho_role_preview');
      }
    } catch {}
  }, [adminAuthenticated, isRolePreviewActive]);

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          const storeMap = new Map<string, StoreBranch>();
          initialStores.forEach(s => storeMap.set(s.id, cleanAndEnrichStore(s)));
          parsed.forEach((s: any) => {
            const enriched = cleanAndEnrichStore(s);
            storeMap.set(enriched.id, enriched);
          });
          return Array.from(storeMap.values()).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        }
      }
    } catch {}
    return initialStores.map(cleanAndEnrichStore);
  });

  const [members, setMembers] = useState<Member[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_members');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((m: any) => {
            if (m.tier === 'DIAMOND' || m.tier === 'BLACK') {
              return { ...m, tier: 'PLATINUM' as MemberTier };
            }
            return m as Member;
          });
        }
      }
    } catch {}
    return initialMembers;
  });

  const [vouchers, setVouchers] = useState<Voucher[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_vouchers');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return initialVouchers;
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('wtc_transactions');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seen = new Set<string>();
          const seenReceipts = new Set<string>();
          const deduped = parsed
            .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
            .filter((t: any) => {
              if (!t || !t.id || seen.has(t.id)) return false;
              
              if (t.receiptNo && t.type === 'EARN') {
                const rKey = `${t.receiptNo.trim().toUpperCase()}_${t.memberId}`;
                if (seenReceipts.has(rKey)) return false;
                seenReceipts.add(rKey);
              }
              
              seen.add(t.id);
              return true;
            });
          return deduped;
        }
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
        if (parsed && typeof parsed === 'object') {
          const { diamondThreshold, blackThreshold, diamondMultiplier, blackMultiplier, ...clean } = parsed;
          const effectiveAmountUnit = (!clean.amountUnit || clean.amountUnit === 1000) ? 10000 : clean.amountUnit;
          const effectiveGoldMultiplier = (!clean.goldMultiplier || clean.goldMultiplier === 1.5) ? 1.25 : clean.goldMultiplier;
          const effectivePlatinumMultiplier = (!clean.platinumMultiplier || clean.platinumMultiplier === 2.0) ? 1.75 : clean.platinumMultiplier;
          return { 
            ...initialLoyaltyConfig, 
            ...clean,
            amountUnit: Number(effectiveAmountUnit) || 10000,
            pointsPerAmount: Number(clean.pointsPerAmount) || 1,
            goldMultiplier: Number(effectiveGoldMultiplier) || 1.25,
            platinumMultiplier: Number(effectivePlatinumMultiplier) || 1.75,
          };
        }
      }
    } catch {}
    return initialLoyaltyConfig;
  });

  const handleSaveLoyaltyConfig = async (newConfig: LoyaltyConfig) => {
    setLoyaltyConfig(newConfig);
    try {
      localStorage.setItem('wtc_loyalty_config', JSON.stringify(newConfig));
      window.dispatchEvent(new CustomEvent('wtc_loyalty_config_updated', { detail: newConfig }));
    } catch {}

    try {
      await safeSetDoc('config', 'loyalty', newConfig);
    } catch (err) {
      console.warn("Could not save loyalty config to Firestore:", err);
    }

    const logId = 'al-cfg-' + Date.now();
    const newLog: AuditLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      actorName: 'Head Office Admin',
      actorRole: 'HO_ADMIN',
      performedBy: 'Head Office Admin',
      action: 'UPDATE_LOYALTY_RULES',
      details: `Aturan loyalitas disinkronkan ke seluruh kasir: Rp ${(newConfig.amountUnit || 10000).toLocaleString('id-ID')} = ${newConfig.pointsPerAmount || 1} Pt, Gold: ${newConfig.goldMultiplier}x, Platinum: ${newConfig.platinumMultiplier}x`,
      module: 'LOYALTY',
      ipAddress: '10.12.4.99'
    };
    setAuditLogs(prev => [newLog, ...prev]);
    safeSetDoc('audit', logId, newLog).catch(() => {});
  };

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
  const [globalPreviewMember, setGlobalPreviewMember] = useState<Member | null>(null);
  const [isPointAdjustOpen, setIsPointAdjustOpen] = useState(false);
  const [isAdjustingPoints, setIsAdjustingPoints] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [isStoreTransactionsModalOpen, setIsStoreTransactionsModalOpen] = useState(false);
  const [selectedStoreForTrx, setSelectedStoreForTrx] = useState<StoreBranch | null>(null);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);
  const [googlePhoneInput, setGooglePhoneInput] = useState('');

  // Navigate directly to dedicated National Transactions tab (No popup!)
  const handleOpenStoreTransactions = (store: StoreBranch | null) => {
    setSelectedStoreForTrx(store);
    setActiveTab('transactions');
  };

  // Support Ticket Handlers
  
  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'campaigns', id));
      // Local state will be updated via real-time sync, but we update it optimistically:
      setCampaigns(prev => {
        const next = prev.filter(c => c.id !== id);
        try { localStorage.setItem('wtc_campaigns', JSON.stringify(next)); } catch {}
        return next;
      });
    } catch(err) {
      console.error('Failed to delete campaign:', err);
    }
  };
  
  const handleUpdateTicket = async (updated: SupportTicket) => {
    try {
      await setDoc(doc(db, 'support', updated.id), updated);
    } catch(err) {}
  };

  const handleCashierSubmitTicket = async (ticketData: any) => {
    const ticketId = 'TCK-' + Date.now().toString().slice(-6);
    const created: any = {
      id: ticketId,
      ...ticketData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [{
        id: 'msg_' + Date.now(),
        sender: 'CASHIER',
        text: ticketData.messageText,
        timestamp: new Date().toISOString()
      }]
    };
    
    // Remove transient field used just for creation
    delete created.messageText;

    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: cashierName,
      actorRole: 'STORE_CASHIER',
      action: 'TICKET_CREATED',
      details: `Kasir ${cashierName} membuat tiket bantuan baru: "${ticketData.subject}".`,
      module: 'SUPPORT_TICKETS'
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'support', ticketId), created);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
      
      setSupportTickets(prev => [created, ...prev]);
      setAuditLogs(prev => [auditEntry, ...prev]);
    } catch (err) {
      console.warn("Direct writeBatch notice, applying resilient save:", err);
      try {
        await safeSetDoc('support', ticketId, created);
        await safeSetDoc('audit', auditEntry.id, auditEntry);
      } catch {}
      setSupportTickets(prev => [created, ...prev]);
      setAuditLogs(prev => [auditEntry, ...prev]);
    }
  };

  const handleMemberSubmitTicket = async (ticketData: any) => {
    if (!loggedInMemberId) return;
    const member = members.find(m => m.id === loggedInMemberId);
    if (!member) return;

    const ticketId = 'TCK-' + Date.now().toString().slice(-6);
    const created: any = {
      id: ticketId,
      memberId: member.id,
      memberName: member.name,
      memberPhone: member.phone,
      ...ticketData,
      status: 'OPEN',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString(),
      messages: [{
        id: 'msg_' + Date.now(),
        sender: 'MEMBER',
        content: ticketData.messageText,
        timestamp: new Date().toISOString(),
        attachmentUrl: ticketData.fileUrl
      }]
    };

    const auditEntry: any = {
      id: 'AL-' + Date.now().toString().slice(-4),
      timestamp: new Date().toISOString(),
      actorName: member.name,
      actorRole: 'CUSTOMER',
      action: 'TICKET_CREATED',
      details: `Pelanggan mengirimkan tiket bantuan baru: "${ticketData.subject}".`,
      module: 'SUPPORT_TICKETS'
    };

    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'support', ticketId), created);
      batch.set(doc(db, 'audit', auditEntry.id), auditEntry);
      await batch.commit();
    } catch (err) {
      console.warn("Firestore error saving ticket, updating local state:", err);
      try {
        await safeSetDoc('support', ticketId, created);
        await safeSetDoc('audit', auditEntry.id, auditEntry);
      } catch {}
    }
    // Update local state and localStorage so the user immediately sees their ticket
    setSupportTickets(prev => [created, ...prev]);
    setAuditLogs(prev => [auditEntry, ...prev]);
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
    } catch (err) {
      console.warn("Firestore error saving campaign:", err);
      try {
        await safeSetDoc('campaigns', campaign.id, campaign);
        await safeSetDoc('audit', auditEntry.id, auditEntry);
      } catch {}
    }
    setCampaigns(prev => [campaign, ...prev]);
    setAuditLogs(prev => [auditEntry, ...prev]);
  };

  const handleToggleCampaignStatus = async (id: string) => {
    const target = campaigns.find(c => c.id === id);
    if (!target) return false;
    const newStatus = target.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    try {
      await setDoc(doc(db, 'campaigns', id), { ...target, status: newStatus });
    } catch (err) {
      console.warn("Firestore error toggling campaign status:", err);
    }
  };

  const handleDirectPointAdjustment = async (memberId: string, pointsDelta: number, note: string, ticketId: string) => {
    let success = false;
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    const updatedMember = { ...target, points: Math.max(0, target.points + pointsDelta) };
    
    const savedTrx: Transaction = {
      id: 'TRX-' + Date.now().toString().slice(-6),
      receiptNo: 'ADJ-' + ticketId,
      memberId: target.id,
      membershipId: target.membershipId || '',
      memberName: target.name || 'Member',
      memberPhone: target.phone || '',
      memberPhoneNormalized: normalizePhoneNumber(target.phone || ''),
      storeId: 'SYS',
      storeName: 'Sistem HO',
      cashierName: 'Admin HO',
      type: 'MANUAL_ADJUSTMENT',
      amount: 0,
      pointsDelta: pointsDelta,
      timestamp: new Date().toISOString(),
      notes: `${ticketId}: ${note}`
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
      success = true;
    } catch(err) {
      console.warn("Direct point adjustment batch notice, applying fallback:", err);
      try {
        await safeSetDoc('members', updatedMember.id, updatedMember);
        await safeSetDoc('transactions', savedTrx.id, savedTrx);
        await safeSetDoc('audit', auditEntry.id, auditEntry);
        success = true;
      } catch {}
    }
    return success;
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
      // 0. Record deleted member in tombstone storage to prevent sync-worker resurrection
      recordDeletedMemberId(memberId);

      // 1. Delete Member Document from Firestore
      await deleteDoc(doc(db, 'members', memberId));
      
      // 2. Delete All Associated Transactions
      const q = query(collection(db, 'transactions'), where('memberId', '==', memberId));
      const querySnapshot = await getDocs(q);
      
      const deletePromises = [];
      querySnapshot.forEach((docSnap) => {
        deletePromises.push(deleteDoc(docSnap.ref));
      });
      
      await Promise.all(deletePromises);
      showAlert('Akun member dan seluruh data terkait telah dihapus secara permanen dari sistem.', 'Penghapusan Berhasil', 'success');

      // Audit Log 
      const auditSaved = localStorage.getItem('wtc_audit_logs');
      const auditList = auditSaved ? JSON.parse(auditSaved) : [];
      const newLog = {
        id: 'AL-' + Date.now().toString().slice(-4),
        timestamp: new Date().toISOString(),
        actorName: 'HO Admin',
        actorRole: 'ADMIN',
        action: 'MEMBER_DELETED',
        details: `Menghapus member (${memberId}) beserta seluruh riwayat poin dan ${querySnapshot.size} transaksi terkait secara permanen.`,
        module: 'MEMBERS'
      };
      localStorage.setItem('wtc_audit_logs', JSON.stringify([newLog, ...auditList]));

      // Fallback local state update in case listener is slow
      setMembers(prev => {
        const next = prev.filter(m => m.id !== memberId);
        try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
        return next;
      });
      setTransactions(prev => {
        const next = prev.filter(t => t.memberId !== memberId);
        try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
        return next;
      });

    } catch (err) {
      console.warn("Could not fully sync member delete to Firestore:", err);
      // Fallback if completely offline
      setMembers(prev => {
        const next = prev.filter(m => m.id !== memberId);
        try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
        return next;
      });
      setTransactions(prev => {
        const next = prev.filter(t => t.memberId !== memberId);
        try { localStorage.setItem('wtc_transactions', JSON.stringify(next)); } catch {}
        return next;
      });
    }
  };

  const handleToggleSuspendMember = async (memberId: string) => {
    const target = members.find(m => m.id === memberId);
    if (!target) return;
    const newStatus = target.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const updatedMember = { ...target, status: newStatus as 'ACTIVE' | 'SUSPENDED' };
    handleUpdateMember(updatedMember);
  };

  const handleReverseTransaction = async (originalTrx: Transaction, reason: string) => {
    // Call server-authoritative HO endpoint
    const response = await apiFetch('/v1/ho/transactions/reversal', {
      method: 'POST',
      body: JSON.stringify({
        originalTransactionId: originalTrx.id,
        reason: reason.trim()
      })
    });

    if (!response.success || !response.reversal) {
      throw new Error(response.error || 'Gagal memproses reversal transaksi.');
    }

    const reversalTrx: Transaction = response.reversal;
    setTransactions(prev => [reversalTrx, ...prev]);

    // Refresh member points locally
    setMembers(prev => prev.map(m => {
      if (m.id === originalTrx.memberId) {
        const newPoints = Math.max(0, (m.points || 0) + reversalTrx.pointsDelta);
        return { ...m, points: newPoints };
      }
      return m;
    }));
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

  // Background 30-second Sync Worker: audits & resolves data discrepancies between Cashier & Customer apps
  const membersRef = useRef(members);
  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    const stopWorker = startSyncWorker({
      getMembers: () => membersRef.current,
      setMembers: (reconciledMembers) => {
        setMembers(reconciledMembers);
      },
      intervalMs: 30000,
      immediate: true,
      onInitialReconciled: (report) => {
        console.info("[SyncWorker] Initial state reconciled with Firestore upon mount:", report);
      },
      onSyncComplete: (report) => {
        if (report.discrepanciesCount > 0) {
          console.info("[SyncWorker] Discrepancies reconciled:", report);
        }
      }
    });

    return () => {
      stopWorker();
    };
  }, []);

  const handleRefreshData = async () => {
    setIsRefreshingData(true);
    try {
      await runMemberSyncPass(
        membersRef.current,
        (reconciled) => setMembers(reconciled),
        () => membersRef.current
      );
    } catch (err) {
      console.warn("Manual sync error:", err);
    } finally {
      setTimeout(() => {
        setIsRefreshingData(false);
      }, 600);
    }
  };

  // Pengalih Peran Sistem (Switch System Role)
  // Portal ini HANYA menyala jika ada sesi admin HO yang mengklik preview pengalih peran system.
  // Jika tidak ada login HO pada web cashier dan web pwa tidak akan bisa muncul dan berfungsi.
  const handleSwitchPerspective = (role: 'HO' | 'CASHIER' | 'MEMBER') => {
    // Pengalih peran hanya diizinkan untuk sesi Admin HO yang aktif
    if (!adminAuthenticated) {
      console.warn("Fitur Pengalih Peran Sistem hanya dapat diakses melalui sesi Admin HO yang terautentikasi.");
      return;
    }

    // Aktifkan sesi preview pengalih peran
    setIsRolePreviewActive(true);

    if (role === 'HO') {
      navigate('/admin');
    } else if (role === 'CASHIER') {
      // Kasir toko dibuat default: 23 Semarang (23 Semarang Shopping Center / 23SMG)
      const semarangStore = stores.find(s => 
        (s.code && s.code.toUpperCase() === '23SMG') ||
        (s.id && s.id.toUpperCase() === '23SMG') ||
        (s.name && s.name.toLowerCase().includes('23 semarang'))
      );

      const targetStoreName = semarangStore ? semarangStore.name : '23 Semarang Shopping Center';
      setCashierStoreName(targetStoreName);
      setCashierName('Kasir 23 Semarang');
      setCashierAuthenticated(true);
      try {
        localStorage.setItem('wtc_cashier_store', targetStoreName);
        localStorage.setItem('wtc_cashier_name', 'Kasir 23 Semarang');
        localStorage.setItem('wtc_cashier_auth', 'true');
      } catch {}

      navigate('/cashier');
    } else if (role === 'MEMBER') {
      // Customer dibuat default nomor telepon dengan akun user 081903987051 (Aan)
      const targetMember = members.find(m => 
        m.phone && (
          m.phone.replace(/\D/g, '').endsWith('81903987051') || 
          m.phone.includes('081903987051')
        )
      ) || members.find(m => m.id === 'mem_kokas_0001') || members[0];

      if (targetMember) {
        setLoggedInMemberId(targetMember.id);
        try {
          localStorage.setItem('wtc_logged_in_member', targetMember.id);
        } catch {}
      }

      navigate('/member');
    }
  };

  const handleExitRolePreview = () => {
    setIsRolePreviewActive(false);
    try {
      sessionStorage.removeItem('wtc_ho_role_preview');
      localStorage.removeItem('wtc_ho_role_preview');
    } catch {}
    navigate('/admin');
  };

  // Portal floating switcher HANYA menyala jika ada sesi admin HO yang mengklik preview pengalih peran system
  const SHOW_PORTAL_SWITCHER = adminAuthenticated && isRolePreviewActive;

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-50"><p className="text-slate-500 animate-pulse">Connecting to Database...</p></div>;
  }

  return (
    <>
      <Routes>
        <Route path="/cashier" element={
        cashierAuthenticated ? (
          <CashierTerminalView 
            loyaltyConfig={loyaltyConfig}
            members={members} 
            setMembers={setMembers}
            transactions={transactions} 
            setTransactions={setTransactions}
            vouchers={vouchers}
            setVouchers={setVouchers}
            supportTickets={supportTickets}
            
            onSubmitTicket={handleCashierSubmitTicket}
            stores={stores}
            currentStore={
              (() => {
                const search = (cashierStoreName || '').toUpperCase().trim();
                if (!search) return stores[0] || initialStores[0];
                
                // 1. Strict match by code, id, or username (Bulletproof)
                let matched = stores.find(s => 
                  (s.code || '').toUpperCase().trim() === search ||
                  (s.id || '').toUpperCase().trim() === search ||
                  (s.username && s.username.toUpperCase().trim() === search)
                );
                
                // 2. Fallback to exact name match just in case it's a legacy saved value
                if (!matched) {
                  const searchLower = search.toLowerCase();
                  matched = stores.find(s => (s.name || '').toLowerCase().trim() === searchLower);
                }
                
                // 3. Last resort fuzzy match
                if (!matched) {
                  const searchLower = search.toLowerCase();
                  matched = stores.find(s => {
                    const sName = (s.name || '').toLowerCase();
                    return (sName && sName.includes(searchLower)) || (sName && searchLower.includes(sName));
                  });
                }
                
                return matched || stores[0] || initialStores[0];
              })()
            }
            cashierName={cashierName}
            onSignOut={() => {
              const auth = getAuth();
              signOut(auth).then(() => {
                setCashierAuthenticated(false);
                try { 
                  localStorage.removeItem('wtc_cashier_auth'); 
                  localStorage.removeItem('wtc_cashier_name'); 
                  localStorage.removeItem('wtc_cashier_store'); 
                } catch {}
                navigate('/cashier');
              });
            }}
            onSwitchPerspective={handleSwitchPerspective}
          />
        ) : (
          <AdminLogin
            onLoginSuccess={(role, storeIdentifier) => {
              let finalStoreName = storeIdentifier;
              
              // Find the exact matching store based on the username that just logged in
              const matchingStore = stores.find(s => 
                (s.username && storeIdentifier && s.username.toUpperCase() === storeIdentifier.toUpperCase()) || 
                (s.code && storeIdentifier && s.code.toUpperCase() === storeIdentifier.toUpperCase()) ||
                (s.id && storeIdentifier && s.id.toUpperCase() === storeIdentifier.toUpperCase())
              );
              
              if (matchingStore) {
                 finalStoreName = matchingStore.name;
              }
            
              if (storeIdentifier) {
                const displayUser = (finalStoreName && storeIdentifier.toUpperCase() !== 'ADMIN' && storeIdentifier.toUpperCase() !== 'HO') ? finalStoreName : storeIdentifier;
                setCashierName(displayUser);
                try { localStorage.setItem('wtc_cashier_name', displayUser); } catch {}
              }
              
              // Store the robust ID/Code instead of the easily changeable name
              if(storeIdentifier) { setCashierStoreName(storeIdentifier); }
              try { localStorage.setItem('wtc_cashier_store', storeIdentifier || ''); } catch {}
              
              setCashierAuthenticated(true);
              try { localStorage.setItem('wtc_cashier_auth', 'true'); } catch {}
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
            member={members.find(m => m.id === loggedInMemberId) || { id: loggedInMemberId, name: 'Member', phone: '', membershipId: 'WTC-000000', points: 0, tier: 'SILVER', joinDate: new Date().toISOString(), registeredStore: 'Puri Jakarta', lastStoreVisited: 'Puri Jakarta', lastVisitDate: new Date().toISOString(), email: '', lifetimePoints: 0, totalSpend: 0, gender: 'Wanita', status: 'ACTIVE' }}
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
            onUpdateMember={(updated) => {
              setMembers(prev => {
                const exists = prev.some(m => m.id === updated.id);
                const next = exists ? prev.map(m => m.id === updated.id ? { ...m, ...updated } : m) : [updated, ...prev];
                try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
                return next;
              });
            }}
          />
        ) : (
          <MemberLogin 
            members={members}
            onLogin={(id, memberObj) => {
              if (memberObj) {
                setMembers(prev => {
                  const exists = prev.some(m => m.id === memberObj.id);
                  const next = exists ? prev.map(m => m.id === memberObj.id ? memberObj : m) : [memberObj, ...prev];
                  try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
                  return next;
                });
              }
              setLoggedInMemberId(id);
            }} 
            onRegisterGoogle={async (phoneNum: string) => {
              try {
                const result = await signInWithPopup(auth, googleProvider);
                const user = result.user;
                
                // 1. Check if this Google UID is already linked to any member document in Firestore
                const linkedMemberByUid = await findMemberByGoogleUidInFirestore(user.uid);
                if (linkedMemberByUid) {
                  setMembers(prev => {
                    const exists = prev.some(m => m.id === linkedMemberByUid.id);
                    const next = exists ? prev.map(m => m.id === linkedMemberByUid.id ? linkedMemberByUid : m) : [linkedMemberByUid, ...prev];
                    try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
                    return next;
                  });
                  setLoggedInMemberId(linkedMemberByUid.id);
                  return;
                }

                let targetPhone = (phoneNum || user.phoneNumber || '').trim();

                // 2. Validate phone number presence
                if (!targetPhone) {
                  const input = window.prompt("Lengkapi Profil Member:\n\nMasukkan nomor WhatsApp / Handphone Anda untuk menghubungkan data dan poin:");
                  targetPhone = (input || '').trim();
                }

                if (!targetPhone) {
                  showAlert('Pendaftaran dibatalkan. Nomor handphone wajib diisi untuk mengamankan data dan poin Anda.', 'Perhatian', 'warning');
                  return;
                }

                const normalizedTarget = normalizePhoneNumber(targetPhone);
                if (normalizedTarget.length < 8) {
                  showAlert('Nomor handphone tidak valid (minimal 8 digit angka).', 'Peringatan', 'warning');
                  return;
                }

                // 3. STRICT UNIQUE PHONE NUMBER CHECK USING FIRESTORE QUERIES
                // Verify whether ANY member document in Firestore already possesses this phone number
                const existingMemberByPhone = await findMemberByPhoneInFirestore(normalizedTarget);

                if (existingMemberByPhone) {
                  // MERGE / LINK: Member already registered (e.g., at physical store by Cashier)
                  // Link Google UID to the existing member document, preserving the member ID, points, and history!
                  const googleEmail = (user.email || '').trim().toLowerCase();
                  const existingEmail = (existingMemberByPhone.email || '').trim();
                  const resolvedEmail = existingEmail ? existingEmail : googleEmail;
                  const nowIso = new Date().toISOString();

                  const existingLinkedUids = Array.isArray(existingMemberByPhone.linkedAuthUids) ? existingMemberByPhone.linkedAuthUids : [];
                  const updatedLinkedUids = Array.from(new Set([...existingLinkedUids, user.uid]));

                  const updatedMemberData = cleanForFirestore({
                    ...existingMemberByPhone,
                    googleUid: user.uid,
                    linkedGoogleEmail: googleEmail,
                    linkedAt: nowIso,
                    recoveryEmail: existingMemberByPhone.recoveryEmail || googleEmail,
                    email: resolvedEmail,
                    linkedAuthUids: updatedLinkedUids,
                    name: existingMemberByPhone.name || user.displayName || 'Member',
                    phone: normalizePhoneNumber(existingMemberByPhone.phone || targetPhone),
                    googleMergedAt: nowIso,
                    updatedAt: nowIso
                  });

                  await safeSetDoc('members', existingMemberByPhone.id, updatedMemberData);

                  // Clean up duplicate document if one exists under user.uid
                  if (user.uid !== existingMemberByPhone.id) {
                    try {
                      await deleteDoc(doc(db, 'members', user.uid));
                    } catch (delErr) {
                      console.warn("Could not delete duplicate member doc:", delErr);
                    }
                  }

                  setMembers(prev => {
                    const filtered = prev.filter(m => m.id !== existingMemberByPhone.id && m.id !== user.uid);
                    const next = [updatedMemberData, ...filtered];
                    try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
                    return next;
                  });

                  setLoggedInMemberId(existingMemberByPhone.id);
                  showAlert(
                    `Selamat datang kembali, ${updatedMemberData.name}! Akun Google Anda telah terhubung ke member ${updatedMemberData.membershipId} dengan saldo ${Number(updatedMemberData.points || 0).toLocaleString()} poin.`,
                    'Akun Terhubung',
                    'success'
                  );
                  return;
                }

                // 4. TRULY BRAND NEW MEMBER
                // Neither this Google UID nor this phone number exist in Firestore
                const membershipId = await generateSequentialMembershipId('Online', stores);

                const newMember: Member = {
                  id: user.uid,
                  googleUid: user.uid,
                  membershipId: membershipId,
                  name: user.displayName || 'Google Member',
                  phone: normalizedTarget,
                  email: user.email || '',
                  joinDate: new Date().toISOString().split('T')[0],
                  points: 0,
                  lifetimePoints: 0,
                  totalSpend: 0,
                  tier: 'BLUE',
                  status: 'ACTIVE',
                  registeredStore: 'Online',
                  lastStoreVisited: 'Online',
                  createdAt: new Date().toISOString()
                } as any;

                await safeSetDoc('members', user.uid, newMember);

                setMembers(prev => {
                  const next = [newMember, ...prev.filter(m => m.id !== user.uid)];
                  try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
                  return next;
                });

                setLoggedInMemberId(user.uid);
                showAlert('Pendaftaran member online berhasil! Selamat bergabung di Watch Club Loyalty.', 'Berhasil', 'success');
              } catch (e: any) {
                console.error("Google Sign-In Error", e);
                if (e.code !== 'auth/popup-closed-by-user') {
                  showAlert('Gagal login dengan Google: ' + (e.message || 'Terjadi kesalahan.'), 'Login Gagal', 'error');
                }
              }
            }}
          />
        )
      } />
      
      <Route path="/admin" element={
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
                setIsRolePreviewActive(false);
                try { 
                  localStorage.removeItem('wtc_admin_auth'); 
                  localStorage.removeItem('wtc_ho_role_preview');
                  sessionStorage.removeItem('wtc_ho_role_preview');
                } catch {}
                navigate('/admin');
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
                members={members}
                transactions={transactions}
                stores={stores}
                vouchers={vouchers}
                campaigns={campaigns}
                supportTickets={supportTickets}
                auditLogs={auditLogs}
                loyaltyConfig={loyaltyConfig}
                onSelectMember={(m) => setGlobalPreviewMember(m)}
                onSelectTransaction={(t) => {
                  const m = members.find(mem => mem.id === t.memberId);
                  if (m) setGlobalPreviewMember(m);
                }}
                onSelectTab={(tab) => setActiveTab(tab as any)}
              />

              <div id="main-scroll-area" className="flex-1 overflow-y-auto p-4 md:p-8">
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
                  <LoyaltyRulesTab 
                    config={loyaltyConfig} 
                    setConfig={setLoyaltyConfig} 
                    onSaveConfig={handleSaveLoyaltyConfig}
                    isSkeletonLoading={isRefreshingData} 
                  />
                )}
                {activeTab === 'vouchers' && (
                  <VouchersTab 
                    vouchers={vouchers} 
                    transactions={transactions}
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
                      setVouchers(prev => {
                        const next = prev.map(v => v.id === voucherId ? updated : v);
                        try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
                        return next;
                      });
                      try {
                        await safeSetDoc('vouchers', voucherId, updated);
                      } catch (err) {
                        console.warn('API error updating voucher status:', err);
                      }
                    }}
                    onDeleteVoucher={async (voucherId) => {
                      setVouchers(prev => {
                        const next = prev.filter(v => v.id !== voucherId);
                        try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
                        return next;
                      });
                      try {
                        await deleteDoc(doc(db, 'vouchers', voucherId));
                      } catch (err) {}
                      try {
                        await fetch(`/api/vouchers/${encodeURIComponent(voucherId)}`, { method: 'DELETE' });
                      } catch (err) {}
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
                    onReverseTransaction={handleReverseTransaction}
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

            <MemberPreviewModal
              isOpen={!!globalPreviewMember}
              onClose={() => setGlobalPreviewMember(null)}
              member={globalPreviewMember}
              transactions={transactions}
              onOpenEdit={(m) => {
                setGlobalPreviewMember(null);
              }}
              onToggleSuspend={handleToggleSuspendMember}
              onDelete={(id) => {
                handleDeleteMember(id);
                setGlobalPreviewMember(null);
              }}
            />
            <QuickStoreSwitchModal 
              isOpen={isQuickLauncherOpen} 
              onClose={() => setIsQuickLauncherOpen(false)} 
              onSwitchView={handleSwitchPerspective} 
              currentView="HO" 
            />

            <CreateMemberModal
              isOpen={isCreateMemberOpen}
              onClose={() => setIsCreateMemberOpen(false)}
              defaultStore={cashierStoreName || 'Puri Jakarta'}
              isStoreLocked={false}
              members={members}
              onCreateMember={async (newMember) => {
                const assignedMembershipId = newMember.membershipId || (await generateSequentialMembershipId(newMember.registeredStore || 'Puri Jakarta', stores));
                let created: Member = {
                  id: newMember.id || 'mem_' + Date.now(),
                  membershipId: assignedMembershipId,
                  name: newMember.name || '',
                  phone: newMember.phone || '',
                  email: newMember.email || '',
                  birthDate: newMember.birthDate || '',
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
                  address: newMember.address || ''
                };

                try {
                  await safeSetDoc('members', created.id, created);
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
                  const updated: Voucher = {
                    ...editingVoucher,
                    ...voucherData,
                  };

                  setVouchers(prev => {
                    const next = prev.map(v => v.id === updated.id ? updated : v);
                    try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
                    return next;
                  });

                  try {
                    await safeSetDoc('vouchers', updated.id, updated);
                  } catch (err) {
                    console.warn('Error saving updated voucher:', err);
                  }
                  setEditingVoucher(null);
                  setIsCreateVoucherOpen(false);
                } else {
                  const created: Voucher = {
                    ...voucherData,
                    id: (voucherData as any).id || 'vch_' + Date.now(),
                    code: (voucherData.code || 'VOUCH-' + Date.now()).toUpperCase().trim(),
                    totalClaimed: Number((voucherData as any).totalClaimed) || 0,
                    totalUsed: Number((voucherData as any).totalUsed) || 0,
                    status: voucherData.status || 'ACTIVE'
                  } as Voucher;

                  setVouchers(prev => {
                    const next = [created, ...prev.filter(v => v.id !== created.id)];
                    try { localStorage.setItem('wtc_vouchers', JSON.stringify(next)); } catch {}
                    return next;
                  });

                  try {
                    await safeSetDoc('vouchers', created.id, created);
                  } catch (err) {
                    console.warn('Error creating voucher:', err);
                  }
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
                  membershipId: member.membershipId || '',
                  memberName: member.name,
                  memberPhone: member.phone,
                  memberPhoneNormalized: normalizePhoneNumber(member.phone || ''),
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
          <AdminLogin
            onLoginSuccess={() => setAdminAuthenticated(true)} 
            title="Portal Manajemen HO" 
            subtitle="Akses Terbatas. Masukkan kredensial otorisasi Kantor Pusat (HO)." 
            showStoreQuickSelect={false} 
          />
        )
      } />

      {/* Redirect aliases for Head Office */}
      <Route path="/ho" element={<Navigate to="/admin" replace />} />

      {/* Redirect aliases for Store Cashier */}
      <Route path="/pos" element={<Navigate to="/cashier" replace />} />
      <Route path="/kasir" element={<Navigate to="/cashier" replace />} />

      {/* Redirect aliases for Member Portal */}
      <Route path="/members" element={<Navigate to="/member" replace />} />
      <Route path="/loyalty" element={<Navigate to="/member" replace />} />
      <Route path="/rewards" element={<Navigate to="/member" replace />} />
      <Route path="/points" element={<Navigate to="/member" replace />} />
      <Route path="/point" element={<Navigate to="/member" replace />} />
      <Route path="/card" element={<Navigate to="/member" replace />} />
      <Route path="/kartu" element={<Navigate to="/member" replace />} />

      {/* Root URL point.watchclub.co.id always safely defaults to Member Portal (Customers & Android PWA) */}
      <Route path="/" element={<Navigate to="/member" replace />} />

      {/* Catch-all for any typos or unmatched URLs: NEVER lands on Admin, ALWAYS safe to Member Portal */}
      <Route path="*" element={<Navigate to="/member" replace />} />
      </Routes>

      {/* FLOATING PORTAL SWITCHER: Hanya menyala jika sesi Admin HO mengklik preview pengalih peran sistem */}
      {SHOW_PORTAL_SWITCHER && (
        <PortalSwitcher 
          onSwitch={handleSwitchPerspective} 
          onExitPreview={handleExitRolePreview}
        />
      )}
    </>
  );
}

