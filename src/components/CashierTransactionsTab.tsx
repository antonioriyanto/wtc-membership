import React, { useState, useRef, useEffect } from 'react';
import { Transaction } from '../types';
import { 
  Receipt, 
  ArrowUp, 
  Ticket, 
  Search, 
  FileDown, 
  Eye, 
  X, 
  Store, 
  User, 
  Calendar, 
  ChevronDown, 
  FileSpreadsheet, 
  FileText,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface TransactionsTabProps {
  transactions: Transaction[];
  currentStoreName?: string;
}

export const CashierTransactionsTab: React.FC<TransactionsTabProps> = ({ 
  transactions,
  currentStoreName
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Extract unique store names from transactions for the filter
  const storeNames = Array.from(new Set(transactions.map(t => t.storeName || 'Puri Jakarta').filter(Boolean)));

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = 
      (t.memberName || '').toLowerCase().includes(searchInput.toLowerCase()) || 
      (t.memberPhone || '').includes(searchInput) || 
      (t.receiptNo || '').toLowerCase().includes(searchInput.toLowerCase()) ||
      ((t as any).memberEmail || '').toLowerCase().includes(searchInput.toLowerCase()) ||
      (t.id || '').toLowerCase().includes(searchInput.toLowerCase());
    
    let matchesType = true;
    if (typeFilter === 'EARN' && t.type !== 'EARN') matchesType = false;
    if (typeFilter === 'REDEEM' && t.type !== 'REDEEM') matchesType = false;

    let matchesStore = true;
    if (storeFilter !== 'all') {
      matchesStore = (t.storeName || 'Puri Jakarta') === storeFilter;
    }

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(t.timestamp) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(t.timestamp) <= end;
    }
    
    return matchesSearch && matchesType && matchesStore && matchesDate;
  });

  // Calculate live global ledger metrics across ALL transactions
  const totalAllTransactions = transactions.length;
  const totalPointsIssued = transactions.filter(t => t.type === 'EARN').reduce((sum, t) => sum + t.pointsDelta, 0);
  const totalPointsRedeemed = transactions.filter(t => t.type === 'REDEEM').reduce((sum, t) => sum + Math.abs(t.pointsDelta), 0);

  // Format data for export
  const prepareExportData = () => {
    return filteredTransactions.map((t, idx) => ({
      'No': idx + 1,
      'ID Transaksi': t.id,
      'Tanggal & Waktu': new Date(t.timestamp).toLocaleString('id-ID'),
      'Nomor Struk': t.receiptNo || '-',
      'Nama Pelanggan': t.memberName || '-',
      'No. Telepon': t.memberPhone || '-',
      'Email': (t as any).memberEmail || '-',
      'Lokasi Toko': t.storeName || 'Puri Jakarta',
      'Tipe Transaksi': t.type === 'EARN' ? 'Penambahan Poin' : 'Penukaran Voucher',
      'Perubahan Poin': t.type === 'EARN' ? `+${t.pointsDelta}` : `${t.pointsDelta}`,
      'Kode Voucher': t.voucherCode || '-',
      'Kasir': t.cashierName || 'Kasir'
    }));
  };

  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      alert('Belum ada data transaksi yang sesuai filter untuk diekspor.');
      return;
    }
    const data = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 16 }, // ID Transaksi
      { wch: 22 }, // Tanggal & Waktu
      { wch: 18 }, // Nomor Struk
      { wch: 22 }, // Nama Pelanggan
      { wch: 16 }, // No. Telepon
      { wch: 24 }, // Email
      { wch: 18 }, // Lokasi Toko
      { wch: 18 }, // Tipe Transaksi
      { wch: 16 }, // Perubahan Poin
      { wch: 16 }, // Kode Voucher
      { wch: 14 }  // Kasir
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger Transaksi');
    XLSX.writeFile(workbook, `WatchClub_Transaksi_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setIsExportDropdownOpen(false);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert('Belum ada data transaksi untuk diekspor.');
      return;
    }

    const headers = ['ID Transaksi', 'Tanggal & Waktu', 'No Struk', 'Nama Pelanggan', 'No HP', 'Email', 'Store', 'Tipe Transaksi', 'Perubahan Poin', 'Kode Voucher', 'Kasir'];
    const rows = filteredTransactions.map(t => [
      `"${t.id}"`,
      `"${new Date(t.timestamp).toLocaleString('id-ID')}"`,
      `"${t.receiptNo || ''}"`,
      `"${(t.memberName || '').replace(/"/g, '""')}"`,
      `"${t.memberPhone || ''}"`,
      `"${((t as any).memberEmail || '-').replace(/"/g, '""')}"`,
      `"${(t.storeName || 'Puri Jakarta').replace(/"/g, '""')}"`,
      `"${t.type === 'EARN' ? 'Penambahan Poin' : 'Penukaran Voucher'}"`,
      t.pointsDelta,
      `"${t.voucherCode || '-'}"`,
      `"${t.cashierName || 'Kasir'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WatchClub_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Riwayat Transaksi & Buku Besar ({currentStoreName || 'Cabang Ini'})
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Khusus Toko Ini
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Menampilkan aktivitas dan riwayat transaksi khusus kasir cabang <strong>{currentStoreName || 'ini'}</strong>.
          </p>
        </div>
      </div>

      {/* REAL-TIME STAT SUMMARY CARDS (HIGH-CONTRAST CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1 */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 border-l-4 border-l-slate-900 dark:border-l-emerald-500 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900/80 flex justify-center items-center text-slate-900 dark:text-emerald-400 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {totalAllTransactions.toLocaleString('id-ID')}
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Total Transaksi ({currentStoreName || 'Toko Ini'})
              </p>
            </div>
          </div>
        </div>

        {/* CARD 2 */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 border-l-4 border-l-emerald-500 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex justify-center items-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <ArrowUp className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                + {totalPointsIssued.toLocaleString('id-ID')}
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Total Poin Diterbitkan
              </p>
            </div>
          </div>
        </div>

        {/* CARD 3 */}
        <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 border-l-4 border-l-amber-500 transition-all hover:shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex justify-center items-center text-amber-600 dark:text-amber-400 shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {totalPointsRedeemed.toLocaleString('id-ID')}
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                Total Poin / Voucher Digunakan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-[260px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Cari struk, member, HP, email..."
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* Store Badge indicator */}
            <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold shrink-0">
              <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Toko: {currentStoreName || 'Cabang Aktif'}</span>
            </div>

            {/* Transaction Type Filter */}
            <select 
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer font-medium"
            >
              <option value="all">Semua Tipe Transaksi</option>
              <option value="EARN">Penambahan Poin (+)</option>
              <option value="REDEEM">Penukaran Voucher (-)</option>
            </select>

            {/* Date Range Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-emerald-500" 
                title="Tanggal Mulai" 
              />
              <span className="text-slate-400 text-xs">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-emerald-500" 
                title="Tanggal Selesai" 
              />
            </div>
          </div>

          {/* EXPORT DROPDOWN BUTTON */}
          <div className="relative w-full sm:w-auto" ref={exportDropdownRef}>
            <button 
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Ekspor Data</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5 opacity-80" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-fadeIn">
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium transition-colors text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Ekspor ke Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Ekspor ke CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TRANSACTIONS TABLE CONTAINER */}
      <div className="bg-white dark:bg-slate-800/95 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-700/80">
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tanggal & Waktu</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">No Struk</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Pelanggan</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">No. HP</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Email</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Lokasi Store</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Tipe Transaksi</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">Poin</th>
                <th className="py-4 px-5 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredTransactions.map(trx => (
                <tr key={trx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="py-4 px-5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                    {new Date(trx.timestamp).toLocaleString('id-ID', {
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric', 
                      hour: '2-digit', 
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {trx.receiptNo}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-900 dark:text-white font-semibold">{trx.memberName}</td>
                  <td className="py-4 px-5 text-slate-700 dark:text-slate-300 font-mono text-xs">{trx.memberPhone}</td>
                  <td className="py-4 px-5 text-slate-600 dark:text-slate-400 text-xs">{(trx as any).memberEmail || '-'}</td>
                  <td className="py-4 px-5">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/80 px-2.5 py-1 rounded-md">
                      <Store className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {trx.storeName || 'Puri Jakarta'}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                      trx.type === 'EARN' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                    }`}>
                      {trx.type === 'EARN' ? 'Penambahan Poin' : `Klaim: ${trx.voucherCode || 'Voucher'}`}
                    </span>
                  </td>
                  <td className={`py-4 px-5 font-bold ${trx.type === 'EARN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {trx.type === 'EARN' ? '+' : ''}{trx.pointsDelta} Pts
                  </td>
                  <td className="py-4 px-5 text-center">
                    <button 
                      onClick={() => setSelectedTrx(trx)}
                      title="Lihat Detail Transaksi"
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 inline-flex justify-center items-center text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Tidak ada transaksi yang cocok dengan kriteria filter.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedTrx && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex justify-center items-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Detail Bukti Transaksi</h3>
              </div>
              <button 
                onClick={() => setSelectedTrx(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">ID Transaksi</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">{selectedTrx.id}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Nomor Struk Kasir</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedTrx.receiptNo}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Tanggal & Waktu
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  {new Date(selectedTrx.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nama Pelanggan
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTrx.memberName}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Nomor Telepon</span>
                <span className="font-mono text-slate-800 dark:text-slate-200 text-xs">{selectedTrx.memberPhone}</span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-slate-400" /> Lokasi Toko
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedTrx.storeName || 'Puri Jakarta'}</span>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">Tipe & Perubahan Poin</span>
                <span className={`font-extrabold text-base ${selectedTrx.type === 'EARN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  {selectedTrx.type === 'EARN' ? `+${selectedTrx.pointsDelta} Pts` : `${selectedTrx.pointsDelta} Pts`}
                </span>
              </div>

              {selectedTrx.voucherCode && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 flex justify-between items-center">
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">Kode Voucher Terkait</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{selectedTrx.voucherCode}</span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSelectedTrx(null)}
              className="w-full py-3 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors text-sm shadow-sm cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
