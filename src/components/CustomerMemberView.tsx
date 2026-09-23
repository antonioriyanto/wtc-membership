import { initialStores } from "../data/mockData";
import { cleanAndEnrichStore, safeSetDoc } from "../lib/syncFirestore";
import { StoreCard } from "./StoreCard";
import { MembershipCard } from "./MembershipCard";
import { TierBenefitsList } from "./TierBenefitsList";
import { VoucherTermsModal } from "./VoucherTermsModal";
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Member, Voucher, StoreBranch, Transaction, Campaign, SupportTicket } from '../types';
import { useCustomDialog } from './CustomDialogProvider';
import { useMemberLiveProfile } from '../hooks/useMemberLiveProfile';
import { 
  CreditCard, 
  Award, 
  MapPin, 
  User, 
  ArrowLeft, 
  ChevronRight,
  Sun,
  Moon, 
  X, 
  Percent,
  Wrench,
  Gift,
  ArrowUp,
  Ticket,
  Search,
  MessageCircle,
  Camera,
  LogOut,
  Building,
  HelpCircle,
  Megaphone,
  Sparkles,
  Check,
  Copy,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Navigation,
  Compass,
  Phone,
  ExternalLink,
  FileText,
  Receipt,
  History
} from 'lucide-react';
import { PwaInstallPrompt } from './PwaInstallPrompt';
import { WatchClubLogo } from './WatchClubLogo';
import { doc, updateDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { normalizePhoneNumber } from '../lib/syncFirestore';
import { linkGoogleAccountClient } from '../lib/memberAuthClient';
import { uploadImageToStorage } from '../lib/imageStorage';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';


interface CustomerMemberViewProps {
  member: Member;
  vouchers: Voucher[];
  stores: StoreBranch[];
  transactions?: Transaction[];
  campaigns?: Campaign[];
  tickets?: SupportTicket[];
  onSubmitTicket?: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'> & { messageText: string }) => void;
  onUpdateMember?: (updated: Member) => void;
  onBackToHO: () => void;
}

export const CustomerMemberView: React.FC<CustomerMemberViewProps> = ({
  member: initialMember,
  vouchers,
  stores,
  transactions,
  campaigns,
  tickets,
  onSubmitTicket,
  onUpdateMember,
  onBackToHO,
}) => {
  const { showAlert } = useCustomDialog();
  // Live single-document reactive stream (<500ms latency directly from Firestore)
  const { profile: liveProfile, error: liveError } = useMemberLiveProfile(initialMember?.id || null);
  const member = liveProfile || initialMember;

  // React to deleted or missing member profile
  useEffect(() => {
    if (liveError === 'Profile document not found') {
      try {
        localStorage.removeItem('wtc_logged_in_member');
      } catch {}
      showAlert('Akun member ini tidak ditemukan atau telah dihapus oleh Admin HO.', 'Sesi Berakhir', 'info');
      onBackToHO();
    }
  }, [liveError, onBackToHO, showAlert]);

  if (!member) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Data Member Tidak Ditemukan</h2>
        <p className="text-slate-400 text-sm mb-6">Silakan masuk kembali atau pilih member yang aktif.</p>
        <button 
          onClick={onBackToHO}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const memberTier = (member.tier || 'SILVER').toUpperCase();

  const [activeTab, setActiveTab] = useState<'MEMBERSHIP' | 'REWARDS' | 'STORES' | 'PROFILE'>('MEMBERSHIP');

  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored === 'dark' || document.documentElement.classList.contains('dark');
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);
  
  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };
  const [tabHistory, setTabHistory] = useState<('MEMBERSHIP' | 'REWARDS' | 'STORES' | 'PROFILE')[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const redeemedVoucherCodes = new Set(
    transactions
      .filter(t => t.memberId === member.id && (t.type === 'REDEEM' || t.type === 'VOUCHER_DISCOUNT') && t.voucherCode)
      .map(t => t.voucherCode?.trim().toUpperCase().replace(/^VOUCHER-/, ''))
  );

  const activeCustomerVouchers = vouchers.filter(v => 
    v.status === 'ACTIVE' && 
    (v.totalClaimed || 0) < (v.maxUsageLimit || Infinity) &&
    !redeemedVoucherCodes.has(v.code.trim().toUpperCase().replace(/^VOUCHER-/, ''))
  );
  const [selectedVoucherForQr, setSelectedVoucherForQr] = useState<Voucher | null>(null);
  const [selectedVoucherForTerms, setSelectedVoucherForTerms] = useState<Voucher | null>(null);
  const [storeSearch, setStoreSearch] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileEmail, setProfileEmail] = useState(
    member?.email || member?.linkedGoogleEmail || member?.recoveryEmail || ''
  );
  const [profileAddress, setProfileAddress] = useState(member?.address || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);

  useEffect(() => {
    const effectiveEmail = member?.email || member?.linkedGoogleEmail || member?.recoveryEmail || '';
    setProfileEmail(effectiveEmail);
    if (member?.address !== undefined) setProfileAddress(member.address || '');
  }, [member?.email, member?.linkedGoogleEmail, member?.recoveryEmail, member?.address]);

  const handleLinkGoogle = async () => {
    if (!member?.id) return;
    setIsLinkingGoogle(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // Verified server-side check
      const res = await fetch('/api/members/link-google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          googleUid: user.uid,
          googleEmail: user.email || '',
          idToken
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Gagal memverifikasi akun Google.');
      }

      // Atomic client update with validation
      const updated = await linkGoogleAccountClient({
        memberId: member.id,
        googleUid: user.uid,
        googleEmail: user.email || ''
      });

      if (onUpdateMember) {
        onUpdateMember(updated as any);
      }
      showAlert(`Akun Google (${user.email}) berhasil diverifikasi dan ditautkan ke profil Anda!`, 'Berhasil Ditautkan', 'success');
    } catch (err: any) {
      console.error('Link Google error:', err);
      showAlert(err?.message || 'Gagal menghubungkan akun Google.', 'Gagal', 'error');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      // 1. Upload to Firebase Storage with magic-byte validation and 5MB limit
      const uploaded = await uploadImageToStorage(file, 'members');
      const storageUrl = uploaded.url;

      const updatedMemberData: Member = {
        ...member,
        avatarUrl: storageUrl,
        updatedAt: new Date().toISOString()
      };

      // 2. Update Firestore
      await safeSetDoc('members', member.id, updatedMemberData);

      // 3. Persist to Express backend
      fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: storageUrl })
      }).catch(err => console.warn('[Avatar] Server sync notice:', err));

      // 4. Notify parent app state
      if (onUpdateMember) {
        onUpdateMember(updatedMemberData);
      }

      showAlert('Foto profil berhasil diubah dan disimpan!', 'Foto Diperbarui', 'success');
    } catch (err: any) {
      console.error('Avatar upload error:', err);
      showAlert(err?.message || 'Gagal memperbarui foto profil. Periksa format dan ukuran file.', 'Gagal Mengunggah', 'error');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member?.id) return;

    const cleanEmail = profileEmail.trim();
    const cleanAddress = profileAddress.trim();

    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      showAlert('Format alamat email tidak valid.', 'Format Tidak Sesuai', 'warning');
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError(null);
    setProfileSaveSuccess(false);

    try {
      const nowIso = new Date().toISOString();
      const updatedMemberData: Member = {
        ...member,
        email: cleanEmail,
        // Preserve linkedGoogleEmail: never delete or overwrite
        linkedGoogleEmail: member.linkedGoogleEmail,
        address: cleanAddress,
        updatedAt: nowIso
      };

      // 1. Update Firestore
      await safeSetDoc('members', member.id, updatedMemberData);

      // 2. Update Server API
      fetch(`/api/members/${member.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, address: cleanAddress })
      }).catch(err => console.warn('[Profile] Server PUT sync notice:', err));

      // 3. Notify parent app state
      if (onUpdateMember) {
        onUpdateMember(updatedMemberData);
      }

      // 4. Update localStorage
      try {
        const raw = localStorage.getItem('wtc_members');
        if (raw) {
          const list = JSON.parse(raw);
          const next = list.map((m: any) => m.id === member.id ? { ...m, ...updatedMemberData } : m);
          localStorage.setItem('wtc_members', JSON.stringify(next));
        }
      } catch {}

      setProfileSaveSuccess(true);
      showAlert('Alamat email dan profil berhasil disimpan!', 'Berhasil Disimpan', 'success');
      setTimeout(() => setProfileSaveSuccess(false), 4000);
    } catch (err: any) {
      console.error('Failed to save profile changes:', err);
      const errMsg = err?.message || 'Gagal menyimpan perubahan. Periksa koneksi internet.';
      setProfileSaveError(errMsg);
      showAlert('Gagal menyimpan profil: ' + errMsg, 'Gagal Menyimpan', 'error');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const tierBackgroundStyle = member.tier === 'BLUE' ? {
    background: 'linear-gradient(135deg, #4375A6 0%, #30466E 25%, #222649 50%, #17182C 75%, #101010 100%)'
  } : member.tier === 'SILVER' ? {
    background: 'linear-gradient(135deg, #F8F4F3 0%, #A3A3A3 25%, #FCFCFC 50%, #909090 75%, #F4F0F1 100%)'
  } : member.tier === 'GOLD' ? {
    background: 'linear-gradient(135deg, #EEC944 0%, #FAE56F 25%, #DDAF1D 50%, #FFFA8A 75%, #B96F15 100%)'
  } : {
    // PLATINUM (Top Tier)
    background: 'linear-gradient(135deg, #ECF1F7 0%, #A7B8CA 25%, #E2E7ED 50%, #A7B8CA 75%, #F8F7FC 100%)'
  };

  const tierTextColorClass = member.tier === 'BLUE' ? 'text-white' : member.tier === 'GOLD' ? 'text-amber-950 font-bold' : 'text-neutral-900 dark:text-white';


  // Support tickets & campaigns state
  const [activeCampaignModal, setActiveCampaignModal] = useState<Campaign | null>(null);
  const [hasShownCampaignOnLoad, setHasShownCampaignOnLoad] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalTab, setSupportModalTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [copiedVoucher, setCopiedVoucher] = useState(false);

  // Form states for submitting new ticket
  const [ticketCategory, setTicketCategory] = useState<SupportTicket['category']>('MISSING_POINTS');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketStore, setTicketStore] = useState(stores[0]?.name || 'Puri Jakarta');
  const [ticketReceipt, setTicketReceipt] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccessNotice, setTicketSuccessNotice] = useState<string | null>(null);

  const handleTabChange = (newTab: 'MEMBERSHIP' | 'REWARDS' | 'STORES' | 'PROFILE') => {
    if (newTab !== activeTab) {
      setTabHistory(prev => [...prev, activeTab]);
      setActiveTab(newTab);
    }
  };

  const handleHeaderBack = () => {
    // 1. Tutup modal / popup jika sedang terbuka
    if (selectedVoucherForQr) {
      setSelectedVoucherForQr(null);
      return;
    }
    if (isQrModalOpen) {
      setIsQrModalOpen(false);
      return;
    }
    if (isHistoryModalOpen) {
      setIsHistoryModalOpen(false);
      return;
    }
    if (activeCampaignModal) {
      setActiveCampaignModal(null);
      return;
    }
    if (isSupportModalOpen) {
      setIsSupportModalOpen(false);
      return;
    }

    // 2. Kembali ke tab sebelumnya dari riwayat navigasi
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory(prev => prev.slice(0, -1));
      setActiveTab(prevTab);
      return;
    }

    // 3. Jika sedang di tab selain MEMBERSHIP, kembali ke tab utama MEMBERSHIP
    if (activeTab !== 'MEMBERSHIP') {
      setActiveTab('MEMBERSHIP');
      return;
    }

    // 4. Jika sudah di Beranda (MEMBERSHIP), jangan sign out - gunakan browser history bila ada
    if (window.history.length > 1) {
      window.history.back();
    }
  };

  const canGoBack = activeTab !== 'MEMBERSHIP' || tabHistory.length > 0 || isQrModalOpen || isHistoryModalOpen || !!selectedVoucherForQr || !!activeCampaignModal || isSupportModalOpen;

  // Push-pop campaign detection
  const activePromoCampaigns = useMemo(() => {
    if (!campaigns || campaigns.length === 0) return [];
    return campaigns.filter(c => 
      c.status === 'ACTIVE' && 
      (c.targetAudience === 'ALL' || c.targetAudience === member.tier) &&
      (!c.endAt || new Date(c.endAt).getTime() >= Date.now()) // Double check expiration
    );
  }, [campaigns, member.tier]);

  const popupCampaign = useMemo(() => {
    return activePromoCampaigns.find(c => c.showAsPopupOnApp) || null;
  }, [activePromoCampaigns]);

  useEffect(() => {
    if (!hasShownCampaignOnLoad && popupCampaign) {
      setActiveCampaignModal(popupCampaign);
      setHasShownCampaignOnLoad(true);
    }
  }, [popupCampaign, hasShownCampaignOnLoad]);

  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    if (activePromoCampaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(s => (s + 1) % activePromoCampaigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activePromoCampaigns]);

  const myTickets = useMemo(() => {
    if (!tickets) return [];
    return tickets.filter(t => t.memberId === member.id || t.memberPhone === member.phone);
  }, [tickets, member]);

  const hasUnresolvedTicket = useMemo(() => {
    return myTickets.some(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  }, [myTickets]);

  const handleCreateTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasUnresolvedTicket) {
      showAlert('Anda masih memiliki tiket kendala yang sedang berlangsung (Open / In Progress). Harap tunggu hingga tiket sebelumnya diselesaikan (Resolved) oleh Tim Support HO sebelum mengajukan tiket baru.', 'Tiket Aktif Ditemukan', 'warning');
      return;
    }
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;

    if (onSubmitTicket) {
      onSubmitTicket({
        source: 'MEMBER',
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        storeName: ticketStore,
        receiptNo: ticketReceipt.trim() || '',
        subject: ticketSubject.trim(),
        category: ticketCategory,
        status: 'OPEN',
        priority: 'HIGH',
        messageText: ticketMessage.trim()
      });
    }

    setTicketSuccessNotice('Tiket Anda berhasil dikirim ke Tim Support HO. Kami akan segera meninjau kendala Anda!');
    setTicketSubject('');
    setTicketReceipt('');
    setTicketMessage('');
    setTimeout(() => {
      setSupportModalTab('HISTORY');
    }, 1200);
  };

  let nextTierPoints = 5000;
  const currentPoints = Number(member?.points || 0);
  if (currentPoints >= 30000 || member?.tier === 'PLATINUM') nextTierPoints = 30000; // maxed out (top tier)
  else if (currentPoints >= 10000 || member?.tier === 'GOLD') nextTierPoints = 30000;
  else if (currentPoints >= 5000 || member?.tier === 'SILVER') nextTierPoints = 10000;

  const progressPercent = (member?.tier === 'PLATINUM' || currentPoints >= 30000)
    ? 100 
    : Math.min(100, Math.max(0, (currentPoints / nextTierPoints) * 100));

  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geolocationError, setGeolocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<string>('ALL');

  const requestUserLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeolocationError('Perangkat Anda tidak mendukung fitur Geolocation GPS.');
      return;
    }
    setIsLocating(true);
    setGeolocationError(null);

    const onSuccess = (position: GeolocationPosition) => {
      setUserLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setGeolocationError(null);
      setIsLocating(false);
    };

    const onError = (error: GeolocationPositionError) => {
      console.warn('High accuracy geolocation failed, trying standard accuracy...', error);
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (fallbackError) => {
          console.warn('Geolocation completely unavailable:', fallbackError);
          setIsLocating(false);
          let errorMsg = 'Izin lokasi belum aktif. Aktifkan GPS atau gunakan pencarian nama mall / filter wilayah.';
          if (fallbackError.code === fallbackError.PERMISSION_DENIED) {
            errorMsg = 'Akses lokasi ditolak di browser. Aktifkan izin lokasi di pengaturan browser untuk mengurutkan cabang terdekat.';
          } else if (fallbackError.code === fallbackError.TIMEOUT) {
            errorMsg = 'Pencarian sinyal GPS memakan waktu terlalu lama. Gunakan pencarian manual atau filter wilayah di bawah.';
          }
          setGeolocationError(errorMsg);
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
      );
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (activeTab === 'STORES' && !userLocation && !geolocationError) {
      requestUserLocation();
    }
  }, [activeTab]);

  const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; 
  };

  const filteredStores = useMemo(() => {
    let result = stores.map(cleanAndEnrichStore);

    const q = storeSearch.trim().toLowerCase();
    if (q) {
      result = result.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.mallName && s.mallName.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.floorUnit && s.floorUnit.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q))
      );
    } else {
      // By default in Customer PWA, show retail boutiques (exclude HO)
      result = result.filter(s => s.id !== 'HO' && s.type !== 'HO');
    }

    // Apply Region Filter chip
    if (selectedRegionFilter !== 'ALL') {
      result = result.filter(s => {
        const reg = (s.region || '').toLowerCase();
        const city = (s.city || '').toLowerCase();
        const name = (s.name || '').toLowerCase();
        const addr = (s.address || '').toLowerCase();
        
        if (selectedRegionFilter === 'JAKARTA') {
          return reg.includes('jakarta') || city.includes('jakarta') || addr.includes('jakarta') || name.includes('jakarta') || name.includes('puri') || name.includes('kokas');
        }
        if (selectedRegionFilter === 'BOGOR_DEPOK_BEKASI') {
          return city.includes('bogor') || city.includes('depok') || city.includes('bekasi') || city.includes('tangerang') || reg.includes('jabodetabek');
        }
        if (selectedRegionFilter === 'JAWA_BARAT') {
          return reg.includes('jawa barat') || city.includes('bandung') || city.includes('cirebon') || city.includes('karawang');
        }
        if (selectedRegionFilter === 'JAWA_TENGAH_DIY') {
          return reg.includes('jawa tengah') || reg.includes('diy') || city.includes('semarang') || city.includes('solo') || city.includes('yogyakarta');
        }
        if (selectedRegionFilter === 'JAWA_TIMUR') {
          return reg.includes('jawa timur') || city.includes('surabaya') || city.includes('malang') || city.includes('sidoarjo') || city.includes('jember');
        }
        if (selectedRegionFilter === 'LUAR_JAWA') {
          return reg.includes('bali') || reg.includes('kalimantan') || reg.includes('sulawesi') || reg.includes('sumatera') || reg.includes('papua');
        }
        return true;
      });
    }

    if (userLocation) {
      result = result.map(s => {
        if (typeof s.latitude === 'number' && !isNaN(s.latitude) && typeof s.longitude === 'number' && !isNaN(s.longitude)) {
          return {
            ...s,
            distance: getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, s.latitude, s.longitude)
          };
        }
        return s;
      });
      result.sort((a, b) => {
        if (typeof a.distance === 'number' && typeof b.distance === 'number') return a.distance - b.distance;
        if (typeof a.distance === 'number') return -1;
        if (typeof b.distance === 'number') return 1;
        return 0;
      });
    }
    return result;
  }, [stores, storeSearch, selectedRegionFilter, userLocation]);

  // Canonical identifiers
  const canonicalMemberId = member?.id || '';
  const canonicalMemberPhone = normalizePhoneNumber(member?.phone || '');

  // Direct Firestore transactions listener (never rely on stale localStorage)
  const [firestoreTransactions, setFirestoreTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState<boolean>(true);

  useEffect(() => {
    if (!canonicalMemberId && !canonicalMemberPhone) {
      setIsLoadingTransactions(false);
      return;
    }

    setIsLoadingTransactions(true);

    // Also pre-fetch from verified server endpoint
    fetch(`/api/members/${encodeURIComponent(canonicalMemberId)}/transactions`)
      .then(res => res.json())
      .then(data => {
        if (data?.success && Array.isArray(data.transactions)) {
          setFirestoreTransactions(prev => prev.length > 0 ? prev : data.transactions);
        }
      })
      .catch(() => {});

    try {
      const q = query(
        collection(db, 'transactions'),
        where('memberId', '==', canonicalMemberId),
        orderBy('timestamp', 'desc')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        const liveList: Transaction[] = [];
        snapshot.forEach((docSnap) => {
          liveList.push({ id: docSnap.id, ...(docSnap.data() as any) });
        });
        setFirestoreTransactions(liveList);
        setIsLoadingTransactions(false);
      }, async (err) => {
        console.warn("Direct member transactions snapshot notice:", err);
        // Fallback to verified server endpoint
        try {
          const res = await fetch(`/api/members/${encodeURIComponent(canonicalMemberId)}/transactions`);
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data.transactions)) {
              setFirestoreTransactions(data.transactions);
            }
          }
        } catch (fetchErr) {
          console.warn("Backend transactions fetch fallback notice:", fetchErr);
        } finally {
          setIsLoadingTransactions(false);
        }
      });

      return () => unsub();
    } catch {
      setIsLoadingTransactions(false);
    }
  }, [canonicalMemberId, canonicalMemberPhone]);

  // Strict transaction filtering according to requirement 3:
  // a. transaction.memberId === canonicalMemberId
  // b. transaction.memberPhoneNormalized === canonicalMemberPhone
  // Fallback to memberName is STRICTLY REMOVED
  // Newest first sorting
  const memberTransactions = useMemo(() => {
    const sourceList = firestoreTransactions.length > 0 
      ? firestoreTransactions 
      : (transactions || []);

    if (!canonicalMemberId && !canonicalMemberPhone) return [];

    return sourceList
      .filter(t => {
        if (!t) return false;
        // a. transaction.memberId === canonicalMemberId
        if (canonicalMemberId && t.memberId === canonicalMemberId) return true;
        // b. transaction.memberPhoneNormalized === canonicalMemberPhone
        const txPhoneNorm = t.memberPhoneNormalized || normalizePhoneNumber(t.memberPhone || '');
        if (canonicalMemberPhone && txPhoneNorm && txPhoneNorm === canonicalMemberPhone) return true;

        return false;
      })
      .map(t => {
        let storeDisplayName = 'Watch Club - Branch';
        if (t.type === 'REDEEM' || t.type === 'VOUCHER_DISCOUNT') {
          storeDisplayName = 'Voucher Redeemed';
        } else if (t.storeName) {
          storeDisplayName = t.storeName.startsWith('Watch Club') 
            ? t.storeName 
            : `Watch Club - ${t.storeName}`;
        }

        const txDate = t.timestamp 
          ? new Date(t.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
          : '-';

        return {
          id: t.receiptNo || t.id,
          receiptNo: t.receiptNo || t.id,
          date: txDate,
          rawTimestamp: t.timestamp ? new Date(t.timestamp).getTime() : 0,
          store: storeDisplayName,
          points: Math.abs(t.pointsDelta ?? (t as any).points ?? 0),
          type: (t.pointsDelta !== undefined ? t.pointsDelta >= 0 : (t.type === 'EARN')) ? 'EARN' : 'REDEEM'
        };
      })
      .sort((a, b) => b.rawTimestamp - a.rawTimestamp);
  }, [firestoreTransactions, transactions, canonicalMemberId, canonicalMemberPhone]);

  const navItems = [
    { id: 'MEMBERSHIP', label: 'Membership', icon: CreditCard },
    { id: 'REWARDS', label: 'Rewards', icon: Award },
    { id: 'STORES', label: 'Stores', icon: MapPin },
    { id: 'PROFILE', label: 'Profile', icon: User }
  ] as const;

  return (
    <div className="w-full h-full bg-slate-100 dark:bg-black overflow-y-auto">
      <div className="w-full max-w-[480px] min-h-screen mx-auto bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 text-neutral-900 dark:text-white pb-[100px] relative shadow-2xl">
        
        <header className="relative flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 bg-neutral-50/90 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950/90 backdrop-blur-md sticky top-0 z-50 border-b border-black/5 dark:border-white/10 min-h-[58px]">
          <button 
            type="button"
            onClick={handleHeaderBack} 
            className={`w-8 h-8 rounded-full transition-all flex items-center justify-center cursor-pointer z-10 shrink-0 ${
              canGoBack 
                ? 'text-neutral-700 dark:text-neutral-300 hover:text-slate-950 dark:hover:text-white bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/5 dark:hover:bg-white/15 active:scale-95' 
                : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-400 hover:bg-black/[0.04] dark:hover:bg-white/5'
            }`}
            title={canGoBack ? "Kembali ke halaman sebelumnya" : "Beranda"}
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2]" />
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none text-neutral-900 dark:text-white">
            <WatchClubLogo className="h-[19px] sm:h-6 w-auto pointer-events-auto transition-transform hover:scale-105" />
          </div>

          <div className="flex items-center z-10 shrink-0">
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border border-black/5 dark:border-white/15 bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/5 dark:hover:bg-white/15 flex justify-center items-center text-neutral-700 dark:text-neutral-300 overflow-hidden shrink-0 transition-all cursor-pointer shadow-xs active:scale-95"
              title={isDarkMode ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
              aria-label="Ganti Tema"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 stroke-[1.75]" /> : <Moon className="w-4 h-4 stroke-[1.75]" />}
            </button>
          </div>
        </header>

        {activeTab === 'MEMBERSHIP' && (
          <div className="animate-fadeIn pb-5">
            {/* ACTIVE CAMPAIGN CAROUSEL */}
            {activePromoCampaigns.length > 0 && (
              <div className="mx-5 mt-4 relative rounded-2xl overflow-hidden bg-slate-100 aspect-[20/7] shadow-md group">
                <div 
                  className="flex w-full h-full transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {activePromoCampaigns.map((camp, idx) => (
                    <div 
                      key={camp.id} 
                      className="w-full h-full flex-shrink-0 relative cursor-pointer"
                      onClick={() => setActiveCampaignModal(camp)}
                    >
                      <img 
                        src={camp.bannerImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'} 
                        alt={camp.name}
                        className="w-full h-full object-cover object-center"
                      />
                    </div>
                  ))}
                </div>
                {/* Dots indicator */}
                {activePromoCampaigns.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {activePromoCampaigns.map((_, idx) => (
                      <div 
                        key={idx} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${currentSlide === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            <section className="px-5 pt-4 pb-1">
              <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                Hello <span className="capitalize">{(member?.name || 'Member').split(' ')[0]}</span>! Welcome to the Club!
              </h2>
            </section>

            <section className="px-5 mt-2.5">
              <MembershipCard 
                member={member} 
                onClickQr={() => {
                  setSelectedVoucherForQr(null);
                  setIsQrModalOpen(true);
                }} 
              />
            </section>

            <section className="bg-white dark:bg-white/5 m-5 p-5 rounded-[24px] shadow-sm dark:shadow-none border border-black/5 dark:border-white/10">
              <div className="flex justify-between items-end mb-3">
                <div><span className="font-bold text-sm text-neutral-900 dark:text-white">{member.tier} Level</span></div>
                <div className="text-right">
                  <div className="font-bold text-sm text-neutral-900 dark:text-white">
                    {member.tier === 'PLATINUM' || member.points >= 30000 
                      ? 'Top Tier Reached'
                      : `${Math.max(0, (nextTierPoints || 0) - (member.points || 0)).toLocaleString('id-ID')} more points to ${
                          member.tier === 'GOLD' ? 'Platinum' :
                          member.tier === 'SILVER' ? 'Gold' : 'Silver'
                        } Level`
                    }
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Current Balance: {(member.points || 0).toLocaleString('id-ID')} Points</div>
                </div>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%`, ...tierBackgroundStyle }}></div>
              </div>
            </section>

            <TierBenefitsList 
              currentTier={(member.tier as any) || 'BLUE'} 
            />

            <section className="m-5">
              <div className="flex justify-between items-center mb-4 pl-1">
                <h2 className="text-base font-bold text-neutral-900 dark:text-white">Recent Transactions</h2>
              </div>
              <div className="bg-white dark:bg-white/5 rounded-[24px] shadow-sm dark:shadow-none mb-4 relative overflow-hidden border border-black/5 dark:border-white/10">
                {isLoadingTransactions ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Memuat riwayat transaksi...
                  </div>
                ) : memberTransactions.length === 0 ? (
                  <div className="py-8 px-4 text-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-2 text-neutral-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-xs text-neutral-800 dark:text-neutral-200">Belum Ada Riwayat Transaksi</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 max-w-[260px] mx-auto">
                      Transaksi pembelanjaan dan perolehan poin Anda di seluruh gerai Watch Club akan otomatis tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="px-5 pt-2.5 pb-0">
                      {memberTransactions.slice(0, 3).map((trx, idx) => (
                        <div key={idx} className="flex items-center py-4 border-b border-black/5 dark:border-white/10 last:border-0">
                          <div className={`w-10 h-10 shrink-0 rounded-xl flex justify-center items-center mr-4 text-base ${trx.type === 'EARN' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                            {trx.type === 'EARN' ? <ArrowUp className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                          </div>
                          <div className="flex-grow min-w-0 pr-2">
                            <div className="font-semibold text-sm text-neutral-900 dark:text-white truncate">{trx.store}</div>
                            <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 truncate">{trx.date} • {trx.id}</div>
                          </div>
                          <div className={`font-bold text-sm shrink-0 whitespace-nowrap ${trx.type === 'EARN' ? 'text-emerald-500' : 'text-red-500'}`}>
                            {trx.type === 'EARN' ? '+' : '-'}{(trx.points || 0).toLocaleString('id-ID')} Pts
                          </div>
                        </div>
                      ))}
                    </div>
                    {memberTransactions.length > 2 && (
                      <div className="relative -mt-7 pt-10 px-5 pb-5 bg-gradient-to-b from-transparent via-white/95 to-white dark:via-neutral-900/95 dark:to-neutral-900 z-10 rounded-b-[24px]">
                        <button 
                          onClick={() => setIsHistoryModalOpen(true)}
                          className="w-full p-3 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 text-neutral-900 dark:text-white rounded-full font-semibold text-sm cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-neutral-800 shadow-sm"
                        >
                          Lihat Seluruh Riwayat ({memberTransactions.length})
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>

            <section className="m-5">
              <h2 className="text-base font-bold mb-4 pl-1 text-neutral-900 dark:text-white">Your Active Vouchers</h2>
              <div className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-2.5" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {activeCustomerVouchers.map((v, i) => (
                  <div key={v.id} className="flex-[0_0_calc(100%-40px)] max-w-[400px] bg-slate-100 dark:bg-black text-white rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] snap-start flex flex-col justify-between relative overflow-hidden min-h-[220px]" style={{
                    backgroundImage: v.imagePath ? `url('${v.imagePath}')` : 'linear-gradient(to bottom right, #fef08a, #c7d2fe)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div className="absolute inset-0 bg-black/40 z-0"></div>

                    {/* S&K Icon Button at Top-Right of Card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVoucherForTerms(v);
                      }}
                      className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/75 active:scale-95 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all cursor-pointer shadow-md group"
                      title="Syarat & Ketentuan (Terms & Conditions)"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                      <span>S&K</span>
                    </button>

                    <div className="relative z-10 h-full flex flex-col">
                      <div className="text-xs font-bold tracking-wider mb-1 text-white/90 uppercase drop-shadow-md pr-16">{v.subtitle}</div>
                      <div className="text-5xl font-bold leading-none mb-1 tracking-tight text-white drop-shadow-md">
                        {v.discountType === 'PERCENTAGE' ? `${v.discountValue || 0}% OFF` : `Rp ${Math.round((v.discountValue || 0) / 1000)}K`}
                      </div>
                      <div className="text-base font-semibold mb-1 text-white drop-shadow-md">{v.title}</div>
                      <div className="text-xs text-white/80 mb-6 font-medium drop-shadow-md">Valid until {v.validUntil}</div>
                      
                      <div className="flex items-center gap-2.5 relative mt-auto z-10">
                        <button 
                          onClick={() => {
                            setSelectedVoucherForQr(v);
                            setIsQrModalOpen(true);
                          }}
                          className="bg-white dark:bg-white/5 text-neutral-900 dark:text-white border-none py-3 px-6 rounded-full text-sm font-semibold cursor-pointer transition-transform hover:scale-105 shadow-sm dark:shadow-none"
                        >
                          Use Now
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVoucherForTerms(v)}
                          className="py-3 px-4 rounded-full text-xs font-semibold text-white/90 hover:text-white bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Lihat Syarat & Ketentuan (S&K)"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-300" />
                          <span>S&K</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'REWARDS' && (
          <div className="animate-fadeIn pb-5">
            <div className="px-5 pt-5 pb-2.5">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">My Rewards</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Your active vouchers and collected points</p>
            </div>

            <section className="m-5">
              <div className="flex flex-col gap-6">
                {activeCustomerVouchers.map(v => (
                  <div key={v.id} className="w-full bg-slate-100 dark:bg-black rounded-[24px] p-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] flex flex-col justify-between relative overflow-hidden min-h-[220px]" style={{
                    backgroundImage: v.imagePath ? `url('${v.imagePath}')` : 'linear-gradient(to bottom right, #0f172a, #1e293b)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}>
                    <div className="absolute inset-0 bg-black/50 z-0"></div>

                    {/* S&K Icon Button at Top-Right of Card */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVoucherForTerms(v);
                      }}
                      className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 hover:bg-black/75 active:scale-95 backdrop-blur-md text-white text-xs font-bold border border-white/20 transition-all cursor-pointer shadow-md group"
                      title="Syarat & Ketentuan (Terms & Conditions)"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-300 group-hover:scale-110 transition-transform" />
                      <span>S&K</span>
                    </button>
                    
                    <div className="relative z-20 h-full flex flex-col">
                      <div className="text-xs font-bold tracking-wider mb-1 text-slate-300 uppercase pr-16">{v.subtitle}</div>
                      <div className="text-[3.5rem] font-bold leading-none mb-1 tracking-[-2px] text-white">
                        {v.discountType === 'PERCENTAGE' ? `${v.discountValue || 0}% OFF` : `Rp ${Math.round((v.discountValue || 0) / 1000)}K`}
                      </div>
                      <div className="text-lg font-medium mb-1 text-white">{v.title}</div>
                      <div className="text-sm text-neutral-400 dark:text-neutral-500 mb-6 font-medium">Valid until {v.validUntil}</div>
                      
                      <div className="flex items-center gap-3 mt-auto">
                        <button 
                          onClick={() => {
                            setSelectedVoucherForQr(v);
                            setIsQrModalOpen(true);
                          }}
                          className="bg-slate-800 text-white border border-white/10 py-2.5 px-6 rounded-full text-sm font-semibold cursor-pointer transition-colors hover:bg-slate-950 hover:border-slate-500 self-start shadow-md"
                        >
                          Use Now
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedVoucherForTerms(v)}
                          className="py-2.5 px-4 rounded-full text-xs font-semibold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 active:scale-95 border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                          title="Lihat Syarat & Ketentuan (S&K)"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-300" />
                          <span>S&K</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'STORES' && (
          <div className="animate-fadeIn pb-5">
            <div className="px-5 pt-5 pb-2.5">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Our Stores</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 mb-4">Lokasi resmi butik Watch Club di seluruh Indonesia</p>
              
              <div className="relative w-full mb-3">
                <Search className="absolute left-[18px] top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500 w-4 h-4" />
                <input 
                  type="text" 
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  placeholder="Cari nama mall, kota, atau cabang..." 
                  className="w-full py-3 pr-5 pl-11 rounded-full border border-black/5 dark:border-white/10 bg-white dark:bg-white/5 text-[0.95rem] text-neutral-900 dark:text-white shadow-sm dark:shadow-none transition-all focus:outline-none focus:border-amber-500 focus:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
                />
              </div>

              {/* REGION FILTER CHIPS */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {[
                  { id: 'ALL', label: 'Semua Cabang' },
                  { id: 'JAKARTA', label: 'Jakarta' },
                  { id: 'BOGOR_DEPOK_BEKASI', label: 'BODETABEK' },
                  { id: 'JAWA_BARAT', label: 'Jawa Barat' },
                  { id: 'JAWA_TENGAH_DIY', label: 'Jateng & DIY' },
                  { id: 'JAWA_TIMUR', label: 'Jawa Timur' },
                  { id: 'LUAR_JAWA', label: 'Luar Jawa & Bali' }
                ].map((chip) => {
                  const isActive = selectedRegionFilter === chip.id;
                  return (
                    <button
                      key={chip.id}
                      type="button"
                      onClick={() => setSelectedRegionFilter(chip.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 shadow-sm'
                          : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10'
                      }`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* GPS STATUS BANNER */}
            {userLocation ? (
              <div className="mx-5 mb-3 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium rounded-xl border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>GPS Aktif: Mengurutkan cabang dari yang terdekat</span>
                </div>
                <button 
                  type="button" 
                  onClick={requestUserLocation}
                  disabled={isLocating}
                  className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/60 dark:hover:bg-emerald-900 text-emerald-900 dark:text-emerald-200 rounded-lg text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                  {isLocating ? 'Mencari...' : 'Perbarui'}
                </button>
              </div>
            ) : geolocationError ? (
              <div className="mx-5 mb-3 p-3 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-medium rounded-xl border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <p className="truncate">{geolocationError}</p>
                </div>
                <button 
                  type="button"
                  onClick={requestUserLocation}
                  disabled={isLocating}
                  className="px-3 py-1.5 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 text-amber-950 dark:text-amber-100 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0"
                >
                  {isLocating ? 'Mendeteksi...' : 'Aktifkan GPS'}
                </button>
              </div>
            ) : null}

            <div className="flex flex-col gap-4 px-5 py-2.5 pb-5">
              {filteredStores.length === 0 ? (
                <div className="text-center py-12 text-neutral-400">
                  <MapPin className="w-10 h-10 mx-auto text-neutral-300 dark:text-neutral-600 mb-2" />
                  <p className="font-semibold text-sm">Tidak ada toko yang cocok</p>
                  <p className="text-xs mt-1">Coba gunakan kata kunci pencarian lain atau pilih filter "Semua Cabang"</p>
                </div>
              ) : (
                filteredStores.map((store, idx) => (
                  <StoreCard 
                    key={store.id || idx} 
                    store={store} 
                    index={idx} 
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'PROFILE' && (
          <div className="animate-fadeIn pb-5">
            <div className="px-5 pt-5 pb-2.5 text-center">
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">My Profile</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Kelola data akun dan alamat pengiriman Anda</p>
            </div>

            <section className="px-5 pt-2.5 pb-[30px]">
              <div className="bg-white dark:bg-white/5 rounded-[20px] shadow-sm dark:shadow-none p-6 sm:p-8 flex flex-col items-center border border-black/5 dark:border-white/10">
                
                <div className="relative mb-6 flex flex-col items-center">
                  <div 
                    className="w-[88px] h-[88px] rounded-full bg-slate-100 dark:bg-black text-white flex justify-center items-center text-2xl font-bold shadow-md overflow-hidden group relative cursor-pointer ring-4 ring-neutral-200 dark:ring-neutral-800"
                    onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                  >
                    {isUploadingAvatar ? (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin mb-1"></div>
                        <span className="text-[10px] font-medium">Menyimpan...</span>
                      </div>
                    ) : member.avatarUrl ? (
                      <img src={member.avatarUrl} alt={member.name || 'Member'} className="w-full h-full object-cover object-center" />
                    ) : (
                      (member.name || 'M').charAt(0).toUpperCase()
                    )}
                    
                    {!isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleAvatarUpload}
                  />
                  <div className="text-center mt-3">
                    <button
                      type="button"
                      onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                      className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      {isUploadingAvatar ? 'Mengunggah foto...' : 'Ubah Foto Profil'}
                    </button>
                  </div>
                </div>

                <div className="w-full max-w-[400px] mb-6 grid grid-cols-2 gap-3">
                  <div className="bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 p-3 rounded-xl border border-black/5 dark:border-white/10 text-center">
                    <div className="text-[0.65rem] uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500">Home Store</div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5 truncate">{member.registeredStore || 'Puri Jakarta'}</div>
                  </div>
                  <div className="bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 p-3 rounded-xl border border-black/5 dark:border-white/10 text-center">
                    <div className="text-[0.65rem] uppercase tracking-wider font-bold text-neutral-400 dark:text-neutral-500">Tier</div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-white mt-0.5">{member.tier}</div>
                  </div>
                </div>

                <form className="w-full max-w-[400px] space-y-4 text-left" onSubmit={handleSaveProfile}>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Nama Lengkap</label>
                    <input type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-sm font-medium" value={member.name} readOnly disabled />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Nomor WhatsApp / HP</label>
                    <input type="text" className="w-full px-3.5 py-2.5 rounded-xl border border-black/5 dark:border-white/10 bg-neutral-100 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 text-sm font-medium" value={member.phone} readOnly disabled />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400">Alamat Email</label>
                      {member.linkedGoogleEmail && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Akun Google Terhubung
                        </span>
                      )}
                    </div>
                    <input 
                      type="email" 
                      value={profileEmail}
                      onChange={e => {
                        setProfileEmail(e.target.value);
                        setProfileSaveSuccess(false);
                        setProfileSaveError(null);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium transition-all" 
                      placeholder="nama@email.com" 
                    />
                    {member.linkedGoogleEmail && member.email && member.email !== member.linkedGoogleEmail && (
                      <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
                        Google Terkait: <span className="font-medium text-neutral-600 dark:text-neutral-300">{member.linkedGoogleEmail}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Alamat Pengiriman (Delivery Address)</label>
                    <textarea 
                      value={profileAddress}
                      onChange={e => {
                        setProfileAddress(e.target.value);
                        setProfileSaveSuccess(false);
                        setProfileSaveError(null);
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium resize-y min-h-[80px] transition-all" 
                      placeholder="Tuliskan alamat lengkap pengiriman hadiah voucher/merchandise..."
                    ></textarea>
                  </div>

                  {profileSaveSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Alamat email dan profil berhasil diperbarui!</span>
                    </div>
                  )}

                  {profileSaveError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                      <span>{profileSaveError}</span>
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSavingProfile}
                    className="w-full h-11 sm:h-12 bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-950 disabled:opacity-50 rounded-xl text-xs sm:text-[13px] font-semibold tracking-wide transition-all duration-200 shadow-sm active:scale-[0.99] cursor-pointer mt-2 flex items-center justify-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        <span>Menyimpan Perubahan...</span>
                      </>
                    ) : (
                      <span>Simpan Perubahan</span>
                    )}
                  </button>
                </form>

                {/* GOOGLE LINKAGE STATUS CARD IN PROFILE */}
                <div className="w-full max-w-[400px] mt-4 p-3.5 bg-neutral-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/10 rounded-2xl text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white dark:bg-white/10 flex items-center justify-center shadow-xs border border-black/5 dark:border-white/10 shrink-0">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {member.linkedGoogleEmail || member.googleUid ? 'Akun Google Terhubung' : 'Tautkan Akun Google'}
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                          {member.linkedGoogleEmail || member.recoveryEmail || 'Untuk pemulihan PIN & login instan'}
                        </div>
                      </div>
                    </div>
                    {member.linkedGoogleEmail || member.googleUid ? (
                      <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-[10px] font-semibold flex items-center gap-1 shrink-0">
                        <Check className="w-3 h-3" /> Terverifikasi
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleLinkGoogle}
                        disabled={isLinkingGoogle}
                        className="px-3 py-1.5 bg-neutral-900 text-white dark:bg-white dark:text-black rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {isLinkingGoogle ? 'Menghubungkan...' : 'Hubungkan'}
                      </button>
                    )}
                  </div>
                </div>

                {/* HELP & SUPPORT TICKET SHORTCUT IN PROFILE */}
                <div className="w-full max-w-[400px] mt-4 pt-4 border-t border-black/5 dark:border-white/10">
                  <button 
                    type="button"
                    onClick={() => {
                      setTicketSuccessNotice(null);
                      setIsSupportModalOpen(true);
                    }}
                    className="w-full p-3.5 sm:p-4 bg-neutral-100/70 hover:bg-neutral-200/60 dark:bg-white/[0.04] dark:hover:bg-white/[0.07] border border-black/5 dark:border-white/10 rounded-2xl flex items-center justify-between text-left transition-all duration-200 cursor-pointer group/help active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 border border-black/5 dark:border-white/10 group-hover/help:scale-105 transition-transform">
                        <HelpCircle className="w-4.5 h-4.5 stroke-[1.75]" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 group-hover/help:text-black dark:group-hover/help:text-white truncate">
                          Pusat Bantuan & Komplain Poin
                        </div>
                        <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                          Ajukan keluhan atau cek status tiket Anda
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {myTickets.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px] font-semibold tracking-tight">
                          {myTickets.length} Tiket
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-neutral-400 dark:text-neutral-500 group-hover/help:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                </div>

                <button 
                  type="button" 
                  onClick={onBackToHO} 
                  className="w-full max-w-[400px] h-11 rounded-xl border border-rose-500/20 hover:border-rose-500/30 bg-rose-500/[0.03] hover:bg-rose-500/[0.08] dark:border-rose-400/20 dark:hover:border-rose-400/30 dark:bg-rose-400/[0.06] dark:hover:bg-rose-400/10 text-rose-600 dark:text-rose-400 text-xs sm:text-[13px] font-medium transition-all duration-200 mt-3 flex justify-center items-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <LogOut className="w-3.5 h-3.5 stroke-[1.75]" /> 
                  <span>Sign Out</span>
                </button>
              </div>
            </section>
          </div>
        )}

        <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-[400px] bg-white/70 backdrop-blur-lg border border-black/5 dark:bg-black/40 dark:backdrop-blur-lg dark:border-white/10 rounded-[40px] flex justify-around items-center p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] dark:shadow-none z-[1000]">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex flex-col items-center gap-1 w-[60px] transition-colors bg-transparent border-none cursor-pointer ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:text-neutral-400'}`}
              >
                <div className={`w-10 h-10 rounded-full flex justify-center items-center text-[1.2rem] transition-colors ${isActive ? 'bg-slate-100 dark:bg-black text-white shadow-sm' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[0.65rem] font-semibold text-center leading-[1.1]">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-slate-100 dark:bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-white/5 rounded-[24px] text-center shadow-sm dark:shadow-none [0_20px_40px_-10px_rgba(0,0,0,0.1)] w-full max-w-[420px] p-[25px_20px] relative animate-scaleUp">
              <button 
                onClick={() => setIsHistoryModalOpen(false)}
                className="absolute top-4 right-4 bg-slate-100 border-none w-[30px] h-[30px] rounded-full cursor-pointer text-neutral-500 dark:text-neutral-400 transition-colors hover:bg-slate-200 hover:text-neutral-900 dark:text-white flex justify-center items-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="mb-4 text-center">
                <h3 className="mb-1 text-lg font-bold text-neutral-900 dark:text-white">All Transactions</h3>
                <p className="text-[0.85rem] text-neutral-500 dark:text-neutral-400 font-medium">Your complete transaction history</p>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto text-left pr-2 mt-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {isLoadingTransactions ? (
                  <div className="py-12 text-center text-xs text-neutral-400">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Memuat seluruh riwayat transaksi...
                  </div>
                ) : memberTransactions.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center mx-auto mb-3 text-neutral-400">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white mb-1">Belum Ada Riwayat Transaksi</h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[280px] mx-auto">
                      Belum ada catatan transaksi untuk akun keanggotaan ini. Saat Anda berbelanja di kasir gerai Watch Club, perolehan poin dan riwayat transaksi akan otomatis tercatat di sini.
                    </p>
                  </div>
                ) : (
                  memberTransactions.map((trx, idx) => (
                    <div key={idx} className="flex items-center py-4 border-b border-black/5 dark:border-white/10 last:border-0 transition-colors">
                      <div className={`w-10 h-10 shrink-0 rounded-xl flex justify-center items-center mr-4 text-base ${trx.type === 'EARN' ? 'bg-emerald-50 text-emerald-500' : 'bg-red-50 text-red-500'}`}>
                        {trx.type === 'EARN' ? <ArrowUp className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                      </div>
                      <div className="flex-grow min-w-0 pr-2">
                        <div className="font-semibold text-[0.9rem] text-neutral-900 dark:text-white truncate">{trx.store}</div>
                        <div className="text-[0.75rem] text-neutral-500 dark:text-neutral-400 mt-1 truncate">{trx.date} • {trx.id}</div>
                      </div>
                      <div className={`font-bold text-[0.95rem] shrink-0 whitespace-nowrap ${trx.type === 'EARN' ? 'text-emerald-500' : 'text-red-500'}`}>
                        {trx.type === 'EARN' ? '+' : '-'}{(trx.points || 0).toLocaleString('id-ID')} Pts
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <PwaInstallPrompt />

        {/* VOUCHER TERMS & CONDITIONS (S&K) MODAL */}
        <VoucherTermsModal
          voucher={selectedVoucherForTerms}
          onClose={() => setSelectedVoucherForTerms(null)}
          onUseNow={(voucher) => {
            setSelectedVoucherForTerms(null);
            setSelectedVoucherForQr(voucher);
            setIsQrModalOpen(true);
          }}
        />

        {isQrModalOpen && (
          <div className="fixed inset-0 bg-slate-100 dark:bg-black/40 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-white/5 rounded-[24px] text-center shadow-sm dark:shadow-none [0_20px_40px_-10px_rgba(0,0,0,0.1)] w-[90%] max-w-[340px] p-7 relative animate-scaleUp">
              <button 
                onClick={() => {
                  setIsQrModalOpen(false);
                  setSelectedVoucherForQr(null);
                }}
                className="absolute top-4 right-4 bg-slate-100 border-none w-[30px] h-[30px] rounded-full cursor-pointer text-neutral-500 dark:text-neutral-400 transition-colors hover:bg-slate-200 hover:text-neutral-900 dark:text-white flex justify-center items-center"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="mb-6 text-center">
                <h3 className="mb-2 text-lg font-bold text-neutral-900 dark:text-white">{selectedVoucherForQr ? 'Scan to Redeem' : 'Cashier Scan'}</h3>
                <p className="text-[0.85rem] text-neutral-500 dark:text-neutral-400 font-medium">{selectedVoucherForQr ? 'Show this code to the cashier' : 'Present this QR code at checkout'}</p>
              </div>
              
              <div className="w-[200px] h-[200px] mx-auto mb-5 bg-white rounded-2xl flex justify-center items-center p-3 shadow-inner border border-black/5 dark:border-white/10">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                    selectedVoucherForQr ? selectedVoucherForQr.code : member.membershipId
                  )}`} 
                  alt="QR Code" 
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="font-bold text-neutral-900 dark:text-white m-0">
                {selectedVoucherForQr ? 'Code:' : 'ID:'} <span className="font-mono ml-1 text-neutral-700 dark:text-neutral-300 tracking-wide">{selectedVoucherForQr ? selectedVoucherForQr.code : member.membershipId}</span>
              </p>
            </div>
          </div>
        )}

        {/* 1. PUSH-POP CAMPAIGN BANNER MODAL */}
        {activeCampaignModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex justify-center items-center z-[10000] p-4 animate-fadeIn">
            <div className="bg-slate-100 dark:bg-black rounded-3xl text-center shadow-2xl w-full max-w-sm overflow-hidden relative animate-scaleUp border border-slate-700">
              <button 
                onClick={() => setActiveCampaignModal(null)}
                className="absolute top-3.5 right-3.5 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors cursor-pointer z-20 backdrop-blur-sm shadow-md"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Banner Image Popup */}
              <div 
                className="relative w-full aspect-[3/4] bg-slate-950 overflow-hidden cursor-pointer group"
                onClick={() => {
                  setActiveCampaignModal(null);
                  handleTabChange('REWARDS');
                }}
              >
                <img 
                  src={activeCampaignModal.popupImage || activeCampaignModal.bannerImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80'} 
                  alt={activeCampaignModal.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 block"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. CUSTOMER SUPPORT & TICKETS MODAL */}
        {isSupportModalOpen && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex justify-center items-center z-[10000] p-4 animate-fadeIn">
            <div className="bg-white dark:bg-white/5 rounded-3xl shadow-sm dark:shadow-none 2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden relative animate-scaleUp border border-black/5 dark:border-white/10 text-xs">
              {/* HEADER */}
              <div className="p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Pusat Bantuan & Customer Care</h3>
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">Terhubung langsung dengan Watch Club Customer Care</p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsSupportModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-neutral-500 dark:text-neutral-400 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* TABS */}
              <div className="flex border-b border-black/5 dark:border-white/10 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950/70">
                <button
                  onClick={() => setSupportModalTab('NEW')}
                  className={`flex-1 py-2.5 text-center font-bold text-xs border-b-2 transition-colors cursor-pointer ${
                    supportModalTab === 'NEW' 
                      ? 'border-blue-600 text-blue-700 bg-white' 
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white'
                  }`}
                >
                  Ajukan Tiket Baru
                </button>
                <button
                  onClick={() => setSupportModalTab('HISTORY')}
                  className={`flex-1 py-2.5 text-center font-bold text-xs border-b-2 transition-colors cursor-pointer relative ${
                    supportModalTab === 'HISTORY' 
                      ? 'border-blue-600 text-blue-700 bg-white' 
                      : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white'
                  }`}
                >
                  <span>Riwayat Tiket Saya</span>
                  {myTickets.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-blue-100 text-blue-800 text-[10px] font-mono">
                      {myTickets.length}
                    </span>
                  )}
                </button>
              </div>

              {/* MODAL CONTENT */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {supportModalTab === 'NEW' ? (
                  <form onSubmit={handleCreateTicketSubmit} className="space-y-3">
                    {hasUnresolvedTicket && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Tiket Aktif Ditemukan:</strong> Anda memiliki tiket kendala yang belum diselesaikan (Resolved). Anda tidak dapat mengajukan tiket baru sampai tiket sebelumnya selesai. Cek <button type="button" onClick={() => setSupportModalTab('HISTORY')} className="underline font-bold text-blue-700 cursor-pointer">Riwayat Tiket Saya</button>.
                        </div>
                      </div>
                    )}
                    {ticketSuccessNotice && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{ticketSuccessNotice}</span>
                      </div>
                    )}

                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase block mb-1">
                        Kategori Masalah *
                      </label>
                      <select 
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white font-semibold focus:outline-none"
                      >
                        <option value="MISSING_POINTS">Poin Transaksi Belum Masuk</option>
                        <option value="VOUCHER_CLAIM">Kendala Klaim / Scan Voucher</option>
                        <option value="DATA_CORRECTION">Koreksi Data / No. HP Akun</option>
                        <option value="GENERAL_INQUIRY">Pertanyaan Umum Loyalty</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase block mb-1">
                        Toko Tempat Transaksi
                      </label>
                      <select
                        value={ticketStore}
                        onChange={(e) => setTicketStore(e.target.value)}
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white font-medium focus:outline-none"
                      >
                        {stores.map(s => (
                          <option key={s.id} value={s.name}>
                            {s.name} ({s.city})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase block mb-1">
                          Judul Singkat Keluhan *
                        </label>
                        <input
                          type="text"
                          required
                          value={ticketSubject || ''}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          placeholder="Contoh: Transaksi kemarin poin belum bertambah"
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-white/5"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase block mb-1">
                          Nomor Struk / Invoice (Opsional)
                        </label>
                        <input
                          type="text"
                          value={ticketReceipt || ''}
                          onChange={(e) => setTicketReceipt(e.target.value)}
                          placeholder="Contoh: INV-20260820-PUR-001"
                          className="w-full px-3 py-2 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-xl font-mono text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-white/5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-600 dark:text-neutral-400 uppercase block mb-1">
                        Rincian Keluhan / Pertanyaan *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={ticketMessage || ''}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        placeholder="Jelaskan detail transaksi Anda, jam berapa, atau kendala voucher..."
                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-xl text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-white/5"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Tiket ke Customer Care</span>
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {myTickets.length === 0 ? (
                      <div className="text-center py-8 text-neutral-400 dark:text-neutral-500">
                        <HelpCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-neutral-700 dark:text-neutral-300">Belum ada riwayat tiket</p>
                        <p className="text-[11px] text-neutral-400 dark:text-neutral-500">Jika mengalami kendala poin atau voucher, klik tab "Ajukan Tiket Baru".</p>
                      </div>
                    ) : (
                      myTickets.map(t => (
                        <div key={t.id} className="p-3.5 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 rounded-2xl border border-black/5 dark:border-white/10 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-neutral-500 dark:text-neutral-400 bg-white dark:bg-white/5 px-2 py-0.5 rounded border border-black/5 dark:border-white/10">
                              {t.id}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                              t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {t.status.replace('_', ' ')}
                            </span>
                          </div>

                          <div className="font-bold text-neutral-900 dark:text-white">{t.subject}</div>

                          {t.storeName && (
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
                              Butik: <strong>{t.storeName}</strong> {t.receiptNo ? `• Struk: ${t.receiptNo}` : ''}
                            </div>
                          )}

                          {/* POINT ADJUSTMENT HIGHLIGHT (IF APPLIED BY HO) */}
                          {t.adjustmentMade && (
                            <div className="p-2 bg-emerald-100/70 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-[11px] flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>
                                Customer Care menyalurkan {t.adjustmentMade.pointsDelta > 0 ? `+${t.adjustmentMade.pointsDelta}` : t.adjustmentMade.pointsDelta} Pts ({t.adjustmentMade.note})
                              </span>
                            </div>
                          )}

                          {/* RECENT MESSAGE */}
                          {t.messages.length > 0 && (
                            <div className="p-2.5 bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 text-[11px] text-neutral-700 dark:text-neutral-300">
                              <div className="font-bold text-blue-600 mb-0.5">
                                {t.messages[t.messages.length - 1].sender === 'AGENT' ? (t.assignedTo || 'Watch Club Customer Care') : 'Anda'}:
                              </div>
                              <p className="italic">"{t.messages[t.messages.length - 1].text}"</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
