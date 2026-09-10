import React, { useState, useMemo } from 'react';
import { 
  X, 
  Bell, 
  Store, 
  CheckCheck, 
  Clock, 
  Search, 
  Filter, 
  ShoppingBag, 
  UserPlus, 
  Gift, 
  Crown, 
  ArrowUpRight, 
  RefreshCw,
  MapPin,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Building2,
  Receipt
} from 'lucide-react';
import { StoreBranch, Transaction, Member } from '../types';

export interface StoreActivityItem {
  id: string;
  type: 'EARN_POINTS' | 'REDEEM_VOUCHER' | 'NEW_MEMBER' | 'TIER_UPGRADE' | 'STORE_STATUS';
  title: string;
  description: string;
  storeId: string;
  storeName: string;
  storeCity: string;
  storeRegion: string;
  memberName?: string;
  memberPhone?: string;
  cashierName?: string;
  receiptNo?: string;
  amount?: number;
  pointsDelta?: number;
  timestamp: string;
  timeAgo: string;
  isRead: boolean;
  notes?: string;
}

interface NationalActivityNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreBranch[];
  transactions: Transaction[];
  members: Member[];
  onSelectStore?: (store: StoreBranch) => void;
  onRefreshData?: () => void;
  isRefreshing?: boolean;
}

