import React, { useState, useMemo, useRef, useEffect } from 'react';
import { StoreBranch, Transaction, Member } from '../types';
import { 
  Store, 
  Receipt, 
  Search, 
  Download, 
  Filter, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  Clock, 
  Printer, 
  X, 
  Coins, 
  ShoppingBag, 
  Trash2, 
  Edit2,
  MoreVertical,
  RotateCcw,
  ShieldCheck,
  Building
} from 'lucide-react';
import { useCustomDialog } from './CustomDialogProvider';
import { TierBadge } from '../utils/tierBadge';
import { getBranchInfoByCode } from '../lib/storeMapping';

interface NationalTransactionsTabProps {
  stores: StoreBranch[];
  transactions: Transaction[];
  members: Member[];
  initialSelectedStore?: StoreBranch | null;
  onSelectStore?: (store: StoreBranch | null) => void;
  onReverseTransaction?: (originalTrx: Transaction, reason: string) => Promise<void>;
  isSkeletonLoading?: boolean;
}

export const NationalTransactionsTab: React.FC<NationalTransactionsTabProps> = ({
  stores,
  transactions,
  members,
  initialSelectedStore = null,
  onSelectStore,
  onReverseTransaction,
  isSkeletonLoading = false
}) => {
  if (isSkeletonLoading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-20 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-14 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-14 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const [selectedStore, setSelectedStore] = useState<StoreBranch | null>(initialSelectedStore);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState<Transaction | null>(null);
  const [reversalTargetTrx, setReversalTargetTrx] = useState<Transaction | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');
  const [isSubmittingReversal, setIsSubmittingReversal] = useState<boolean>(false);

  // Kebab Menu state
  const [activeMenuTrxId, setActiveMenuTrxId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const { showConfirm, showAlert } = useCustomDialog();

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuTrxId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // When parent updates selectedStore
  useEffect(() => {
    if (initialSelectedStore !== undefined) {
      setSelectedStore(initialSelectedStore);
    }
  }, [initialSelectedStore]);

  const handleStoreChange = (store: StoreBranch | null) => {
    setSelectedStore(store);
    if (onSelectStore) {
      onSelectStore(store);
    }
  };

  const isAnyFilterActive = Boolean(
    searchTerm.trim() || 
    dateFilter !== 'ALL' || 
    selectedRegion !== 'ALL' || 
    selectedType !== 'ALL' ||
    selectedStore !== null
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setDateFilter('ALL');
    setSelectedRegion('ALL');
    setSelectedType('ALL');
    handleStoreChange(null);
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(trx => {
      // Store filter
      if (selectedStore) {
        const matchesStoreId = trx.storeId && (
          trx.storeId.toLowerCase() === selectedStore.id.toLowerCase() || 
          trx.storeId.toLowerCase() === selectedStore.code.toLowerCase()
        );
        const matchesStoreName = trx.storeName && trx.storeName.toLowerCase().includes(selectedStore.name.toLowerCase());
        if (!matchesStoreId && !matchesStoreName) return false;
      }

      // Region filter
      if (selectedRegion !== 'ALL') {
        const matchedStoreObj = stores.find(s => s.id === trx.storeId || s.name === trx.storeName);
        const region = matchedStoreObj?.region?.toLowerCase() || '';
        if (selectedRegion === 'JABODETABEK' && !region.includes('jabodetabek')) return false;
        if (selectedRegion === 'JAWA_BALI' && !(region.includes('jawa') || region.includes('bali'))) return false;
        if (selectedRegion === 'SUMATERA' && !region.includes('sumatera')) return false;
        if (selectedRegion === 'KALIMANTAN' && !region.includes('kalimantan')) return false;
        if (selectedRegion === 'SULAWESI' && !region.includes('sulawesi')) return false;
      }

      // Type filter
      if (selectedType !== 'ALL') {
        if (selectedType === 'EARN' && trx.type !== 'EARN') return false;
        if (selectedType === 'REDEEM' && trx.type !== 'REDEEM' && trx.type !== 'VOUCHER_DISCOUNT') return false;
        if (selectedType === 'MANUAL' && trx.type !== 'MANUAL_ADJUSTMENT') return false;
      }

      // Date filter
      if (dateFilter !== 'ALL') {
        const txDate = new Date(trx.timestamp).getTime();
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        if (dateFilter === 'TODAY' && now - txDate > oneDay) return false;
        if (dateFilter === 'WEEK' && now - txDate > 7 * oneDay) return false;
        if (dateFilter === 'MONTH' && now - txDate > 30 * oneDay) return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        
        // Extract display store name for better searching
        const posCode = trx.receiptNo ? trx.receiptNo.split('/')[1] : null;
        const branchInfo = posCode ? getBranchInfoByCode(posCode) : null;
        const displayStoreName = branchInfo ? branchInfo.name : trx.storeName;

        const matchReceipt = trx.receiptNo && trx.receiptNo.toLowerCase().includes(term);
        const matchMember = trx.memberName && trx.memberName.toLowerCase().includes(term);
        const matchPhone = trx.memberPhone && trx.memberPhone.toLowerCase().includes(term);
        const matchCashier = trx.cashierName && trx.cashierName.toLowerCase().includes(term);
        const matchStore = displayStoreName && displayStoreName.toLowerCase().includes(term);
        const matchNotes = trx.notes && trx.notes.toLowerCase().includes(term);
        return matchReceipt || matchMember || matchPhone || matchCashier || matchStore || matchNotes;
      }

      return true;
    });
  }, [transactions, selectedStore, selectedRegion, selectedType, dateFilter, searchTerm, stores]);

  // Aggregate metrics for filtered data
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let totalPointsEarned = 0;
    let totalPointsRedeemed = 0;

    filteredTransactions.forEach(t => {
      if (t.amount) totalRevenue += t.amount;
      if (t.pointsDelta > 0) totalPointsEarned += t.pointsDelta;
      else if (t.pointsDelta < 0) totalPointsRedeemed += Math.abs(t.pointsDelta);
    });

    const averageBasket = filteredTransactions.length > 0 ? Math.round(totalRevenue / filteredTransactions.length) : 0;

    return {
      count: filteredTransactions.length,
      revenue: totalRevenue,
      pointsEarned: totalPointsEarned,
      pointsRedeemed: totalPointsRedeemed,
      averageBasket
    };
  }, [filteredTransactions]);

  const handleExportCSV = () => {
    const headers = ['No Struk', 'Toko Cabang', 'Waktu', 'Nama Member', 'No Telepon', 'Tipe', 'Nominal Transaksi', 'Poin Delta', 'Kasir', 'Catatan'];
    const rows = filteredTransactions.map(t => {
      const posCode = t.receiptNo ? t.receiptNo.split('/')[1] : null;
      const branchInfo = posCode ? getBranchInfoByCode(posCode) : null;
      const displayStoreName = branchInfo ? branchInfo.name : t.storeName;

      return [
        t.receiptNo,
        displayStoreName,
        new Date(t.timestamp).toLocaleString('id-ID'),
        t.memberName,
        t.memberPhone,
        t.type,
        t.amount || 0,
        t.pointsDelta,
        t.cashierName,
        t.notes || ''
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_watchclub_${selectedStore ? selectedStore.name.replace(/\s+/g, '_') : 'nasional'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">
              Transaksi Toko Nasional
            </h1>
            <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
              Live Ledger 40+ Toko
            </span>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Pusat pemantauan seluruh mutasi aktivitas loyalty, penukaran voucher, & poin di seluruh cabang Watch Club Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          {/* Store Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedStore ? selectedStore.id : 'ALL'}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'ALL') handleStoreChange(null);
                else {
                  const found = stores.find(s => s.id === val);
                  handleStoreChange(found || null);
                }
              }}
              className="pl-3 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-neutral-900 cursor-pointer appearance-none min-w-[200px]"
            >
              <option value="ALL">🏢 Seluruh Toko di Indonesia ({stores.length} Cabang)</option>
              <optgroup label="Pilih Cabang Spesifik">
                {stores.map(st => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.city})
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* SUMMARY METRICS CARDS (Flat Premium Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Omzet Transaksi */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <span>TOTAL OMZET TRANSAKSI</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            Rp {metrics.revenue.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            {selectedStore ? `Cabang ${selectedStore.name}` : 'Akumulasi 40+ Cabang Nasional'}
          </div>
        </div>

        {/* Struk Transaksi */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <span>TOTAL STRUK TRANSAKSI</span>
            <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {metrics.count.toLocaleString('id-ID')} Struk
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Rata-rata: Rp {metrics.averageBasket.toLocaleString('id-ID')} / transaksi
          </div>
        </div>

        {/* Poin Diterbitkan */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <span>POIN DITERBITKAN (EARNED)</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
            +{metrics.pointsEarned.toLocaleString('id-ID')} Pts
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Reward loyalty yang diberikan kasir
          </div>
        </div>

        {/* Poin Ditukarkan */}
        <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
            <span>POIN DITUKARKAN (REDEEMED)</span>
            <div className="w-6 h-6 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 tracking-tight">
            -{metrics.pointsRedeemed.toLocaleString('id-ID')} Pts
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1">
            Penukaran kupon diskon member
          </div>
        </div>
      </div>

      {/* UNIFIED COMPACT TOOLBAR (Space Saver: 1 Single Clean Row) */}
      <div className="bg-white dark:bg-neutral-900 p-3 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 shadow-xs flex flex-col lg:flex-row items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari no struk, member, HP, kasir, toko..."
            className="w-full pl-9 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Right: Compact Dropdown Filters (Waktu, Wilayah, Tipe) */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start lg:justify-end">
          {/* Waktu Filter */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="pl-8 pr-7 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 focus:outline-hidden focus:border-neutral-900 cursor-pointer appearance-none"
            >
              <option value="ALL">Semua Waktu</option>
              <option value="TODAY">Hari Ini</option>
              <option value="WEEK">7 Hari Terakhir</option>
              <option value="MONTH">30 Hari Terakhir</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Wilayah Filter */}
          <div className="relative flex items-center">
            <MapPin className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="pl-8 pr-7 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 focus:outline-hidden focus:border-neutral-900 cursor-pointer appearance-none"
            >
              <option value="ALL">Seluruh Indonesia</option>
              <option value="JABODETABEK">Jabodetabek</option>
              <option value="JAWA_BALI">Jawa & Bali</option>
              <option value="SUMATERA">Sumatera</option>
              <option value="KALIMANTAN">Kalimantan</option>
              <option value="SULAWESI">Sulawesi</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Tipe Filter */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-8 pr-7 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 focus:outline-hidden focus:border-neutral-900 cursor-pointer appearance-none"
            >
              <option value="ALL">Semua Tipe Transaksi</option>
              <option value="EARN">Penerbitan Poin (Earn)</option>
              <option value="REDEEM">Penukaran Voucher (Redeem)</option>
              <option value="MANUAL">Manual Adjustment</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 pointer-events-none" />
          </div>

          {/* Counter badge & Reset button */}
          <div className="flex items-center gap-1.5 ml-1">
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 px-2 py-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-lg whitespace-nowrap">
              {filteredTransactions.length} dari {transactions.length}
            </span>
            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                title="Reset Semua Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/70 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-neutral-50/60 dark:bg-neutral-850/40 border-b border-neutral-100 dark:border-neutral-800 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-4">NO. STRUK & WAKTU</th>
                <th className="py-3 px-4">TOKO CABANG</th>
                <th className="py-3 px-4">MEMBER / PELANGGAN</th>
                <th className="py-3 px-4 text-right">NILAI TRANSAKSI</th>
                <th className="py-3 px-4 text-right">POIN DELTA</th>
                <th className="py-3 px-4">TIPE & KASIR</th>
                <th className="py-3 px-4 text-right w-16">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-neutral-400">
                    <Receipt className="w-9 h-9 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                    <p className="font-semibold text-neutral-800 dark:text-neutral-200 text-sm">Tidak ada transaksi ditemukan</p>
                    <p className="text-xs text-neutral-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter cabang/waktu.</p>
                    {isAnyFilterActive && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-3 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Reset Filter
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isEarn = trx.type === 'EARN';
                  const isRedeem = trx.type === 'REDEEM' || trx.type === 'VOUCHER_DISCOUNT';
                  const isManual = trx.type === 'MANUAL_ADJUSTMENT';

                  // Extract store code from receipt number (e.g. JL-INV/C0085/...)
                  const posCode = trx.receiptNo ? trx.receiptNo.split('/')[1] : null;
                  const branchInfo = posCode ? getBranchInfoByCode(posCode) : null;
                  const displayStoreName = branchInfo ? branchInfo.name : (trx.storeName || 'Cabang Tidak Diketahui');

                  // Find member for tier
                  const memberObj = members.find(m => m.id === trx.memberId || m.name === trx.memberName);
                  const isMenuOpen = activeMenuTrxId === trx.id;

                  return (
                    <tr 
                      key={trx.id} 
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReceiptDetail(trx)}
                    >
                      {/* No Struk & Timestamp */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-neutral-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{trx.receiptNo}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 flex items-center gap-1 font-normal">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(trx.timestamp).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </td>

                      {/* Store Branch */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-neutral-900 dark:text-white flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{displayStoreName}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1 mt-0.5 font-normal">
                          <MapPin className="w-3 h-3" />
                          <span>{stores.find(s => s.name === displayStoreName)?.city || 'Nasional'}</span>
                        </div>
                      </td>

                      {/* Member & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900 dark:text-white">
                            {trx.memberName}
                          </span>
                          <TierBadge tier={memberObj?.tier || 'BLUE'} size="sm" />
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5 font-normal">
                          {trx.memberPhone}
                        </div>
                      </td>

                      {/* Amount (RATA KANAN) */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-semibold text-neutral-900 dark:text-white text-sm">
                          Rp {(trx.amount || 0).toLocaleString('id-ID')}
                        </div>
                        {trx.voucherCode && (
                          <div className="text-[10px] text-purple-700 dark:text-purple-300 font-mono bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            Kupon: {trx.voucherCode}
                          </div>
                        )}
                      </td>

                      {/* Points Delta (RATA KANAN with Soft UI) */}
                      <td className="py-3.5 px-4 text-right">
                        {trx.pointsDelta > 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                            +{trx.pointsDelta.toLocaleString('id-ID')} Pts
                          </span>
                        ) : trx.pointsDelta < 0 ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                            {trx.pointsDelta.toLocaleString('id-ID')} Pts
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                            0 Pts
                          </span>
                        )}
                      </td>

                      {/* Type & Cashier */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-neutral-700 dark:text-neutral-300">
                          {isEarn && 'Penerbitan Poin'}
                          {isRedeem && 'Penukaran Voucher'}
                          {isManual && 'Manual Adjustment'}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5 font-normal">
                          Kasir: {trx.cashierName || 'Sistem'}
                        </div>
                      </td>

                      {/* Clean Kebab Menu (Row Action) */}
                      <td 
                        className="py-3.5 px-4 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveMenuTrxId(isMenuOpen ? null : trx.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Menu Aksi"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-4 top-10 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1.5 z-30 text-left animate-fadeIn"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuTrxId(null);
                                setSelectedReceiptDetail(trx);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                              Lihat Detail Struk
                            </button>

                            {(() => {
                              const isReversal = trx.type === 'REVERSAL' || (trx.receiptNo && trx.receiptNo.startsWith('REV-'));
                              const isAlreadyReversed = transactions.some(t => 
                                t.originalTransactionId === trx.id || 
                                (t.reversedReceiptNo && t.reversedReceiptNo === trx.receiptNo) ||
                                (t.type === 'REVERSAL' && t.receiptNo === 'REV-' + trx.receiptNo)
                              );

                              if (isReversal) {
                                return (
                                  <div className="px-3.5 py-2 text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center gap-1.5 font-medium border-t border-neutral-100 dark:border-neutral-750">
                                    <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                                    Transaksi Reversal
                                  </div>
                                );
                              }

                              if (isAlreadyReversed) {
                                return (
                                  <div className="px-3.5 py-2 text-[11px] text-rose-500 dark:text-rose-400 flex items-center gap-1.5 font-medium border-t border-neutral-100 dark:border-neutral-750">
                                    <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                                    Sudah Dibatalkan (Reversed)
                                  </div>
                                );
                              }

                              if (onReverseTransaction) {
                                return (
                                  <>
                                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveMenuTrxId(null);
                                        setReversalTargetTrx(trx);
                                        setReversalReason('');
                                      }}
                                      className="w-full px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                                      Koreksi / Void (Reversal)
                                    </button>
                                  </>
                                );
                              }

                              return null;
                            })()}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER SUMMARY */}
        <div className="px-5 py-3.5 bg-neutral-50/50 dark:bg-neutral-850/40 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 gap-2">
          <span>Menampilkan <strong>{filteredTransactions.length}</strong> transaksi dari total {transactions.length} rekor</span>
          <div className="flex items-center gap-1.5 font-medium text-neutral-600 dark:text-neutral-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Watch Club National Ledger • Terverifikasi Enkripsi HO</span>
          </div>
        </div>
      </div>

      {/* RECEIPT DETAIL MODAL */}
      {selectedReceiptDetail && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedReceiptDetail(null)}
        >
          <div 
            className="bg-white dark:bg-neutral-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const posCode = selectedReceiptDetail.receiptNo ? selectedReceiptDetail.receiptNo.split('/')[1] : null;
              const branchInfo = posCode ? getBranchInfoByCode(posCode) : null;
              const displayStoreNameDetail = branchInfo ? branchInfo.name : selectedReceiptDetail.storeName;

              return (
                <>
                  <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
                        WTC
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Salinan Struk Transaksi</h4>
                        <p className="text-[11px] text-neutral-500">{displayStoreNameDetail}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReceiptDetail(null)}
                      className="w-8 h-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/60 space-y-1">
                      <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">No. Struk Resmi</div>
                      <div className="font-mono text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-emerald-600" />
                        {selectedReceiptDetail.receiptNo}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {new Date(selectedReceiptDetail.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase">Outlet Cabang</div>
                        <div className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs mt-0.5">{displayStoreNameDetail}</div>
                        <div className="text-[11px] text-neutral-500">Kasir: {selectedReceiptDetail.cashierName}</div>
                      </div>

                      <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/60">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase">Pelanggan</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs">{selectedReceiptDetail.memberName}</span>
                          <TierBadge tier={members.find(m => m.id === selectedReceiptDetail.memberId || m.name === selectedReceiptDetail.memberName)?.tier || 'BLUE'} size="sm" />
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono">{selectedReceiptDetail.memberPhone}</div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/60 space-y-2">
                      <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                        <span>Nilai Transaksi</span>
                        <span className="font-bold text-neutral-900 dark:text-white text-sm">
                          Rp {(selectedReceiptDetail.amount || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-600 dark:text-neutral-400">
                        <span>Mutasi Poin Loyalty</span>
                        <span className={`font-bold text-sm ${selectedReceiptDetail.pointsDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {selectedReceiptDetail.pointsDelta >= 0 ? `+${selectedReceiptDetail.pointsDelta}` : selectedReceiptDetail.pointsDelta} Pts
                        </span>
                      </div>
                      {selectedReceiptDetail.voucherCode && (
                        <div className="flex justify-between items-center text-purple-700 dark:text-purple-300 pt-1.5 border-t border-neutral-200 dark:border-neutral-700">
                          <span>Voucher Digunakan</span>
                          <span className="font-mono font-bold">{selectedReceiptDetail.voucherCode}</span>
                        </div>
                      )}
                    </div>

                    {selectedReceiptDetail.notes && (
                      <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-900 dark:text-amber-300 text-xs">
                        <span className="font-bold">Catatan: </span> {selectedReceiptDetail.notes}
                      </div>
                    )}
                  </div>

                  <div className="mt-6 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Cetak Salinan
                    </button>
                    <button
                      onClick={() => setSelectedReceiptDetail(null)}
                      className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition-colors cursor-pointer ml-auto"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* VOID / REVERSAL TRANSACTION MODAL */}
      {reversalTargetTrx && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => {
            if (!isSubmittingReversal) setReversalTargetTrx(null);
          }}
        >
          <div 
            className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-neutral-200 dark:border-neutral-800 relative animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-850/40">
              <h3 className="font-bold text-neutral-900 dark:text-white flex items-center gap-2 text-sm">
                <RotateCcw className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                Koreksi Ledger (Reversal Struk)
              </h3>
              <button 
                disabled={isSubmittingReversal}
                onClick={() => setReversalTargetTrx(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors text-neutral-500 cursor-pointer disabled:opacity-40"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!reversalReason.trim()) {
                showAlert('Mohon isi alasan koreksi / pembatalan struk transaksi.', 'Validasi', 'warning');
                return;
              }
              if (!onReverseTransaction) return;

              setIsSubmittingReversal(true);
              try {
                await onReverseTransaction(reversalTargetTrx, reversalReason.trim());
                showAlert(`Transaksi ${reversalTargetTrx.receiptNo} berhasil dibatalkan. Transaksi reversal telah dicatat di ledger secara permanen.`, 'Reversal Berhasil', 'success');
                setReversalTargetTrx(null);
                setReversalReason('');
              } catch (err: any) {
                console.error('Reversal error:', err);
                showAlert(err?.message || 'Gagal memproses reversal transaksi.', 'Reversal Gagal', 'error');
              } finally {
                setIsSubmittingReversal(false);
              }
            }}>
              <div className="p-6 space-y-4">
                <div className="p-3.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/60 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-neutral-500">No. Struk:</span>
                    <span className="font-mono font-bold text-neutral-800 dark:text-neutral-200">{reversalTargetTrx.receiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Pelanggan:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{reversalTargetTrx.memberName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Nilai:</span>
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">Rp {(reversalTargetTrx.amount || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Mutasi Poin Semula:</span>
                    <span className={`font-bold ${reversalTargetTrx.pointsDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {reversalTargetTrx.pointsDelta >= 0 ? `+${reversalTargetTrx.pointsDelta}` : reversalTargetTrx.pointsDelta} Pts
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    Alasan Pembatalan / Koreksi <span className="text-rose-500">*</span>
                  </label>
                  <textarea 
                    rows={3}
                    required
                    value={reversalReason}
                    onChange={(e) => setReversalReason(e.target.value)}
                    placeholder="Contoh: Customer retur produk jam tangan / koreksi salah input kasir"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
                  />
                </div>

                <div className="p-3 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-800/50 rounded-xl">
                  <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                    <strong>Prinsip Immutability Ledger:</strong> Struk asli tidak akan dihapus atau diubah. Sistem akan menerbitkan entri <em>Reversal</em> baru bertanda negatif (-), menyesuaikan saldo poin member secara otomatis, dan merekam jejak audit HO.
                  </p>
                </div>
              </div>

              <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-850/40 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingReversal}
                  onClick={() => setReversalTargetTrx(null)}
                  className="px-4 py-2 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-750 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReversal || !reversalReason.trim()}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  {isSubmittingReversal ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Konfirmasi Reversal</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
