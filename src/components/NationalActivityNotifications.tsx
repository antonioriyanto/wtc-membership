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
  readIds?: Set<string>;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
}

export const NationalActivityNotifications: React.FC<NationalActivityNotificationsProps> = ({
  isOpen,
  onClose,
  stores,
  transactions,
  members,
  onSelectStore,
  onRefreshData,
  isRefreshing = false,
  readIds,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
  const [internalReadIds, setInternalReadIds] = useState<Set<string>>(new Set());
  const effectiveReadIds = readIds !== undefined ? readIds : internalReadIds;
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
        isRead: effectiveReadIds.has(`tx-act-${tx.id}`),
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
        timeAgo: (() => {
          const m = Math.floor((Date.now() - new Date(mem.joinDate).getTime()) / 60000);
          return m < 1 ? 'Baru saja' : m < 60 ? `${m} menit lalu` : `${Math.floor(m/60)} jam lalu`;
        })(),
        isRead: effectiveReadIds.has(`mem-act-${mem.id}`),
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
        isRead: effectiveReadIds.has(item.id)
      });
    });

    return list;
  }, [transactions, members, stores, effectiveReadIds]);

  // Filter logic
  const filteredActivities = useMemo(() => {
    let filtered = activityList;

    if (activeTab === 'UNREAD') {
      filtered = filtered.filter(a => !a.isRead);
    }

    return filtered;
  }, [activityList, activeTab]);

  const unreadCount = useMemo(() => {
    return activityList.filter(a => !a.isRead).length;
  }, [activityList]);

  const markAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      const allIds = new Set(activityList.map(a => a.id));
      setInternalReadIds(allIds);
    }
  };

  const markAsRead = (id: string) => {
    if (onMarkAsRead) {
      onMarkAsRead(id);
    } else {
      setInternalReadIds(prev => new Set([...prev, id]));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer" 
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-hidden transform transition-transform animate-slideInRight">
        
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-900">Notifikasi Nasional</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">
                {unreadCount} Baru
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 mr-2 cursor-pointer transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS */}
        <div className="px-5 flex gap-6 border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('ALL')}
            className={`py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'ALL'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setActiveTab('UNREAD')}
            className={`py-3 text-sm font-semibold transition-colors border-b-2 cursor-pointer ${
              activeTab === 'UNREAD'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Belum Dibaca
          </button>
        </div>

        {/* NOTIFICATION FEED LIST */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-3">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CheckCheck className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-800">Semua aktivitas telah dibaca</p>
              <p className="text-sm text-slate-500 mt-1">Tidak ada notifikasi baru untuk saat ini.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActivities.map((act) => {
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
                    className={`p-4 rounded-xl transition-all cursor-pointer relative group flex gap-3.5 ${
                      act.isRead
                        ? 'bg-white hover:bg-slate-100/50 border border-transparent'
                        : 'bg-white shadow-sm border border-emerald-100'
                    }`}
                  >
                    {!act.isRead && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-r-md" />
                    )}

                    {/* Simple Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isEarn ? 'bg-emerald-100 text-emerald-600' :
                      isRedeem ? 'bg-amber-100 text-amber-600' :
                      isNewMember ? 'bg-blue-100 text-blue-600' :
                      isTier ? 'bg-purple-100 text-purple-600' :
                      'bg-slate-200 text-slate-600'
                    }`}>
                      {isEarn && <ShoppingBag className="w-5 h-5" />}
                      {isRedeem && <Gift className="w-5 h-5" />}
                      {isNewMember && <UserPlus className="w-5 h-5" />}
                      {isTier && <Crown className="w-5 h-5" />}
                      {act.type === 'STORE_STATUS' && <Store className="w-5 h-5" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`font-semibold text-sm leading-snug truncate pr-2 ${act.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                          {act.title}
                        </span>
                        <span className={`text-[11px] whitespace-nowrap shrink-0 mt-0.5 ${act.isRead ? 'text-slate-400' : 'text-emerald-600 font-medium'}`}>
                          {act.timeAgo}
                        </span>
                      </div>

                      <p className={`text-xs leading-snug line-clamp-2 ${act.isRead ? 'text-slate-500' : 'text-slate-600'}`}>
                        {act.description}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2 text-[11px] font-medium text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{act.storeName}, {act.storeCity}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
                      Nilai Transaksi: <strong>Rp {(selectedActivity.amount || 0).toLocaleString('id-ID')}</strong>
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