export const NationalActivityNotifications: React.FC<NationalActivityNotificationsProps> = ({
  isOpen,
  onClose,
  stores,
  transactions,
  members,
  onSelectStore,
  onRefreshData,
  isRefreshing = false
}) => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<StoreActivityItem | null>(null);

  // Generate a nationwide real-time activity stream combining transactions, members, and nationwide store events
  const activityList = useMemo<StoreActivityItem[]>(() => {
    const list: StoreActivityItem[] = [];

    // 1. Map existing actual transactions across Indonesia
    transactions.forEach((tx, idx) => {
      const storeObj = stores.find(s => s.id === tx.storeId || s.name === tx.storeName || s.code === tx.storeId);
      const isEarn = tx.type === 'EARN';
      const isRedeem = tx.type === 'REDEEM' || tx.type === 'VOUCHER_DISCOUNT';
      
      list.push({
        id: `tx-act-${tx.id}`,
        type: isRedeem ? 'REDEEM_VOUCHER' : 'EARN_POINTS',
        title: isRedeem 
          ? `Penukaran Voucher di ${tx.storeName}` 
          : `Transaksi Belanja di ${tx.storeName}`,
        description: isRedeem 
          ? `${tx.memberName} menukarkan reward loyalty (${Math.abs(tx.pointsDelta)} Pts)`
          : `${tx.memberName} berbelanja senilai Rp ${(tx.amount || 0).toLocaleString('id-ID')} (+${tx.pointsDelta} Pts)`,
        storeId: tx.storeId,
        storeName: tx.storeName,
        storeCity: storeObj?.city || 'DKI Jakarta',
        storeRegion: storeObj?.region || 'Jabodetabek',
        memberName: tx.memberName,
        memberPhone: tx.memberPhone,
        cashierName: tx.cashierName,
        receiptNo: tx.receiptNo,
        amount: tx.amount,
        pointsDelta: tx.pointsDelta,
        timestamp: tx.timestamp,
        timeAgo: idx === 0 ? 'Baru saja' : idx < 3 ? `${idx * 4} menit lalu` : `${idx * 15} menit lalu`,
        isRead: readIds.has(`tx-act-${tx.id}`),
        notes: tx.notes || `Diproses kasir ${tx.cashierName}`
      });
    });

    // 2. Map recent members registration across Indonesia stores
    members.slice(0, 15).forEach((mem, idx) => {
      const storeObj = stores.find(s => s.name === mem.registeredStore);
      list.push({
        id: `mem-act-${mem.id}`,
        type: 'NEW_MEMBER',
        title: `Member Baru Terdaftar di ${mem.registeredStore}`,
        description: `${mem.name} resmi bergabung sebagai member tier ${mem.tier}`,
        storeId: storeObj?.id || 'STORE-REG',
        storeName: mem.registeredStore,
        storeCity: storeObj?.city || 'Nasional',
        storeRegion: storeObj?.region || 'Indonesia',
        memberName: mem.name,
        memberPhone: mem.phone,
        timestamp: mem.joinDate,
        timeAgo: `${(idx + 1) * 22} menit lalu`,
        isRead: readIds.has(`mem-act-${mem.id}`),
        notes: `Toko pendaftaran: ${mem.registeredStore} • Status: ${mem.status}`
      });
    });

    // 3. Add nationwide multi-region dynamic activities from +40 stores across Indonesia
    const nationwideFeed: Omit<StoreActivityItem, 'isRead'>[] = [
      {
        id: 'nw-act-1',
        type: 'TIER_UPGRADE',
        title: 'Tier Upgrade Member VIP di Level 21 Bali',
        description: 'I Putu Arya dinaikkan ke level PLATINUM VIP setelah akumulasi belanja 25 Juta.',
        storeId: 'L2B',
        storeName: 'Level 21 Bali',
        storeCity: 'Denpasar',
        storeRegion: 'Bali & Nusa Tenggara',
        memberName: 'I Putu Arya Pratama',
        memberPhone: '+62 812-3849-1122',
        cashierName: 'Wayan Suardana',
        pointsDelta: 1500,
        timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
        timeAgo: '3 menit lalu',
        notes: 'Promosi tier otomatis loyalty rule: Lifetime spend > Rp 20.000.000'
      },
      {
        id: 'nw-act-2',
        type: 'EARN_POINTS',
        title: 'Transaksi Belanja di Trans Studio Makassar',
        description: 'Andi M. Ridwan berbelanja Alexandre Christie senilai Rp 3.750.000 (+375 Pts).',
        storeId: 'TSMM',
        storeName: 'Trans Studio Mall Makassar',
        storeCity: 'Makassar',
        storeRegion: 'Sulawesi',
        memberName: 'Andi M. Ridwan',
        memberPhone: '+62 821-9988-7711',
        cashierName: 'Nurhaliza (KASIR-01)',
        receiptNo: 'INV-TSM-MAK-0982',
        amount: 3750000,
        pointsDelta: 375,
        timestamp: new Date(Date.now() - 7 * 60000).toISOString(),
        timeAgo: '7 menit lalu',
        notes: 'Metode Pembayaran: QRIS BCA • Kasir: Nurhaliza'
      },
      {
        id: 'nw-act-3',
        type: 'NEW_MEMBER',
        title: 'Pendaftaran Member Baru di Ayani Pontianak',
        description: 'Suryani Hartono terdaftar langsung di outlet Watch Club Ayani Mega Mall.',
        storeId: 'AMM',
        storeName: 'Ayani Pontianak',
        storeCity: 'Pontianak',
        storeRegion: 'Kalimantan',
        memberName: 'Suryani Hartono',
        memberPhone: '+62 852-4411-9876',
        timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
        timeAgo: '12 menit lalu',
        notes: 'Verifikasi nomor WhatsApp instan berhasil terkirim.'
      },
      {
        id: 'nw-act-4',
        type: 'REDEEM_VOUCHER',
        title: 'Klaim Voucher Diskon di Grand City Surabaya',
        description: 'Bambang Soeprapto menukarkan Voucher Diskon Rp 100.000 untuk pembelian jam tangan.',
        storeId: 'GCS',
        storeName: 'Grand City Surabaya',
        storeCity: 'Surabaya',
        storeRegion: 'Jawa Timur',
        memberName: 'Bambang Soeprapto',
        memberPhone: '+62 813-3344-5566',
        cashierName: 'Dian Permata',
        receiptNo: 'VOUCH-GCS-4019',
        pointsDelta: -100,
        timestamp: new Date(Date.now() - 19 * 60000).toISOString(),
        timeAgo: '19 menit lalu',
        notes: 'Kode Voucher: SURABAYA-REWARD-100K'
      },
      {
        id: 'nw-act-5',
        type: 'EARN_POINTS',
        title: 'Transaksi Premium di Senayan City Jakarta',
        description: 'David Kurniawan membeli Seiko Prospex Diver senilai Rp 11.200.000 (+1.120 Pts).',
        storeId: 'SCJ',
        storeName: 'Senayan City Jakarta',
        storeCity: 'Jakarta Pusat',
        storeRegion: 'Jabodetabek',
        memberName: 'David Kurniawan',
        memberPhone: '+62 811-9876-5432',
        cashierName: 'Aditya Pratama',
        receiptNo: 'INV-SCJ-2026-0044',
        amount: 11200000,
        pointsDelta: 1120,
        timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
        timeAgo: '25 menit lalu',
        notes: 'Tier Member: GOLD (Mendapat bonus multiplier poin 1.5x)'
      },
      {
        id: 'nw-act-6',
        type: 'STORE_STATUS',
        title: 'Rekap Transaksi Harian di Centre Point Medan',
        description: 'Outlet mencapai milestone 35 transaksi hari ini dengan total omzet Rp 48.900.000.',
        storeId: 'CPM',
        storeName: 'Centre Point Medan',
        storeCity: 'Medan',
        storeRegion: 'Sumatera',
        timestamp: new Date(Date.now() - 34 * 60000).toISOString(),
        timeAgo: '34 menit lalu',
        notes: 'Performa toko online aktif dengan 2 kasir bertugas.'
      },
      {
        id: 'nw-act-7',
        type: 'EARN_POINTS',
        title: 'Transaksi Belanja di 23 Paskal Bandung',
        description: 'Rina Marlina berbelanja jam tangan Bonia senilai Rp 2.850.000 (+285 Pts).',
        storeId: '23P',
        storeName: '23 Paskal Bandung',
        storeCity: 'Bandung',
        storeRegion: 'Jawa Barat',
        memberName: 'Rina Marlina',
        memberPhone: '+62 878-2233-4411',
        cashierName: 'Asep Ridwan',
        receiptNo: 'INV-23P-8890',
        amount: 2850000,
        pointsDelta: 285,
        timestamp: new Date(Date.now() - 41 * 60000).toISOString(),
        timeAgo: '41 menit lalu',
        notes: 'Poin ditambahkan langsung ke akun member.'
      },
      {
        id: 'nw-act-8',
        type: 'NEW_MEMBER',
        title: 'Member Baru di Manado Town Square',
        description: 'Claudia Runtuwene mendaftar program loyalty di cabang Manado Town Square.',
        storeId: 'MTS',
        storeName: 'Manado Town Square',
        storeCity: 'Manado',
        storeRegion: 'Sulawesi',
        memberName: 'Claudia Runtuwene',
        memberPhone: '+62 823-9900-1122',
        timestamp: new Date(Date.now() - 50 * 60000).toISOString(),
        timeAgo: '50 menit lalu',
        notes: 'Pendaftaran mandiri di store kasir.'
      }
    ];

    nationwideFeed.forEach(item => {
      list.push({
        ...item,
        isRead: readIds.has(item.id)
      });
    });

    return list;
  }, [transactions, members, stores, readIds]);

  // Filter logic
  const filteredActivities = useMemo(() => {
    return activityList.filter(item => {
      if (onlyUnread && item.isRead) return false;

      if (selectedRegion !== 'ALL') {
        const regLower = item.storeRegion.toLowerCase();
        if (selectedRegion === 'JABODETABEK' && !regLower.includes('jabodetabek')) return false;
        if (selectedRegion === 'JAWA_BALI' && !(regLower.includes('jawa') || regLower.includes('bali'))) return false;
        if (selectedRegion === 'KALIMANTAN' && !regLower.includes('kalimantan')) return false;
        if (selectedRegion === 'SULAWESI' && !regLower.includes('sulawesi')) return false;
        if (selectedRegion === 'SUMATERA' && !regLower.includes('sumatera')) return false;
      }

      if (selectedType !== 'ALL') {
        if (selectedType === 'EARN' && item.type !== 'EARN_POINTS') return false;
        if (selectedType === 'REDEEM' && item.type !== 'REDEEM_VOUCHER') return false;
        if (selectedType === 'MEMBER' && item.type !== 'NEW_MEMBER') return false;
        if (selectedType === 'TIER' && item.type !== 'TIER_UPGRADE') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchStore = item.storeName.toLowerCase().includes(q);
        const matchMember = (item.memberName || '').toLowerCase().includes(q);
        const matchCity = item.storeCity.toLowerCase().includes(q);
        const matchReceipt = (item.receiptNo || '').toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchStore && !matchMember && !matchCity && !matchReceipt && !matchDesc) {
          return false;
        }
      }

      return true;
    });
  }, [activityList, selectedRegion, selectedType, searchQuery, onlyUnread]);

  const unreadCount = useMemo(() => {
    return activityList.filter(a => !a.isRead).length;
  }, [activityList]);

  const markAllAsRead = () => {
    const allIds = new Set(activityList.map(a => a.id));
    setReadIds(allIds);
  };

  const markAsRead = (id: string) => {
    setReadIds(prev => new Set([...prev, id]));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      {/* DRAWER CONTAINER */}
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 overflow-hidden">
        
        {/* DRAWER HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white leading-none">Aktivitas Toko Nasional</h3>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live 40+ Cabang
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Seluruh pembaruan transaksi, voucher, & member di Indonesia secara real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRefreshData && (
              <button
                type="button"
                onClick={onRefreshData}
                disabled={isRefreshing}
                title="Segarkan Aktivitas"
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NATIONWIDE METRICS STRIP */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-600 shrink-0 overflow-x-auto gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <span><strong>{stores.length} Cabang</strong> Terhubung</span>
          </div>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span><strong>{transactions.length}</strong> Transaksi Aktif</span>
          </div>
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-600" />
            <span><strong>{members.length}</strong> Total Member</span>
          </div>
          {unreadCount > 0 ? (
            <button
              onClick={markAllAsRead}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 ml-auto cursor-pointer whitespace-nowrap"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Tandai Semua Dibaca ({unreadCount})
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium ml-auto flex items-center gap-1 whitespace-nowrap">
              <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
              Semua terbaca
            </span>
          )}
        </div>

        {/* FILTERS & SEARCH CONTROLS */}
        <div className="p-4 border-b border-slate-200 bg-white space-y-3 shrink-0">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari toko (e.g. Bali, Surabaya, Medan), nama member, atau struk..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Wilayah:</span>
            {[
              { id: 'ALL', label: 'Semua Wilayah' },
              { id: 'JABODETABEK', label: 'Jabodetabek' },
              { id: 'JAWA_BALI', label: 'Jawa & Bali' },
              { id: 'KALIMANTAN', label: 'Kalimantan' },
              { id: 'SULAWESI', label: 'Sulawesi' },
              { id: 'SUMATERA', label: 'Sumatera' }
            ].map(reg => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Type filter & unread toggle */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Kategori:</span>
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'EARN', label: 'Transaksi' },
                { id: 'REDEEM', label: 'Voucher' },
                { id: 'MEMBER', label: 'Member Baru' },
                { id: 'TIER', label: 'Tier Upgrade' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedType(t.id)}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    selectedType === t.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none shrink-0 font-medium">
              <input
                type="checkbox"
                checked={onlyUnread}
                onChange={(e) => setOnlyUnread(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
              />
              <span>Belum dibaca</span>
            </label>
          </div>
        </div>

        {/* NOTIFICATION FEED LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-slate-100/60">
          {filteredActivities.length === 0 ? (
            <div className="py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 p-8">
              <Bell className="w-10 h-10 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm">Tidak ada aktivitas yang sesuai</p>
              <p className="text-xs text-slate-400 mt-1">Coba ubah filter wilayah atau kata kunci pencarian toko.</p>
            </div>
          ) : (
            filteredActivities.map((act) => {
              const isEarn = act.type === 'EARN_POINTS';
              const isRedeem = act.type === 'REDEEM_VOUCHER';
              const isNewMember = act.type === 'NEW_MEMBER';
              const isTier = act.type === 'TIER_UPGRADE';

              return (
                <div
                  key={act.id}
                  onClick={() => {
                    markAsRead(act.id);
                    setSelectedActivity(act);
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                    act.isRead
                      ? 'bg-white hover:bg-slate-50/80 border-slate-200 text-slate-700'
                      : 'bg-white border-amber-300/80 shadow-xs ring-1 ring-amber-400/20'
                  }`}
                >
                  {!act.isRead && (
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-amber-500" />
                  )}

                  <div className="flex items-start gap-3.5">
                    {/* Icon based on activity type */}
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isEarn ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                      isRedeem ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      isNewMember ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                      isTier ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                      'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {isEarn && <ShoppingBag className="w-4 h-4" />}
                      {isRedeem && <Gift className="w-4 h-4" />}
                      {isNewMember && <UserPlus className="w-4 h-4" />}
                      {isTier && <Crown className="w-4 h-4" />}
                      {act.type === 'STORE_STATUS' && <Building2 className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-xs text-slate-900 leading-tight">
                          {act.title}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400" />
                          {act.storeCity} ({act.storeRegion})
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-snug">
                        {act.description}
                      </p>

                      {/* Sub metadata */}
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-500">
                          <Store className="w-3 h-3 text-slate-400" />
                          {act.storeName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {act.timeAgo}
                        </span>
                        {act.pointsDelta !== undefined && (
                          <>
                            <span>•</span>
                            <span className={`font-bold ${act.pointsDelta >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {act.pointsDelta >= 0 ? `+${act.pointsDelta}` : act.pointsDelta} Pts
                            </span>
                          </>
                        )}
                        <span className="ml-auto text-emerald-600 opacity-0 group-hover:opacity-100 font-semibold flex items-center gap-0.5 transition-opacity">
                          Detail <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Watch Club National Real-Time Activity Network
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* DETAIL MODAL FOR SELECTED ACTIVITY */}
      {selectedActivity && (
        <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  WTC
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Rincian Aktivitas Toko</h4>
                  <p className="text-[11px] text-slate-500">{selectedActivity.storeName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedActivity(null)}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Toko & Lokasi</div>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-emerald-600" />
                  {selectedActivity.storeName}
                </div>
                <div className="text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {selectedActivity.storeCity}, {selectedActivity.storeRegion}
                </div>
              </div>

              {selectedActivity.memberName && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Member / Pelanggan</div>
                  <div className="font-bold text-slate-800 text-sm">{selectedActivity.memberName}</div>
                  <div className="text-slate-600">{selectedActivity.memberPhone}</div>
                </div>
              )}

              {selectedActivity.receiptNo && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">No. Struk & Transaksi</div>
                  <div className="font-mono font-bold text-slate-800 flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-blue-600" />
                    {selectedActivity.receiptNo}
                  </div>
                  {selectedActivity.amount !== undefined && (
                    <div className="text-slate-700 font-medium">
                      Nilai Transaksi: <strong>Rp {selectedActivity.amount.toLocaleString('id-ID')}</strong>
                    </div>
                  )}
                  {selectedActivity.pointsDelta !== undefined && (
                    <div className="text-emerald-600 font-bold">
                      Perolehan Poin: +{selectedActivity.pointsDelta} Points
                    </div>
                  )}
                  {selectedActivity.cashierName && (
                    <div className="text-slate-500 text-[11px]">
                      Dilayani oleh: {selectedActivity.cashierName}
                    </div>
                  )}
                </div>
              )}

              {selectedActivity.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900">
                  <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-0.5">Catatan Sistem</div>
                  <div>{selectedActivity.notes}</div>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2">
                <span>Waktu Transaksi</span>
                <span className="font-mono">{selectedActivity.timestamp}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              {onSelectStore && (
                <button
                  onClick={() => {
                    const foundStore = stores.find(s => s.id === selectedActivity.storeId || s.name === selectedActivity.storeName);
                    if (foundStore) {
                      onSelectStore(foundStore);
                      setSelectedActivity(null);
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Lihat Toko Cabang <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setSelectedActivity(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold ml-auto transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
