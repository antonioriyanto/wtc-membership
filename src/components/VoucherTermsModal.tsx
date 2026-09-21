import React, { useState, useEffect } from 'react';
import { Voucher } from '../types';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  Calendar, 
  Store, 
  ShoppingBag, 
  Tag, 
  Copy, 
  Check, 
  ShieldCheck, 
  QrCode,
  AlertCircle
} from 'lucide-react';

export interface VoucherTermsModalProps {
  voucher: Voucher | null;
  onClose: () => void;
  onUseNow?: (voucher: Voucher) => void;
}

export const VoucherTermsModal: React.FC<VoucherTermsModalProps> = ({
  voucher,
  onClose,
  onUseNow
}) => {
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (voucher) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [voucher, onClose]);

  if (!voucher) return null;

  const handleCopyCode = () => {
    if (!voucher.code) return;
    navigator.clipboard.writeText(voucher.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Comprehensive fallback terms if voucher.terms is empty or unspecified
  const termsList: string[] = voucher.terms && voucher.terms.length > 0
    ? voucher.terms
    : [
        'Voucher berlaku untuk pembelian jam tangan original, strap, dan aksesori resmi di seluruh boutique Watch Club Indonesia.',
        `Wajib menunjukkan QR Code voucher kepada staf kasir sebelum proses pembayaran dicetak pada mesin POS.`,
        voucher.minPurchase && voucher.minPurchase > 0
          ? `Berlaku dengan minimum transaksi pembelanjaan senilai Rp ${voucher.minPurchase.toLocaleString('id-ID')}.`
          : 'Berlaku tanpa minimum transaksi pembelanjaan.',
        'Hanya dapat digunakan untuk 1 (satu) kali transaksi dan tidak dapat diuangkan (non-refundable).',
        'Tidak dapat digabungkan dengan promo voucher sejenis lainnya dalam 1 transaksi yang sama.',
        `Masa aktif voucher berlaku hingga ${voucher.validUntil || 'tanggal kadaluarsa yang tercantum'}. Voucher yang telah melewati batas waktu tidak dapat diperpanjang.`,
        'Watch Club berhak melakukan verifikasi identitas member dan menolak penggunaan voucher jika ditemukan indikasi kecurangan atau manipulasi sistem.'
      ];

  const discountFormatted = voucher.discountType === 'PERCENTAGE'
    ? `${voucher.discountValue}% OFF`
    : `Rp ${(voucher.discountValue || 0).toLocaleString('id-ID')}`;

  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-3xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-neutral-100 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-900/90">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-amber-600 dark:text-amber-400">
                  Terms & Conditions
                </span>
                <span className="text-neutral-300 dark:text-neutral-600">•</span>
                <span className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
                  Syarat & Ketentuan Resmi
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white leading-tight truncate">
                {voucher.title}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-200/60 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:text-neutral-300 transition-colors flex-shrink-0 cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5 text-neutral-700 dark:text-neutral-300">
          {/* Voucher Summary Card Highlight */}
          <div 
            className="relative rounded-2xl p-5 text-white overflow-hidden shadow-md"
            style={{
              backgroundImage: voucher.imagePath 
                ? `url('${voucher.imagePath}')` 
                : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-black/60 z-0"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-end gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-amber-300 uppercase drop-shadow-sm">
                  {voucher.subtitle || 'VOUCHER WATCH CLUB'}
                </p>
                <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mt-1 drop-shadow-md">
                  {discountFormatted}
                </div>
                <p className="text-sm font-semibold text-white/95 mt-1 drop-shadow-sm">
                  {voucher.title}
                </p>
              </div>

              {/* Voucher Code Copy Pill */}
              <div className="flex flex-col items-start sm:items-end gap-1 mt-2 sm:mt-0">
                <span className="text-[10px] uppercase font-bold text-white/70 tracking-wider">
                  Kode Voucher
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white text-xs font-mono font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                  title="Salin Kode Voucher"
                >
                  <span>{voucher.code}</span>
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-white/80" />
                  )}
                </button>
                {copied && (
                  <span className="text-[9.5px] text-emerald-300 font-semibold">Tersalin!</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">Masa Berlaku</p>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5">
                  s.d. {voucher.validUntil || 'Tidak terbatas'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 flex items-start gap-2.5">
              <ShoppingBag className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">Min. Belanja</p>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5">
                  {voucher.minPurchase && voucher.minPurchase > 0 
                    ? `Rp ${voucher.minPurchase.toLocaleString('id-ID')}` 
                    : 'Tanpa Minimum'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 flex items-start gap-2.5">
              <Store className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">Berlaku di Gerai</p>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5">
                  {voucher.scope === 'SPECIFIC_STORES' ? 'Store Tertentu' : 'Seluruh Watch Club (40+ Store)'}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/10 flex items-start gap-2.5">
              <Tag className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] uppercase font-bold text-neutral-400 dark:text-neutral-500">Tipe Potongan</p>
                <p className="font-semibold text-neutral-800 dark:text-neutral-100 mt-0.5">
                  {voucher.discountType === 'PERCENTAGE' ? `Diskon Persentase (${voucher.discountValue}%)` : 'Potongan Langsung (Nominal)'}
                </p>
              </div>
            </div>
          </div>

          {/* Full Terms & Conditions Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                Syarat & Ketentuan Penggunaan (S&K)
              </h4>
            </div>
            
            <div className="bg-neutral-50 dark:bg-white/5 rounded-2xl p-4 border border-neutral-100 dark:border-white/10">
              <ul className="space-y-3">
                {termsList.map((term, index) => (
                  <li key={index} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{term}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* How to Redeem Step-by-Step */}
          <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs sm:text-sm text-neutral-700 dark:text-neutral-200">
            <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-300 mb-2 text-xs uppercase tracking-wider">
              <QrCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Cara Penukaran Voucher di Kasir</span>
            </div>
            <ol className="space-y-1.5 list-decimal list-inside text-neutral-600 dark:text-neutral-300 text-xs">
              <li>Pilih jam tangan atau aksesori favorit Anda di boutique Watch Club.</li>
              <li>Ketuk tombol <strong>"Gunakan Voucher Sekarang"</strong> untuk memunculkan QR Code voucher.</li>
              <li>Tunjukkan QR Code voucher kepada staf kasir sebelum menyelesaikan pembayaran.</li>
              <li>Kasir akan memindai QR Code dan potongan voucher otomatis diterapkan pada struk belanja Anda.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-100 dark:border-white/10 bg-neutral-50/70 dark:bg-neutral-900/90 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-700 dark:text-neutral-300 font-bold text-sm transition-colors cursor-pointer text-center"
          >
            Tutup
          </button>
          
          {onUseNow && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onUseNow(voucher);
              }}
              className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              <span>Gunakan Voucher Sekarang</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
