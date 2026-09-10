import fs from 'fs';

let content = fs.readFileSync('src/components/CreateVoucherModal.tsx', 'utf8');

const target1 = `interface CreateVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreBranch[];
  onCreateVoucher: (newVoucher: Omit<Voucher, 'id' | 'totalClaimed' | 'totalUsed'>) => void;
}`;

const rep1 = `interface CreateVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  stores: StoreBranch[];
  onCreateVoucher: (newVoucher: Omit<Voucher, 'id' | 'totalClaimed' | 'totalUsed'>) => void;
  existingVoucher?: Voucher | null;
}`;

content = content.replace(target1, rep1);

const target2 = `  onCreateVoucher,
}) => {
  const [code, setCode] = useState('');`;

const rep2 = `  onCreateVoucher,
  existingVoucher,
}) => {
  const [code, setCode] = useState('');`;

content = content.replace(target2, rep2);

const target3 = `  const [error, setError] = useState('');

  if (!isOpen) return null;`;

const rep3 = `  const [error, setError] = useState('');

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
      setTermsText(existingVoucher.terms?.join('\\n') || '');
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
      setTermsText('Valid for Watch purchases at Watch Clubs throughout Indonesia.\\nValid with min. purchase of IDR 1,500,000.\\nNot valid for Smart Watches.\\nCannot combined with other promotions.');
    }
  }, [existingVoucher, isOpen]);

  if (!isOpen) return null;`;
content = content.replace(target3, rep3);

const target4 = `        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Create Campaign</h2>
              <p className="text-xs text-slate-500">Deploy a new national or branch-specific voucher</p>
            </div>
          </div>`;

const rep4 = `        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <Ticket className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{existingVoucher ? 'Edit Campaign' : 'Create Campaign'}</h2>
              <p className="text-xs text-slate-500">{existingVoucher ? 'Update voucher details and background' : 'Deploy a new national or branch-specific voucher'}</p>
            </div>
          </div>`;
content = content.replace(target4, rep4);

const target5 = `          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-slate-900/20"
            >
              Deploy Campaign
            </button>
          </div>`;

const rep5 = `          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-slate-900/20"
            >
              {existingVoucher ? 'Update Campaign' : 'Deploy Campaign'}
            </button>
          </div>`;
content = content.replace(target5, rep5);


fs.writeFileSync('src/components/CreateVoucherModal.tsx', content);

