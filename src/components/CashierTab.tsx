import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Barcode, Camera, ShoppingCart, List, Tag, CheckCircle, AlertTriangle } from 'lucide-react';
import { Member, Transaction, StoreBranch } from '../types';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { TierBadge } from '../utils/tierBadge';

interface CashierTabProps {
  isSubmitting?: boolean;
  members: Member[];
  transactions: Transaction[];
  currentStore?: StoreBranch;
  onAddPoints: (memberId: string, amount: number, receiptNo: string) => void;
  onRedeemVoucher: (memberId: string, voucherCode: string) => void;
  onOpenCreateMember: () => void;
}

export const CashierTab: React.FC<CashierTabProps> = ({ members, transactions, currentStore, onAddPoints, onRedeemVoucher, onOpenCreateMember, isSubmitting }) => {
  const [searchInput, setSearchInput] = useState('');
  const [activeMember, setActiveMember] = useState<Member | null>(null);
  
  const [receiptInput, setReceiptInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotFoundOpen, setIsNotFoundOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isVoucherErrorOpen, setIsVoucherErrorOpen] = useState(false);
  const [voucherErrorMsg, setVoucherErrorMsg] = useState('');
  
  const [voucherInput, setVoucherInput] = useState('');
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState<string | null>(null);
  const voucherInputRef = useRef<HTMLInputElement>(null);

  const triggerScanFeedback = (msg: string) => {
    // 1. Haptic feedback if supported by device
    if (typeof window !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([120, 60, 120]);
      } catch (e) {}
    }
    // 2. Visual indicator feedback
    setScanSuccessFeedback(msg);
    setTimeout(() => {
      setScanSuccessFeedback(null);
    }, 3000);
  };

  const parsedAmount = parseInt(amountInput.replace(/\./g, '')) || 0;
  
  let multiplier = 1.0;
  if (activeMember) {
    if (activeMember.tier === 'BLACK') multiplier = 3.0;
    else if (activeMember.tier === 'DIAMOND') multiplier = 2.5;
    else if (activeMember.tier === 'PLATINUM') multiplier = 2.0;
    else if (activeMember.tier === 'GOLD') multiplier = 1.5;
  }
  const estimatedPoints = Math.floor(Math.floor(parsedAmount / 1000) * multiplier);


  const performSearch = (val: string) => {
    const code = val.trim();
    if (!code) return;
    
    if (code === '000') {
      setIsNotFoundOpen(true);
      setSearchInput('');
      return;
    }
    
    const cleanDigits = code.replace(/[^0-9]/g, '');
    const found = members.find(m => {
      const mCleanDigits = (m.phone || '').replace(/[^0-9]/g, '');
      return (
        (m.membershipId && m.membershipId.toLowerCase() === code.toLowerCase()) ||
        (m.phone && m.phone === code) ||
        (cleanDigits.length >= 4 && mCleanDigits.includes(cleanDigits)) ||
        (cleanDigits.length >= 4 && cleanDigits.includes(mCleanDigits)) ||
        (m.name && m.name.toLowerCase().includes(code.toLowerCase()))
      );
    });

    if (found) {
      setActiveMember(found);
      triggerScanFeedback(`Berhasil mendeteksi Barcode Member: ${found.name} (${found.membershipId})`);
    } else {
      setIsNotFoundOpen(true);
    }
    setSearchInput('');
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(searchInput);
    }
  };

  const handleAddPointsSubmit = () => {
    if (!activeMember || !receiptInput || parsedAmount <= 0) return;
    onAddPoints(activeMember.id, parsedAmount, receiptInput);
    setReceiptInput('');
    setAmountInput('');
    setActiveMember(null);
  };

  const executeClaimVoucher = (rawCode: string) => {
    const code = (rawCode || voucherInput).trim().toUpperCase();
    if (!code) {
      setVoucherErrorMsg('Silakan masukkan atau scan kode voucher terlebih dahulu.');
      setIsVoucherErrorOpen(true);
      return;
    }
    
    if (code === 'GAGAL') {
      setVoucherErrorMsg('Maaf, kode voucher ini sudah pernah digunakan atau tidak valid.');
      setIsVoucherErrorOpen(true);
    } else if (activeMember) {
      onRedeemVoucher(activeMember.id, code);
      setIsRedeemOpen(false);
      setVoucherInput('');
      triggerScanFeedback(`Voucher Barcode ${code} Terbaca & Berhasil Diklaim!`);
    } else {
      setVoucherErrorMsg('Pilih atau cari member terlebih dahulu sebelum klaim voucher.');
      setIsVoucherErrorOpen(true);
    }
  };

  const handleVoucherKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeClaimVoucher(voucherInput);
    }
  };

  // Barcode scanner automatic trigger: Detect barcode scanner rapid entry (ending with scan completion)
  useEffect(() => {
    if (!isRedeemOpen || !voucherInput) return;
    
    // If input matches known pattern or standard barcode scanner length (e.g. WTC-0826 or 8+ chars), auto-trigger after brief pause
    const clean = voucherInput.trim().toUpperCase();
    if (clean === 'WTC-0826' || clean === 'WC-WELCOME20' || clean === 'WC-15OFF-LTD' || clean.startsWith('VOUCH') || clean.length >= 8) {
      const timer = setTimeout(() => {
        if (isRedeemOpen && voucherInput.trim()) {
          executeClaimVoucher(voucherInput);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [voucherInput, isRedeemOpen]);

  // Focus voucher input when modal opens
  useEffect(() => {
    if (isRedeemOpen) {
      setTimeout(() => voucherInputRef.current?.focus(), 150);
    }
  }, [isRedeemOpen]);

  useEffect(() => {
    if (isScannerOpen) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
      scanner.render((decodedText) => {
        scanner.clear();
        setIsScannerOpen(false);
        const found = members.find(m => m.membershipId === decodedText || m.phone === decodedText);
        if (found) {
          setActiveMember(found);
          triggerScanFeedback(`Kamera Barcode Terbaca: ${found.name} (${found.membershipId})`);
        } else {
          setIsNotFoundOpen(true);
        }
      }, () => {});
      return () => { scanner.clear().catch(()=>{}) };
    }
  }, [isScannerOpen, members]);

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* 1. AREA PENCARIAN MEMBER */}
      <div className="bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-4 border-b border-slate-200 dark:border-slate-700 pb-3">
          <div>
            <span className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-base">
              <Search className="w-4 h-4 text-emerald-500" /> 1. Cari & Deteksi Member
            </span>
            <p className="text-[0.75rem] text-slate-500 dark:text-slate-400 mt-0.5">
              Tersinkronisasi 40 toko nasional &bull; Member dari cabang manapun dapat dilayani
            </p>
          </div>
          <button 
            onClick={onOpenCreateMember} 
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Buat Member Baru
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-slate-700 dark:text-slate-300 font-semibold text-[0.85rem] mb-2">Scan QR Code atau Ketik Nomor HP</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearch}
                className="w-full pl-11 pr-4 py-3 bg-emerald-50/70 dark:bg-slate-900 border-2 border-emerald-500 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                placeholder="Ketik No HP / Scan QR Code..."
                autoComplete="off"
              />
            </div>
            <button 
              type="button"
              onClick={() => performSearch(searchInput)}
              className="px-4 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-semibold hover:bg-emerald-700 transition-colors text-sm shrink-0"
              title="Cari Member"
            >
              <Search className="w-4 h-4 mr-1.5" /> Cari
            </button>
            <button 
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="w-12 bg-slate-900 dark:bg-slate-700 text-white rounded-lg flex justify-center items-center hover:bg-slate-800 dark:hover:bg-slate-600 transition-colors shrink-0"
              title="Buka Kamera Scanner"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>
          <small className="text-slate-500 dark:text-slate-400 text-[0.75rem] mt-1.5 block">*Tekan Enter atau klik 'Cari' setelah mengetik No HP / ID Member (Mencakup member seluruh 40 cabang toko).</small>
        </div>

        {activeMember && (
          <div className="mt-5 p-4 bg-slate-50 dark:bg-slate-900/80 rounded-xl border-l-4 border-emerald-500 flex justify-between items-center animate-fadeIn border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 dark:bg-emerald-600 text-white rounded-full flex justify-center items-center font-bold text-sm">
                {activeMember.name ? activeMember.name.substring(0, 2).toUpperCase() : 'MB'}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{activeMember.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">{activeMember.phone} &bull; {activeMember.membershipId}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <TierBadge tier={activeMember.tier} size="sm" />
                  <span className="text-[0.7rem] text-slate-600 dark:text-slate-300 font-medium bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded">
                    Toko Terdaftar: <strong>{activeMember.registeredStore || 'Puri Jakarta'}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-1">
              <div>
                <p className="text-[0.75rem] text-slate-500 dark:text-slate-400 font-medium">Total Poin</p>
                <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{(activeMember.points || 0).toLocaleString('id-ID')} Pts</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveMember(null)}
                className="text-[0.75rem] text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 underline transition-colors"
              >
                Ganti Member
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. AREA INPUT TRANSAKSI (Pure White Background) */}
      <div className={`bg-white dark:bg-slate-800 rounded-[20px] p-6 shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300 ${!activeMember ? 'opacity-70' : ''}`}>
        <div className="text-base font-bold mb-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
          <span className="flex items-center gap-2 text-slate-900 dark:text-white">
            <ShoppingCart className="w-4 h-4 text-emerald-500" /> 2. Input Transaksi
          </span>
          {!activeMember && (
            <span className="text-xs font-normal text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
              Pilih member terlebih dahulu
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold text-[0.85rem] mb-2">Nomor Struk (Receipt No)</label>
            <input 
              type="text" 
              value={receiptInput}
              disabled={!activeMember}
              onChange={(e) => setReceiptInput(e.target.value)}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-900/40"
              placeholder="Contoh: INV-00123"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-slate-700 dark:text-slate-300 font-semibold text-[0.85rem] mb-2">Nominal Belanja (Rp)</label>
            <input 
              type="text" 
              value={amountInput}
              disabled={!activeMember}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (!val) {
                  setAmountInput('');
                  return;
                }
                setAmountInput(parseInt(val).toLocaleString('id-ID'));
              }}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 dark:focus:border-emerald-500 disabled:bg-slate-100 dark:disabled:bg-slate-900/40"
              placeholder="Contoh: 500.000"
            />
          </div>
        </div>

        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 text-center my-4 bg-emerald-50 dark:bg-emerald-950/30 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
          +{estimatedPoints.toLocaleString('id-ID')} Pts
        </div>

        <div className="flex gap-3">
          <button 
            disabled={!activeMember || !receiptInput || parsedAmount <= 0}
            onClick={handleAddPointsSubmit}
            className="flex-1 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg py-3 font-bold disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors"
          >
            Submit & Tambah Poin
          </button>
          <button 
            disabled={!activeMember}
            onClick={() => setIsRedeemOpen(true)}
            className="flex-1 bg-white dark:bg-slate-800 border-2 border-emerald-600 text-emerald-700 dark:text-emerald-400 rounded-lg py-3 font-bold hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Tag className="w-4 h-4" /> Klaim Voucher
          </button>
        </div>
      </div>

      {/* 3. AREA RIWAYAT TRANSAKSI TERKINI */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[20px] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex flex-wrap justify-between items-center gap-3">
          <div>
            <div className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
              <List className="w-4 h-4 text-emerald-500" /> Aktivitas Transaksi Terkini ({currentStore?.name || 'Cabang Ini'})
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hanya menampilkan aktivitas transaksi yang diproses di kasir cabang <strong>{currentStore?.name || 'ini'}</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1 font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              {transactions.length} Transaksi Khusus Toko Ini
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
                <th className="py-3.5 px-4 text-[0.8rem] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Tanggal & Waktu</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">No HP / ID</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Nama Member</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">No Struk</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Aksi</th>
                <th className="py-3.5 px-4 text-[0.8rem] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Poin</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700/60">
              {transactions.slice(0, 10).map(trx => (
                <tr key={trx.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                    {new Date(trx.timestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-xs">{trx.memberPhone || '-'}</td>
                  <td className="py-3.5 px-4 text-slate-900 dark:text-white font-medium">{trx.memberName}</td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono text-xs">{trx.receiptNo}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      trx.type === 'EARN' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {trx.type === 'EARN' ? 'Penambahan Poin' : 'Klaim Voucher Diskon'}
                    </span>
                  </td>
                  <td className={`py-3.5 px-4 font-bold ${trx.type === 'EARN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {trx.type === 'EARN' ? '+' : ''}{trx.pointsDelta} Pts
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 dark:text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <p className="font-semibold text-slate-600 dark:text-slate-300">Belum ada aktivitas transaksi di cabang {currentStore?.name || 'ini'} pada shift ini.</p>
                      <p className="text-xs text-slate-400">Transaksi baru yang diproses kasir di cabang ini akan langsung tercatat dan terlihat di sini.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL SCANNER KAMERA */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[20px] p-6 max-w-sm w-full text-center border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Pindai QR Code Member</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Arahkan layar HP customer ke kamera ini.</p>
            <div id="reader" className="w-full mb-4 rounded-xl overflow-hidden border-2 border-dashed border-slate-300 dark:border-slate-600"></div>
            <button onClick={() => setIsScannerOpen(false)} className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL NOT FOUND */}
      {isNotFoundOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[20px] p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-500 rounded-full flex justify-center items-center mx-auto mb-4 text-3xl font-bold">!</div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Member Tidak Ditemukan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Nomor HP atau ID Member tidak terdaftar di sistem. Silakan daftarkan member baru.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsNotFoundOpen(false)} className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">
                Kembali
              </button>
              <button onClick={() => { setIsNotFoundOpen(false); onOpenCreateMember(); }} className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700">
                Daftar Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REDEEM VOUCHER DENGAN TOMBOL KLAIM & SCANNER OTOMATIS */}
      {isRedeemOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-[24px] p-7 max-w-md w-full text-center border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <Tag className="w-6 h-6" />
            </div>
            
            <h3 className="font-bold text-xl mb-1 text-slate-900 dark:text-white">Klaim & Redeem Voucher</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Masukkan kode voucher atau pindai barcode dari layar handphone pelanggan.
            </p>
            
            {activeMember && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-left flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pelanggan Aktif</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{activeMember.name} ({activeMember.phone})</p>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded">
                  {(activeMember.points || 0).toLocaleString('id-ID')} Poin
                </span>
              </div>
            )}

            <div className="space-y-3 mb-6">
              <div className="relative">
                <Barcode className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  ref={voucherInputRef}
                  type="text" 
                  value={voucherInput}
                  onChange={(e) => setVoucherInput(e.target.value)}
                  onKeyDown={handleVoucherKeyDown}
                  className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-center font-mono font-bold text-lg tracking-wider"
                  placeholder="Contoh: WTC-0826"
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVoucherInput('WTC-0826')}
                  className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  WTC-0826 (17% Promo Kemerdekaan)
                </button>
                <button
                  type="button"
                  onClick={() => setVoucherInput('WC-WELCOME20')}
                  className="flex-1 py-1.5 px-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  WC-WELCOME20 (20% Welcome)
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => setIsRedeemOpen(false)} 
                className="flex-1 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Batal
              </button>
              <button 
                type="button"
                disabled={!voucherInput.trim()}
                onClick={() => executeClaimVoucher(voucherInput)}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" /> Klaim
              </button>
            </div>
            <p className="text-[0.75rem] text-slate-400 dark:text-slate-500 mt-3">
              *Scanner barcode akan otomatis memicu klaim saat selesai membaca kode, atau tekan Enter.
            </p>
          </div>
        </div>
      )}

      {/* MODAL VOUCHER ERROR */}
      {isVoucherErrorOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[20px] p-8 max-w-sm w-full text-center border border-slate-200 dark:border-slate-700">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 text-red-500 rounded-full flex justify-center items-center mx-auto mb-4 text-3xl font-bold">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">Klaim Gagal</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {voucherErrorMsg || 'Maaf, kode voucher ini sudah pernah digunakan sebelumnya atau tidak valid.'}
            </p>
            <button 
              onClick={() => setIsVoucherErrorOpen(false)} 
              className="px-8 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
