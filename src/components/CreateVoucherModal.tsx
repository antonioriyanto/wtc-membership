import React, { useState } from 'react';
import { StoreBranch, Voucher } from '../types';
import { X, Ticket, Sparkles, AlertCircle } from 'lucide-react';

interface CreateVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreBranch[];
  onCreateVoucher: (newVoucher: Omit<Voucher, 'id' | 'totalClaimed' | 'totalUsed'>) => void;
  existingVoucher?: Voucher | null;
}

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
  const [error, setError] = useState('');

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
    }
  }, [existingVoucher, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Voucher code is required.');
      return;
    }
    if (!title.trim()) {
      setError('Voucher title is required.');
      return;
    }
    if (discountValue <= 0) {
      setError('Discount value must be greater than zero.');
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
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Create New Promo Voucher</h3>
              <p className="text-xs text-slate-500">Distribute national or mall-exclusive loyalty discounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Voucher Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="E.g. WC-SPECIAL-25"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Discount Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('PERCENTAGE')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    discountType === 'PERCENTAGE'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  % Percentage
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('FIXED')}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    discountType === 'FIXED'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  Rp Nominal
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Voucher Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g. 20% OFF Next Purchase"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                {discountType === 'PERCENTAGE' ? 'Discount Percentage (%)' : 'Discount Amount (Rp)'}
              </label>
              <input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(parseInt(e.target.value) || 0)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Upload Background Image (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const formData = new FormData();
                  formData.append('image', file);
                  try {
                    const res = await fetch('/api/upload', {
                      method: 'POST',
                      body: formData,
                    });
                    const data = await res.json();
                    if (data.url) {
                      setImagePath(data.url);
                    }
                  } catch (err) {
                    setError('Failed to upload image.');
                  }
                }}
                className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Min. Purchase Spend (IDR)
              </label>
              <input
                type="number"
                value={minPurchase}
                onChange={(e) => setMinPurchase(parseInt(e.target.value) || 0)}
                placeholder="0 for no minimum"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Valid Expiration Date
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
              />
            </div>
          </div>

          {/* Scope: All stores vs Specific */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Applicable Store Branches
            </label>
            <div className="grid grid-cols-2 gap-3 mb-2">
              <button
                type="button"
                onClick={() => setScope('ALL_STORES')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  scope === 'ALL_STORES'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                All 40+ Indonesian Stores
              </button>
              <button
                type="button"
                onClick={() => setScope('SPECIFIC_STORES')}
                className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                  scope === 'SPECIFIC_STORES'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Select Specific Branches
              </button>
            </div>

            {scope === 'SPECIFIC_STORES' && (
              <div className="max-h-32 overflow-y-auto p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                {stores.map(store => (
                  <label key={store.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStoreIds.includes(store.id)}
                      onChange={() => handleStoreToggle(store.id)}
                      className="accent-slate-900"
                    />
                    <span>{store.name} ({store.city})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Terms and Conditions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Terms & Conditions (One per line)
            </label>
            <textarea
              rows={3}
              value={termsText}
              onChange={(e) => setTermsText(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800 font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Deploy Voucher to Network</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
