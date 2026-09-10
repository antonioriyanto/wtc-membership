import React, { useState, useRef } from 'react';
import { StoreBranch, Voucher } from '../types';
import { 
  X, 
  Ticket, 
  Sparkles, 
  AlertCircle, 
  UploadCloud, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  Link as LinkIcon,
  Store,
  Eye
} from 'lucide-react';
import { compressImage } from '../utils/imageCompression';

interface CreateVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreBranch[];
  onCreateVoucher: (newVoucher: Omit<Voucher, 'id' | 'totalClaimed' | 'totalUsed'>) => void;
  existingVoucher?: Voucher | null;
}

// Preset watch background images for instant luxury branding
const PRESET_BANNERS = [
  {
    name: 'Luxury Chrono',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&q=80&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&q=80&auto=format&fit=crop'
  },
  {
    name: 'Gold Heritage',
    url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=1200&q=80&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=120&q=80&auto=format&fit=crop'
  },
  {
    name: 'Midnight Black',
    url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&q=80&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=120&q=80&auto=format&fit=crop'
  },
  {
    name: 'Sport Diver',
    url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&q=80&auto=format&fit=crop',
    thumbnail: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=120&q=80&auto=format&fit=crop'
  }
];

export const CreateVoucherModal: React.FC<CreateVoucherModalProps> = ({
  isOpen,
  onClose,
  stores,
  onCreateVoucher,
  existingVoucher,
}) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [minPurchase, setMinPurchase] = useState<number>(1500000);
  const [validUntil, setValidUntil] = useState<string>('2026-12-31');
  const [scope, setScope] = useState<'ALL_STORES' | 'SPECIFIC_STORES'>('ALL_STORES');
  const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
  const [maxUsageLimit, setMaxUsageLimit] = useState<number>(1000);
  const [imagePath, setImagePath] = useState<string>('');
  const [termsText, setTermsText] = useState<string>(
    'Valid for Watch purchases at Watch Clubs throughout Indonesia.\nValid with min. purchase of IDR 1,500,000.\nNot valid for Smart Watches.\nCannot combined with other promotions.'
  );
  
  // Image upload states
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [uploadSuccessInfo, setUploadSuccessInfo] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [error, setError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (existingVoucher) {
      setCode(existingVoucher.code);
      setTitle(existingVoucher.title);
      setSubtitle(existingVoucher.subtitle || '');
      setDiscountType(existingVoucher.discountType);
      setDiscountValue(existingVoucher.discountValue);
      setMinPurchase(existingVoucher.minPurchase);
      setValidUntil(existingVoucher.validUntil);
      setScope(existingVoucher.scope);
      setSelectedStoreIds(existingVoucher.applicableStoreIds || []);
      setMaxUsageLimit(existingVoucher.maxUsageLimit);
      setImagePath(existingVoucher.imagePath || '');
      setTermsText(existingVoucher.terms?.join('\n') || '');
      setUploadSuccessInfo(null);
    } else {
      setCode('');
      setTitle('');
      setSubtitle('');
      setDiscountType('PERCENTAGE');
      setDiscountValue(20);
      setMinPurchase(1500000);
      setValidUntil('2026-12-31');
      setScope('ALL_STORES');
      setSelectedStoreIds([]);
      setMaxUsageLimit(1000);
      setImagePath('');
      setTermsText('Valid for Watch purchases at Watch Clubs throughout Indonesia.\nValid with min. purchase of IDR 1,500,000.\nNot valid for Smart Watches.\nCannot combined with other promotions.');
      setUploadSuccessInfo(null);
    }
    setError('');
  }, [existingVoucher, isOpen]);

  if (!isOpen) return null;

  const processAndUploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file gambar (JPG, PNG, WebP, GIF).');
      return;
    }

    setIsProcessingImage(true);
    setError('');
    setUploadSuccessInfo(null);

    try {
      // 1. Client-side compress to max 1280px maintaining aspect ratio & high quality
      const compressed = await compressImage(file, 1280, 720, 0.85);
      
      const origSizeMb = (compressed.originalSize / (1024 * 1024)).toFixed(1);
      const compSizeKb = Math.round(compressed.compressedSize / 1024);

      // 2. Try uploading the compressed blob to the server /api/upload
      const formData = new FormData();
      formData.append('image', compressed.blob, file.name.replace(/\.[^/.]+$/, "") + ".jpg");

      let uploadedUrl: string | null = null;

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            uploadedUrl = data.url;
          }
        }
      } catch (uploadErr) {
        console.warn('Server upload endpoint not responding, using compressed DataURL fallback:', uploadErr);
      }

      // 3. Resilient fallback: If server upload did not return URL, use compressed Data URL directly
      const finalImage = uploadedUrl || compressed.dataUrl;
      setImagePath(finalImage);

      const sizeLabel = compressed.originalSize > 1024 * 1024 
        ? `${origSizeMb} MB → ${compSizeKb} KB` 
        : `${compSizeKb} KB`;

      setUploadSuccessInfo(`Gambar berhasil diproses (${sizeLabel})`);
    } catch (err: any) {
      console.error('Image processing error:', err);
      setError(err?.message || 'Gagal memproses gambar. Pastikan format gambar valid.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
    // reset input so the same file can be re-selected if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processAndUploadFile(file);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) return;
    setImagePath(customUrl.trim());
    setUploadSuccessInfo('URL gambar berhasil diterapkan');
    setShowUrlInput(false);
    setCustomUrl('');
  };

  const handleRemoveImage = () => {
    setImagePath('');
    setUploadSuccessInfo(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Kode voucher wajib diisi.');
      return;
    }
    if (!title.trim()) {
      setError('Judul voucher wajib diisi.');
      return;
    }
    if (discountValue <= 0) {
      setError('Nilai diskon harus lebih besar dari 0.');
      return;
    }

    const termsArray = termsText.split('\n').filter(t => t.trim().length > 0);

    onCreateVoucher({
      code: code.trim().toUpperCase(),
      title: title.trim(),
      subtitle: subtitle.trim() || 'Exclusive Member Reward Voucher',
      discountType,
      discountValue,
      minPurchase,
      validFrom: new Date().toISOString().slice(0, 10),
      validUntil,
      scope,
      applicableStoreIds: scope === 'SPECIFIC_STORES' ? selectedStoreIds : [],
      maxUsageLimit,
      status: 'ACTIVE',
      imagePath: imagePath || undefined,
      terms: termsArray.length > 0 ? termsArray : ['Valid at Watch Club stores throughout Indonesia.']
    });

    onClose();
  };

  const handleStoreToggle = (storeId: string) => {
    if (selectedStoreIds.includes(storeId)) {
      setSelectedStoreIds(selectedStoreIds.filter(id => id !== storeId));
    } else {
      setSelectedStoreIds([...selectedStoreIds, storeId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">
                {existingVoucher ? 'Edit Promo Voucher' : 'Create New Promo Voucher'}
              </h3>
              <p className="text-xs text-slate-500">Distribusi diskon loyalitas jaringan 41+ cabang Watch Club</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable form content */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 mt-4 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* LIVE VOUCHER CARD PREVIEW */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                Live Card Preview
              </span>
              {imagePath ? (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Gambar Aktif
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400">
                  Background Default (Gradient)
                </span>
              )}
            </div>

            <div 
              className="rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden shadow-lg border border-slate-700/50 min-h-[120px] transition-all duration-300"
              style={{ 
                backgroundImage: imagePath ? `url('${imagePath}')` : 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #1e293b 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] z-0"></div>
              
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 font-mono">
                      WATCH CLUB INDONESIA
                    </span>
                    <h4 className="text-xl sm:text-2xl font-black text-white mt-0.5 drop-shadow-md">
                      {discountType === 'PERCENTAGE' 
                        ? `${discountValue || 0}% OFF` 
                        : `Rp ${(discountValue || 0).toLocaleString('id-ID')}`}
                    </h4>
                    <p className="text-xs text-slate-200 font-medium line-clamp-1 mt-0.5">
                      {title || 'Judul Promo Voucher'}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {scope === 'ALL_STORES' ? 'Semua Toko' : `${selectedStoreIds.length} Cabang`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/20 text-xs font-mono">
                  <span className="bg-black/50 px-2.5 py-1 rounded-lg font-bold text-amber-200 tracking-wider">
                    {code || 'WC-PROMO'}
                  </span>
                  <span className="text-[11px] text-slate-300">
                    s/d {validUntil ? new Date(validUntil).toLocaleDateString('id-ID') : '31 Des 2026'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <form id="voucherForm" onSubmit={handleSubmit} className="space-y-4">
            {/* IMAGE UPLOAD & BANNER SECTION */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Upload Background Gambar Voucher
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Otomatis dikompres optimal tanpa merusak kualitas visual
                  </p>
                </div>

                {imagePath && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Gambar</span>
                  </button>
                )}
              </div>

              {/* DRAG & DROP UPLOAD ZONE */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-amber-500 bg-amber-50/70 scale-[0.99]'
                    : imagePath 
                      ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400' 
                      : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isProcessingImage ? (
                  <div className="py-4 flex flex-col items-center justify-center gap-2 text-amber-700">
                    <Loader2 className="w-7 h-7 animate-spin text-amber-600" />
                    <span className="text-xs font-bold">Mengompres & memproses gambar...</span>
                    <span className="text-[11px] text-slate-500">Mohon tunggu sebentar</span>
                  </div>
                ) : imagePath ? (
                  <div className="flex items-center justify-center gap-3 py-1">
                    <div className="w-14 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-xs">
                      <img 
                        src={imagePath} 
                        alt="Preview thumbnail" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Gambar Siap Digunakan</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {uploadSuccessInfo || 'Klik atau seret file lain untuk mengganti'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-3 flex flex-col items-center justify-center gap-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                      <UploadCloud className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Seret & Lepas Gambar ke Sini, atau <span className="text-amber-600 underline">Pilih File</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Mendukung JPG, PNG, WebP (berkas besar akan dikompres otomatis)
                    </p>
                  </div>
                )}
              </div>

              {/* PRESETS & URL ALTERNATIVE */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Preset:</span>
                  <div className="flex items-center gap-1">
                    {PRESET_BANNERS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImagePath(preset.url);
                          setUploadSuccessInfo(`Preset "${preset.name}" diterapkan`);
                        }}
                        className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition-colors shadow-2xs"
                        title={`Gunakan template ${preset.name}`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span>{showUrlInput ? 'Tutup URL Input' : 'Gunakan Link URL'}</span>
                </button>
              </div>

              {showUrlInput && (
                <div className="pt-2 flex items-center gap-2 animate-fadeIn">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Terapkan
                  </button>
                </div>
              )}
            </div>

            {/* VOUCHER CODE & DISCOUNT TYPE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Kode Voucher Promo
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  placeholder="Contoh: WC-SPECIAL-25"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipe Diskon
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    % Persentase
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      discountType === 'FIXED'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Rp Potongan Nominal
                  </button>
                </div>
              </div>
            </div>

            {/* TITLE & DISCOUNT VALUE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Judul Voucher
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: 20% OFF Swiss Mechanical Collection"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {discountType === 'PERCENTAGE' ? 'Nilai Diskon (%)' : 'Besaran Diskon (Rp)'}
                </label>
                <input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 shadow-2xs font-mono"
                />
              </div>
            </div>

            {/* MIN PURCHASE & EXPIRATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Min. Belanja Transaksi (Rp)
                </label>
                <input
                  type="number"
                  value={minPurchase}
                  onChange={(e) => setMinPurchase(parseInt(e.target.value) || 0)}
                  placeholder="0 jika tanpa minimum"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 shadow-2xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Batas Berlaku Voucher (Valid Until)
                </label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 shadow-2xs"
                />
              </div>
            </div>

            {/* SCOPE STORES */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Cakupan Toko / Store Branches
              </label>
              <div className="grid grid-cols-2 gap-3 mb-2">
                <button
                  type="button"
                  onClick={() => setScope('ALL_STORES')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    scope === 'ALL_STORES'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua 40+ Toko Indonesia
                </button>
                <button
                  type="button"
                  onClick={() => setScope('SPECIFIC_STORES')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    scope === 'SPECIFIC_STORES'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Pilih Cabang Khusus ({selectedStoreIds.length})
                </button>
              </div>

              {scope === 'SPECIFIC_STORES' && (
                <div className="max-h-36 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 animate-fadeIn">
                  {stores.map(store => (
                    <label key={store.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer hover:bg-slate-100/80 p-1 rounded-lg transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedStoreIds.includes(store.id)}
                        onChange={() => handleStoreToggle(store.id)}
                        className="accent-slate-900 rounded"
                      />
                      <span className="font-medium">{store.name}</span>
                      <span className="text-slate-400 font-normal">({store.city})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* TERMS AND CONDITIONS */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Syarat & Ketentuan (Satu baris per poin)
              </label>
              <textarea
                rows={3}
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 font-mono shadow-2xs"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 shrink-0 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="voucherForm"
            disabled={isProcessingImage}
            className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-md transition-all flex items-center gap-2 ${
              isProcessingImage 
                ? 'bg-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {isProcessingImage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Memproses Gambar...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{existingVoucher ? 'Simpan Perubahan Voucher' : 'Deploy Voucher to Network'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
