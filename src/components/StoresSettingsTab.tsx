import React, { useState } from 'react';
import { StoreBranch } from '../types';
import { useCustomDialog } from './CustomDialogProvider';
import { Store, Plus, Search, Edit3, Trash2, MapPin, Phone, Mail, Clock, CheckCircle, AlertTriangle, ArrowLeft, Save, Receipt, Layers } from 'lucide-react';

interface StoresSettingsTabProps {
  stores: StoreBranch[];
  setStores: React.Dispatch<React.SetStateAction<StoreBranch[]>>;
  onViewTransactions?: (store: StoreBranch | null) => void;
  isSkeletonLoading?: boolean;
}

export const StoresSettingsTab: React.FC<StoresSettingsTabProps> = ({ stores, setStores, onViewTransactions, isSkeletonLoading = false }) => {
  const { showConfirm } = useCustomDialog();
  if (isSkeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-10 w-36 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-64 bg-slate-200 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  
  // 'list' | 'create' | 'edit'
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

  // Form state for create / edit
  const [formData, setFormData] = useState<Partial<StoreBranch>>({
    code: 'WTC-' + Math.floor(100 + Math.random() * 900),
    name: '',
    mallName: '',
    city: 'Jakarta',
    region: 'Jabodetabek',
    address: '',
    email: '',
    whatsapp: '+628123456789',
    managerName: '',
    cashierCount: 3,
    status: 'ONLINE',
    operatingHours: '10:00 - 22:00 WIB',
    description: 'Official Watch Club boutique offering luxury timepieces and certified maintenance.'
  });

  const filteredStores = stores.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.mallName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = selectedRegion === 'ALL' || s.region === selectedRegion;
    return matchesSearch && matchesRegion;
  });

  const handleOpenCreate = () => {
    setFormData({
      code: 'WTC-' + Math.floor(100 + Math.random() * 900),
      name: '',
      mallName: '',
      city: 'Jakarta',
      region: 'Jabodetabek',
      address: '',
      email: '',
      whatsapp: '+628123456789',
      managerName: '',
      cashierCount: 3,
      status: 'ONLINE',
      operatingHours: '10:00 - 22:00 WIB',
      description: 'Official Watch Club boutique offering luxury timepieces.'
    });
    setMode('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEdit = (store: StoreBranch) => {
    setFormData({ ...store });
    setEditingStoreId(store.id);
    setMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mallName) return;

    if (mode === 'create') {
      const created: StoreBranch = {
        id: 'store_' + Date.now(),
        code: formData.code || 'WTC-' + Math.floor(100 + Math.random() * 900),
        name: formData.name || '',
        mallName: formData.mallName || '',
        city: formData.city || 'Jakarta',
        region: (formData.region as any) || 'Jabodetabek',
        address: formData.address || '',
        email: formData.email || 'contact@watchclub.co.id',
        whatsapp: formData.whatsapp || '+628123456789',
        managerName: formData.managerName || 'Store Manager',
        cashierCount: Number(formData.cashierCount) || 3,
        status: (formData.status as any) || 'ONLINE',
        todayTransactions: 0,
        todayRevenue: 0,
        todayPointsIssued: 0,
        activePromosCount: 2,
        operatingHours: formData.operatingHours || '10:00 - 22:00 WIB',
        description: formData.description || 'Official Watch Club boutique.'
      };
      setStores([created, ...stores]);
    } else if (mode === 'edit' && editingStoreId) {
      setStores(stores.map(s => s.id === editingStoreId ? { ...s, ...formData } as StoreBranch : s));
    }

    setMode('list');
    setEditingStoreId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteStore = (id: string) => {
    const storeObj = stores.find(s => s.id === id);
    showConfirm(
      `Hapus cabang store ${storeObj?.name || id} secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      'Konfirmasi Hapus Cabang',
      () => setStores(stores.filter(s => s.id !== id)),
      'Ya, Hapus',
      'Batal'
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Store className="w-6 h-6 text-emerald-500" />
            Store & Branch Settings (HO Management)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage all Watch Club store branches, operational statuses, customer app profiles, operational hours, and dashboard configurations directly from the top.
          </p>
        </div>
        {mode === 'list' && (
          <div className="flex items-center gap-2 shrink-0">
            {onViewTransactions && (
              <button
                id="stores-tab-view-all-transactions-btn"
                onClick={() => onViewTransactions(null)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Receipt className="w-4 h-4" /> Transaksi Nasional (41 Cabang)
              </button>
            )}
            <button
              onClick={handleOpenCreate}
              className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Branch
            </button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT FORM AT THE TOP */}
      {mode !== 'list' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-900 dark:border-slate-100 shadow-xl overflow-hidden animate-slideDown">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('list')}
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h2 className="text-base font-bold">
                {mode === 'create' ? '✨ Add New Store Branch' : `✏️ Edit Branch: ${formData.name || 'Store'}`}
              </h2>
            </div>
            <span className="text-xs text-slate-300 font-mono">Form displayed at top for quick editing</span>
          </div>

          <form onSubmit={handleSaveStore} className="p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Store Code</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Store Name / Branch</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="e.g. Senayan City"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Mall / Building Name</label>
                <input
                  type="text"
                  value={formData.mallName || ''}
                  onChange={(e) => setFormData({ ...formData, mallName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="e.g. Senayan City Mall, Ground Floor"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Region</label>
                <select
                  value={formData.region || 'Jabodetabek'}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  {['Jabodetabek', 'Jawa Barat', 'Jawa Tengah & DIY', 'Jawa Timur', 'Bali & Nusa Tenggara', 'Sumatera', 'Kalimantan', 'Sulawesi', 'Papua'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Status</label>
                <select
                  value={formData.status || 'ONLINE'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Full Address</label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white resize-y min-h-[60px]"
                placeholder="Street address..."
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Manager Name</label>
                <input
                  type="text"
                  value={formData.managerName || ''}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">WhatsApp / Phone</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Operating Hours</label>
                <input
                  type="text"
                  value={formData.operatingHours || ''}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
                  placeholder="10:00 - 22:00 WIB"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">Customer App Store Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white resize-y min-h-[60px]"
                placeholder="Description displayed on customer app store locator..."
              ></textarea>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md hover:bg-slate-800"
              >
                <Save className="w-4 h-4" /> {mode === 'create' ? 'Save & Create Branch' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search branch name, mall, or code..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-slate-900 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'Jabodetabek', 'Jawa Barat', 'Jawa Tengah & DIY', 'Jawa Timur', 'Bali & Nusa Tenggara', 'Sumatera'].map((reg) => (
            <button
              key={reg}
              onClick={() => setSelectedRegion(reg)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                selectedRegion === reg
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStores.map((store) => (
          <div
            key={store.id}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md"
          >
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-mono font-bold rounded">
                    {store.code}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                    store.status === 'ONLINE' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                    store.status === 'MAINTENANCE' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300' :
                    'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                  }`}>
                    {store.status === 'ONLINE' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    {store.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{store.name}</h3>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">{store.mallName}, {store.city}</div>
              </div>
              
              <div className="flex items-center gap-1">
                {onViewTransactions && (
                  <button
                    onClick={() => onViewTransactions(store)}
                    className="p-2 text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
                    title={`Lihat Seluruh Transaksi Cabang ${store.name}`}
                  >
                    <Receipt className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleOpenEdit(store)}
                  className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                  title="Edit Branch Settings"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteStore(store.id)}
                  className="p-2 text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                  title="Delete Branch"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 flex-1 space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{store.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{store.whatsapp}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{store.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{store.operatingHours || '10:00 - 22:00 WIB'}</span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Manager:</span>{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">{store.managerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-medium">Cashiers:</span>{' '}
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{store.cashierCount} staff</span>
                </div>
              </div>

              {onViewTransactions && (
                <button
                  onClick={() => onViewTransactions(store)}
                  className="w-full py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-900 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-600" />
                  <span>Lihat Seluruh Transaksi Toko</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
