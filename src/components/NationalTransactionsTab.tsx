import React, { useState, useMemo } from 'react';
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
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  ShoppingBag,
  Clock,
  Printer,
  X,
  Building2,
  Users,
  Coins,
  CreditCard
} from 'lucide-react';
import { TierBadge } from '../utils/tierBadge';

interface NationalTransactionsTabProps {
  stores: StoreBranch[];
  transactions: Transaction[];
  members: Member[];
  initialSelectedStore?: StoreBranch | null;
  onSelectStore?: (store: StoreBranch | null) => void;
  isSkeletonLoading?: boolean;
}

export const NationalTransactionsTab: React.FC<NationalTransactionsTabProps> = ({
  stores,
  transactions,
  members,
  initialSelectedStore = null,
  onSelectStore,
  isSkeletonLoading = false
}) => {
  if (isSkeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl" />
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

  // When parent updates selectedStore
  React.useEffect(() => {
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
        const matchReceipt = trx.receiptNo && trx.receiptNo.toLowerCase().includes(term);
        const matchMember = trx.memberName && trx.memberName.toLowerCase().includes(term);
        const matchPhone = trx.memberPhone && trx.memberPhone.toLowerCase().includes(term);
        const matchCashier = trx.cashierName && trx.cashierName.toLowerCase().includes(term);
        const matchStore = trx.storeName && trx.storeName.toLowerCase().includes(term);
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
    const headers = ['No Struk', 'Toko Cabang', 'Waktu', 'Nama Member', 'No Telepon', 'Tipe', 'Nominal Belanja', 'Poin Delta', 'Kasir', 'Catatan'];
    const rows = filteredTransactions.map(t => [
      t.receiptNo,
      t.storeName,
      new Date(t.timestamp).toLocaleString('id-ID'),
      t.memberName,
      t.memberPhone,
      t.type,
      t.amount || 0,
      t.pointsDelta,
      t.cashierName,
      t.notes || ''
    ]);

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
    <div className="animate-fadeIn space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900">Transaksi Toko Nasional</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live Ledger 40+ Toko
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Pusat pemantauan seluruh mutasi transaksi belanja, penukaran voucher, & poin di seluruh cabang Watch Club Indonesia.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
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
              className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 cursor-pointer appearance-none pr-9 min-w-[220px]"
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
            <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* SUMMARY METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>TOTAL OMZET TRANSAKSI</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900">
            Rp {metrics.revenue.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {selectedStore ? `Cabang ${selectedStore.name}` : 'Akumulasi 40+ Cabang Nasional'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>TOTAL STRUK TRANSAKSI</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-slate-900">
            {metrics.count.toLocaleString('id-ID')} Struk
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Rata-rata: Rp {metrics.averageBasket.toLocaleString('id-ID')} / transaksi
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>POIN DITERBITKAN (EARNED)</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-emerald-600">
            +{metrics.pointsEarned.toLocaleString('id-ID')} Pts
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Reward loyalty yang diberikan kasir
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>POIN DITUKARKAN (REDEEMED)</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl lg:text-2xl font-black text-purple-600">
            -{metrics.pointsRedeemed.toLocaleString('id-ID')} Pts
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Penukaran kupon diskon member
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari no struk (INV-...), nama member, nomor HP, kasir, atau nama toko..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Waktu:</span>
            {[
              { id: 'ALL', label: 'Semua Waktu' },
              { id: 'TODAY', label: 'Hari Ini' },
              { id: 'WEEK', label: '7 Hari' },
              { id: 'MONTH', label: '30 Hari' }
            ].map(df => (
              <button
                key={df.id}
                onClick={() => setDateFilter(df.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                  dateFilter === df.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {df.label}
              </button>
            ))}
          </div>
        </div>

        {/* Region & Transaction Type Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Region filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Wilayah:</span>
            {[
              { id: 'ALL', label: 'Seluruh Indonesia' },
              { id: 'JABODETABEK', label: 'Jabodetabek' },
              { id: 'JAWA_BALI', label: 'Jawa & Bali' },
              { id: 'SUMATERA', label: 'Sumatera' },
              { id: 'KALIMANTAN', label: 'Kalimantan' },
              { id: 'SULAWESI', label: 'Sulawesi' }
            ].map(reg => (
              <button
                key={reg.id}
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedRegion === reg.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Type filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Tipe:</span>
            {[
              { id: 'ALL', label: 'Semua Tipe' },
              { id: 'EARN', label: 'Belanja & Earn Poin' },
              { id: 'REDEEM', label: 'Tukar Voucher' },
              { id: 'MANUAL', label: 'Manual Adjustment' }
            ].map(tf => (
              <button
                key={tf.id}
                onClick={() => setSelectedType(tf.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedType === tf.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-bold">
                <th className="py-3.5 px-5">No. Struk & Waktu</th>
                <th className="py-3.5 px-5">Toko Cabang</th>
                <th className="py-3.5 px-5">Member / Pelanggan</th>
                <th className="py-3.5 px-5">Nilai Belanja</th>
                <th className="py-3.5 px-5">Poin Delta</th>
                <th className="py-3.5 px-5">Tipe & Kasir</th>
                <th className="py-3.5 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Receipt className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700 text-sm">Tidak ada transaksi ditemukan</p>
                    <p className="text-xs text-slate-400 mt-0.5">Coba sesuaikan kata kunci pencarian atau filter cabang/waktu.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => {
                  const isEarn = trx.type === 'EARN';
                  const isRedeem = trx.type === 'REDEEM' || trx.type === 'VOUCHER_DISCOUNT';
                  const isManual = trx.type === 'MANUAL_ADJUSTMENT';

                  // find member object for tier badge
                  const memberObj = members.find(m => m.id === trx.memberId || m.name === trx.memberName);

                  return (
                    <tr 
                      key={trx.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReceiptDetail(trx)}
                    >
                      {/* No Struk & Timestamp */}
                      <td className="py-3.5 px-5">
                        <div className="font-mono font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-slate-400" />
                          {trx.receiptNo}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(trx.timestamp).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>

                      {/* Store */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-emerald-600" />
                          {trx.storeName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {stores.find(s => s.name === trx.storeName)?.city || 'Nasional'}
                        </div>
                      </td>

                      {/* Member */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {trx.memberName}
                          {memberObj && <TierBadge tier={memberObj.tier} size="sm" />}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {trx.memberPhone}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-900">
                          Rp {(trx.amount || 0).toLocaleString('id-ID')}
                        </div>
                        {trx.voucherCode && (
                          <div className="text-[10px] text-purple-700 font-mono bg-purple-50 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                            Kupon: {trx.voucherCode}
                          </div>
                        )}
                      </td>

                      {/* Points Delta */}
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold text-xs ${
                          trx.pointsDelta > 0 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : trx.pointsDelta < 0 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-slate-100 text-slate-700'
                        }`}>
                          {trx.pointsDelta > 0 ? `+${trx.pointsDelta}` : trx.pointsDelta} Pts
                        </span>
                      </td>

                      {/* Type & Cashier */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-700">
                          {isEarn && 'Belanja Kasir'}
                          {isRedeem && 'Penukaran Voucher'}
                          {isManual && 'Manual Adjustment'}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Kasir: {trx.cashierName || 'Sistem'}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceiptDetail(trx);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Lihat Struk
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER SUMMARY */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Menampilkan <strong>{filteredTransactions.length}</strong> transaksi dari total {transactions.length} rekor</span>
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Watch Club National Ledger • Terverifikasi Enkripsi HO</span>
          </div>
        </div>
      </div>

      {/* RECEIPT DETAIL MODAL */}
      {selectedReceiptDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  WTC
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Salinan Struk Transaksi</h4>
                  <p className="text-[11px] text-slate-500">{selectedReceiptDetail.storeName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceiptDetail(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Struk Resmi</div>
                <div className="font-mono text-base font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  {selectedReceiptDetail.receiptNo}
                </div>
                <div className="text-[11px] text-slate-500">
                  {new Date(selectedReceiptDetail.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Outlet Cabang</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{selectedReceiptDetail.storeName}</div>
                  <div className="text-[11px] text-slate-500">Kasir: {selectedReceiptDetail.cashierName}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pelanggan</div>
                  <div className="font-bold text-slate-800 text-xs mt-0.5">{selectedReceiptDetail.memberName}</div>
                  <div className="text-[11px] text-slate-500 font-mono">{selectedReceiptDetail.memberPhone}</div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Nilai Transaksi Belanja</span>
                  <span className="font-bold text-slate-900 text-sm">
                    Rp {(selectedReceiptDetail.amount || 0).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Mutasi Poin Loyalty</span>
                  <span className={`font-bold text-sm ${selectedReceiptDetail.pointsDelta >= 0 ? 'text-emerald-600' : 'text-purple-600'}`}>
                    {selectedReceiptDetail.pointsDelta >= 0 ? `+${selectedReceiptDetail.pointsDelta}` : selectedReceiptDetail.pointsDelta} Pts
                  </span>
                </div>
                {selectedReceiptDetail.voucherCode && (
                  <div className="flex justify-between items-center text-purple-700 pt-1 border-t border-slate-200">
                    <span>Voucher Digunakan</span>
                    <span className="font-mono font-bold">{selectedReceiptDetail.voucherCode}</span>
                  </div>
                )}
              </div>

              {selectedReceiptDetail.notes && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <span className="font-bold">Catatan: </span> {selectedReceiptDetail.notes}
                </div>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Salinan
              </button>
              <button
                onClick={() => setSelectedReceiptDetail(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer ml-auto"
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
