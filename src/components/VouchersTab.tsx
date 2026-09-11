import React, { useState } from 'react';
import { Voucher, StoreBranch, Transaction } from '../types';
import { 
  Ticket, 
  Plus, 
  Search, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Percent, 
  DollarSign, 
  Store,
  ChevronDown,
  Info,
  Copy,
  Check,
  Edit3,
  Image as ImageIcon
} from 'lucide-react';

interface VouchersTabProps {
  vouchers: Voucher[];
  stores: StoreBranch[];
  transactions?: Transaction[];
  onCreateVoucher: () => void;
  onEditVoucher?: (voucher: Voucher) => void;
  onToggleVoucherStatus: (voucherId: string) => void;
  isSkeletonLoading?: boolean;
}

export const VouchersTab: React.FC<VouchersTabProps> = ({
  vouchers,
  stores,
  transactions = [],
  onCreateVoucher,
  onEditVoucher,
  onToggleVoucherStatus,
  isSkeletonLoading = false
}) => {
  if (isSkeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filteredVouchers = vouchers.filter(v => {
    const matchesStatus = filterStatus === 'ALL' || v.status === filterStatus;
    const matchesSearch = 
      v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-purple-600" />
            <span>Master Voucher & Promo Campaigns</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and distribute digital coupons, discount vouchers, and exclusive store rewards for the Customer App.
          </p>
        </div>

        <button
          onClick={onCreateVoucher}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Create New Voucher</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search voucher title, code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {['ALL', 'ACTIVE', 'SCHEDULED', 'EXPIRED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === status
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Vouchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVouchers.map((voucher) => {
          const vClean = voucher.code.trim().toUpperCase().replace(/^VOUCHER-/, '');
          
          // Reconcile with any matching transactions across stores
          const matchingTrx = (transactions || []).filter(t => {
            const isRedeem = t.type === 'REDEEM' || t.receiptNo?.toUpperCase().startsWith('VOUCHER-') || (t.notes && t.notes.toLowerCase().includes('voucher'));
            if (!isRedeem) return false;
            const tCode = (t.voucherCode || t.receiptNo || '').replace(/^VOUCHER-/i, '').trim().toUpperCase();
            return tCode === vClean || vClean.includes(tCode) || (tCode && voucher.code.trim().toUpperCase().includes(tCode));
          });

          const effectiveUsed = Math.max(voucher.totalUsed || 0, matchingTrx.length);
          const effectiveClaimed = Math.max(voucher.totalClaimed || 0, effectiveUsed);
          const usagePercent = Math.min(100, Math.round((effectiveUsed / (voucher.maxUsageLimit || 1)) * 100));

          return (
            <div
              key={voucher.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Status and Scope Header */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    voucher.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {voucher.status}
                  </span>

                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Store className="w-3 h-3 text-slate-400" />
                    <span>{voucher.scope === 'ALL_STORES' ? 'All Indonesia' : 'Specific Mall'}</span>
                  </span>
                </div>

                {/* Voucher Title and Code Banner */}
                <div 
                  className="p-4 rounded-2xl text-white mb-4 relative overflow-hidden shadow-inner"
                  style={{ 
                    backgroundImage: voucher.imagePath ? `url('${voucher.imagePath}')` : 'linear-gradient(to right, #020617, #0f172a, #1e293b)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-slate-900/40 z-0"></div>
                  <div className="relative z-10">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-slate-300">
                      Watch Club Promotion
                    </div>
                    <div className="text-2xl font-bold text-amber-300 mt-1 drop-shadow-md">
                      {voucher.discountType === 'PERCENTAGE' ? `${voucher.discountValue}% OFF` : `Rp ${(voucher.discountValue || 0).toLocaleString('id-ID')}`}
                    </div>
                    <div className="text-xs text-slate-100 font-medium mt-0.5 truncate drop-shadow-md">
                      {voucher.title}
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/20 text-xs">
                      <span className="font-mono text-white font-bold bg-black/50 px-2 py-0.5 rounded">
                        {voucher.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleCopyCode(voucher.code)}
                          className="text-slate-200 hover:text-white flex items-center gap-1 text-[11px] transition-colors bg-black/30 hover:bg-black/40 px-2 py-1 rounded-lg"
                        >
                          {copiedCode === voucher.code ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Details & Limits */}
                <div className="space-y-2 text-xs text-slate-600 my-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Min. Belanja:</span>
                    <span className="font-semibold text-slate-800">
                      {voucher.minPurchase > 0 ? `Rp ${(voucher.minPurchase).toLocaleString('id-ID')}` : 'Tanpa Min. Belanja'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Batas Berlaku:</span>
                    <span className="font-semibold text-slate-800">{voucher.validUntil}</span>
                  </div>
                </div>

                {/* Progress bar of redemptions */}
                <div className="space-y-1.5 my-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500 font-medium">Terpakai: <strong>{effectiveUsed}</strong> / {voucher.maxUsageLimit}</span>
                    <span className="font-bold text-slate-700">{usagePercent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 rounded-full transition-all duration-500"
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="border-t border-slate-100 pt-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onToggleVoucherStatus(voucher.id)}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
                      voucher.status === 'ACTIVE' 
                        ? 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200' 
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {voucher.status === 'ACTIVE' ? 'Jeda Voucher' : 'Aktifkan'}
                  </button>

                  <button 
                    onClick={() => onEditVoucher?.(voucher)} 
                    className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit & Gambar</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {effectiveClaimed} Diklaim
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
