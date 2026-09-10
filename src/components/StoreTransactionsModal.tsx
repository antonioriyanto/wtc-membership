import React, { useState, useMemo } from 'react';
import { StoreBranch, Transaction, Member } from '../types';
import { 
  Store, 
  Receipt, 
  Search, 
  Download, 
  X, 
  Filter, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  ChevronDown, 
  Layers, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldCheck, 
  Tag, 
  ShoppingBag,
  ExternalLink,
  Phone,
  User,
  Clock
} from 'lucide-react';
import { TierBadge } from '../utils/tierBadge';

interface StoreTransactionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedStore: StoreBranch | null; // null means "Seluruh Toko di Indonesia"
  stores: StoreBranch[];
  transactions: Transaction[];
  members: Member[];
  onSelectStore: (store: StoreBranch | null) => void;
}

export const StoreTransactionsModal: React.FC<StoreTransactionsModalProps> = ({
  isOpen,
  onClose,
  selectedStore,
  stores,
  transactions,
  members,
  onSelectStore
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
  const [selectedReceiptDetail, setSelectedReceiptDetail] = useState<Transaction | null>(null);

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
        if (!matchesStoreId && !matchesStoreName) {
          return false;
        }
      }

      // Type filter
      if (selectedType !== 'ALL' && trx.type !== selectedType) {
        return false;
      }

      // Search filter (receiptNo, memberName, memberPhone, notes, cashierName)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesReceipt = trx.receiptNo.toLowerCase().includes(term);
        const matchesMember = (trx.memberName || '').toLowerCase().includes(term);
        const matchesPhone = (trx.memberPhone || '').includes(term);
        const matchesNotes = (trx.notes || '').toLowerCase().includes(term);
        const matchesCashier = (trx.cashierName || '').toLowerCase().includes(term);
        const matchesStoreName = (trx.storeName || '').toLowerCase().includes(term);

        if (!matchesReceipt && !matchesMember && !matchesPhone && !matchesNotes && !matchesCashier && !matchesStoreName) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedStore, selectedType, searchTerm]);

  // Aggregate statistics for the filtered view
  const stats = useMemo(() => {
    const count = filteredTransactions.length;
    const totalAmount = filteredTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalPointsEarned = filteredTransactions
      .filter(t => t.pointsDelta > 0)
      .reduce((acc, t) => acc + t.pointsDelta, 0);
    const totalPointsRedeemed = filteredTransactions
      .filter(t => t.pointsDelta < 0)
      .reduce((acc, t) => acc + Math.abs(t.pointsDelta), 0);
    const avgBasket = count > 0 ? Math.round(totalAmount / count) : 0;

    return {
      count,
      totalAmount,
      totalPointsEarned,
      totalPointsRedeemed,
      avgBasket
    };
  }, [filteredTransactions]);

  if (!isOpen) return null;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No. Struk', 'Waktu', 'Cabang Toko', 'Member', 'No. Telepon', 'Kasir', 'Tipe', 'Nilai (Rp)', 'Poin Delta', 'Keterangan'];
    const rows = filteredTransactions.map(t => [
      `"${t.receiptNo}"`,
      `"${t.timestamp}"`,
      `"${t.storeName}"`,
      `"${t.memberName || '-'}"`,
      `"${t.memberPhone || '-'}"`,
      `"${t.cashierName || '-'}"`,
      `"${t.type}"`,
      t.amount || 0,
      t.pointsDelta || 0,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_${selectedStore ? selectedStore.name.replace(/\s+/g, '_') : 'indonesia_semua_toko'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMemberTier = (memberId: string): string => {
    const found = members.find(m => m.id === memberId || m.membershipId === memberId);
    return found ? found.tier : 'BLUE';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0 ${
              selectedStore ? 'bg-amber-500 text-white' : 'bg-slate-900 text-amber-400'
            }`}>
              {selectedStore ? <Store className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {selectedStore ? `Transaksi Toko: ${selectedStore.name}` : 'Seluruh Transaksi Toko di Indonesia'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  selectedStore 
                    ? 'bg-amber-100 text-amber-800 border border-amber-200/60' 
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200/60'
                }`}>
                  {selectedStore ? `${selectedStore.region} • ${selectedStore.code}` : '41 Cabang Nasional'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                {selectedStore ? (
                  <>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedStore.mallName || selectedStore.address}
                    </span>
                    <span>•</span>
                    <span>Manager: <strong>{selectedStore.managerName || 'Store Manager'}</strong></span>
                  </>
                ) : (
                  <span>Konsolidasi real-time seluruh penjualan, penukaran voucher, dan reward poin di seluruh gerai Watch Club Indonesia</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {/* Quick Store Selector Dropdown */}
            <div className="relative">
              <select
                id="modal-store-select-filter"
                value={selectedStore ? selectedStore.id : 'ALL'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'ALL') {
                    onSelectStore(null);
                  } else {
                    const store = stores.find(s => s.id === val || s.code === val);
                    if (store) onSelectStore(store);
                  }
                }}
                className="appearance-none bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs py-2 pl-3.5 pr-8 rounded-xl border border-slate-200 shadow-sm cursor-pointer transition-colors focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">🌐 Semua Toko di Indonesia (41 Cabang)</option>
                <optgroup label="Pilih Cabang Spesifik:">
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.city})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Export CSV Button */}
            <button
              id="export-store-transactions-btn"
              onClick={handleExportCSV}
              title="Download Data Transaksi (.CSV)"
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-sm transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            {/* Close Button */}
            <button
              id="close-store-transactions-modal-btn"
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="bg-slate-900 text-white px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4 border-b border-slate-800">
          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Total Transaksi</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
              {stats.count.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">struk</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Total Nilai Penjualan</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 truncate">
              Rp {stats.totalAmount.toLocaleString('id-ID')}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Poin Diterbitkan</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              +{stats.totalPointsEarned.toLocaleString('id-ID')} <span className="text-xs font-normal text-slate-400">Pts</span>
            </div>
          </div>

          <div>
            <div className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">Rata-Rata Belanja</div>
            <div className="text-xl sm:text-2xl font-black text-slate-200 mt-0.5 truncate">
              Rp {stats.avgBasket.toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* QUICK STORE PILLS / CHIPS */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/70 overflow-x-auto flex items-center gap-1.5 no-scrollbar">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 mr-1">Toko Cepat:</span>
          
          <button
            onClick={() => onSelectStore(null)}
            className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 transition-all ${
              selectedStore === null
                ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-400/50'
                : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            Semua Toko ({stores.length})
          </button>

          {/* Quick prominent stores */}
          {stores.slice(0, 10).map((s) => {
            const isSelected = selectedStore?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectStore(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm ring-2 ring-amber-300'
                    : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>

        {/* FILTER & SEARCH BAR */}
        <div className="p-4 sm:px-6 bg-white border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari No. Struk, Nama, No. HP, atau Kasir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-bold text-slate-600">
              <button
                onClick={() => setSelectedType('ALL')}
                className={`px-3 py-1 rounded-lg transition-all ${selectedType === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Semua Tipe
              </button>
              <button
                onClick={() => setSelectedType('EARN')}
                className={`px-3 py-1 rounded-lg transition-all ${selectedType === 'EARN' ? 'bg-white text-emerald-700 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Belanja (Earn)
              </button>
              <button
                onClick={() => setSelectedType('REDEEM')}
                className={`px-3 py-1 rounded-lg transition-all ${selectedType === 'REDEEM' ? 'bg-white text-purple-700 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Redeem Hadiah
              </button>
              <button
                onClick={() => setSelectedType('VOUCHER_DISCOUNT')}
                className={`px-3 py-1 rounded-lg transition-all ${selectedType === 'VOUCHER_DISCOUNT' ? 'bg-white text-blue-700 shadow-sm' : 'hover:text-slate-900'}`}
              >
                Voucher Diskon
              </button>
            </div>
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                <Receipt className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Belum Ada Transaksi Tercatat</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {selectedStore 
                  ? `Tidak ada transaksi untuk cabang ${selectedStore.name} dengan filter yang dipilih.` 
                  : 'Tidak ditemukan transaksi yang cocok dengan kata kunci pencarian.'}
              </p>
              {(searchTerm || selectedType !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedType('ALL');
                  }}
                  className="mt-4 px-4 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200/80 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-600 font-bold border-b border-slate-200">
                    <th className="py-3 px-4">No & Waktu</th>
                    <th className="py-3 px-4">No. Struk / Invoice</th>
                    <th className="py-3 px-4">Cabang Toko</th>
                    <th className="py-3 px-4">Member Pelanggan</th>
                    <th className="py-3 px-4">Kasir</th>
                    <th className="py-3 px-4">Keterangan Item / Promo</th>
                    <th className="py-3 px-4 text-right">Nilai Belanja</th>
                    <th className="py-3 px-4 text-center">Poin Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map((trx, idx) => {
                    const tier = getMemberTier(trx.memberId);
                    const isEarn = trx.type === 'EARN';
                    const isRedeem = trx.type === 'REDEEM';
                    const isVoucher = trx.type === 'VOUCHER_DISCOUNT';

                    return (
                      <tr 
                        key={trx.id || idx}
                        onClick={() => setSelectedReceiptDetail(trx)}
                        className="hover:bg-amber-50/40 transition-colors cursor-pointer group"
                      >
                        {/* No & Timestamp */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">#{idx + 1}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {trx.timestamp}
                          </div>
                        </td>

                        {/* Receipt No & Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                            {trx.receiptNo}
                          </div>
                          <div className="mt-0.5">
                            {isEarn && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                BELANJA (EARN)
                              </span>
                            )}
                            {isRedeem && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                REDEEM REWARD
                              </span>
                            )}
                            {isVoucher && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                VOUCHER PROMO
                              </span>
                            )}
                            {!isEarn && !isRedeem && !isVoucher && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                                {trx.type}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Store Branch */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <Store className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{trx.storeName}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5 pl-5">
                            ID: {trx.storeId}
                          </div>
                        </td>

                        {/* Member */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{trx.memberName || 'Guest Member'}</span>
                            <TierBadge tier={tier} size="sm" showSuffix={false} />
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {trx.memberPhone || '-'}
                          </div>
                        </td>

                        {/* Cashier */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="text-slate-800 font-medium">{trx.cashierName || 'Kasir Toko'}</div>
                        </td>

                        {/* Notes / Item */}
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                          {trx.notes ? (
                            <span title={trx.notes} className="truncate block">
                              {trx.notes}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Transaksi Resmi POS Watch Club</span>
                          )}
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-4 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                          {trx.amount > 0 ? `Rp ${trx.amount.toLocaleString('id-ID')}` : '-'}
                        </td>

                        {/* Points Delta */}
                        <td className="py-3 px-4 whitespace-nowrap text-center">
                          {trx.pointsDelta > 0 ? (
                            <span className="inline-flex items-center gap-0.5 font-bold text-emerald-600 font-mono bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <ArrowUpRight className="w-3 h-3" />
                              +{trx.pointsDelta}
                            </span>
                          ) : trx.pointsDelta < 0 ? (
                            <span className="inline-flex items-center gap-0.5 font-bold text-rose-600 font-mono bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              <ArrowDownRight className="w-3 h-3" />
                              {trx.pointsDelta}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono font-medium">0</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <strong>{filteredTransactions.length}</strong> transaksi {selectedStore ? `untuk cabang ${selectedStore.name}` : 'di seluruh Indonesia'}
          </div>

          <div className="flex items-center gap-2">
            {selectedStore && (
              <button
                onClick={() => onSelectStore(null)}
                className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm transition-colors"
              >
                Lihat Seluruh Indonesia (41 Cabang)
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* POPUP DETAIL STRUK */}
        {selectedReceiptDetail && (
          <div 
            className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
            onClick={() => setSelectedReceiptDetail(null)}
          >
            <div 
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Detail Struk Transaksi</h3>
                    <p className="text-[11px] text-slate-400 font-mono">{selectedReceiptDetail.receiptNo}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceiptDetail(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-400">Cabang Toko</span>
                  <span className="font-bold text-slate-900 text-right">{selectedReceiptDetail.storeName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-400">Waktu Transaksi</span>
                  <span className="font-semibold text-slate-800">{selectedReceiptDetail.timestamp}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-400">Member</span>
                  <span className="font-bold text-slate-900">{selectedReceiptDetail.memberName || '-'} ({selectedReceiptDetail.memberPhone || '-'})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-400">Kasir Bertugas</span>
                  <span className="font-semibold text-slate-800">{selectedReceiptDetail.cashierName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-slate-400">Item / Keterangan</span>
                  <span className="font-semibold text-slate-900 text-right max-w-[220px]">{selectedReceiptDetail.notes || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-bold">Total Pembayaran</span>
                  <span className="font-mono font-bold text-base text-slate-900">
                    {selectedReceiptDetail.amount > 0 ? `Rp ${selectedReceiptDetail.amount.toLocaleString('id-ID')}` : 'Rp 0 (Reward/Klaim)'}
                  </span>
                </div>
                <div className="flex justify-between py-1 bg-amber-50 p-2.5 rounded-xl border border-amber-200/60">
                  <span className="text-amber-900 font-bold">Poin Diterbitkan / Ditukar</span>
                  <span className={`font-mono font-extrabold ${selectedReceiptDetail.pointsDelta >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {selectedReceiptDetail.pointsDelta >= 0 ? `+${selectedReceiptDetail.pointsDelta}` : selectedReceiptDetail.pointsDelta} Points
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedReceiptDetail(null)}
                  className="w-full py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Tutup Struk
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
