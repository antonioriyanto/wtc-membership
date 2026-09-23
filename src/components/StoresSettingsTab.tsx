import React, { useState, useEffect, useRef } from 'react';
import { StoreBranch } from '../types';
import { initialStores } from '../data/mockData';
import { cleanAndEnrichStore, syncOfficialStoresToFirestore, safeSetDoc } from '../lib/syncFirestore';
import { uploadImageToStorage } from '../lib/imageStorage';
import { useCustomDialog } from './CustomDialogProvider';
import { 
  Store, Plus, Search, Edit3, Trash2, MapPin, Phone, Mail, Clock, 
  ArrowLeft, Save, Receipt, RefreshCw, Building, Compass,
  MoreVertical, X, ExternalLink, Users, Copy, Check, Filter, ChevronRight,
  CheckCircle2
} from 'lucide-react';
import { WhatsAppLogo } from './WhatsAppLogo';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

interface StoresSettingsTabProps {
  stores: StoreBranch[];
  setStores: React.Dispatch<React.SetStateAction<StoreBranch[]>>;
  onViewTransactions?: (store: StoreBranch | null) => void;
  isSkeletonLoading?: boolean;
}

export const StoresSettingsTab: React.FC<StoresSettingsTabProps> = ({ 
  stores, 
  setStores, 
  onViewTransactions, 
  isSkeletonLoading = false 
}) => {
  const { showConfirm, showAlert } = useCustomDialog();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isUploading, setIsUploading] = useState(false);
  
  // Drawer state for secondary details
  const [selectedDetailStore, setSelectedDetailStore] = useState<StoreBranch | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Kebab menu state
  const [activeMenuStoreId, setActiveMenuStoreId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close kebab menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuStoreId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToTop = () => {
    const scrollArea = document.getElementById('main-scroll-area');
    if (scrollArea) {
      scrollArea.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 'list' | 'create' | 'edit'
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncingStores, setIsSyncingStores] = useState(false);

  const handleForceSyncStores = async () => {
    setIsSyncingStores(true);
    try {
      await syncOfficialStoresToFirestore(true);
      // Preserve custom branches from existing state
      const officialIds = new Set(initialStores.map(s => s.id));
      const officialCodes = new Set(initialStores.map(s => s.code));
      const customBranches = stores.filter(s => !officialIds.has(s.id) && !officialCodes.has(s.code)).map(cleanAndEnrichStore);
      const updatedOfficial = initialStores.map(cleanAndEnrichStore);
      const merged = [...updatedOfficial, ...customBranches].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setStores(merged);
      showAlert(`Berhasil menyinkronkan seluruh 42 cabang resmi Watch Club ke database Firestore. ${customBranches.length} cabang kustom tetap dipertahankan.`, 'Sinkronisasi Berhasil', 'success');
    } catch (err: any) {
      showAlert('Gagal menyinkronkan data toko: ' + (err?.message || err), 'Gagal', 'error');
    } finally {
      setIsSyncingStores(false);
    }
  };

  // Form state for create / edit
  const [formData, setFormData] = useState<Partial<StoreBranch>>({
    code: 'WTC-' + Math.floor(100 + Math.random() * 900),
    name: '',
    mallName: '',
    floorUnit: '',
    city: 'Jakarta',
    region: 'Jabodetabek',
    address: '',
    fullAddress: '',
    email: '',
    phone: '',
    whatsapp: '+628123456789',
    managerName: '',
    cashierCount: 3,
    status: 'ONLINE',
    operatingHours: '10:00 - 22:00 WIB',
    description: 'Official Watch Club boutique offering luxury timepieces and certified maintenance.'
  });

  const enrichedStores = stores.map(cleanAndEnrichStore);

  const regionsList = [
    'ALL',
    'Jabodetabek',
    'Jawa Barat',
    'Jawa Tengah & DIY',
    'Jawa Timur',
    'Bali & Nusa Tenggara',
    'Sumatera',
    'Kalimantan',
    'Sulawesi',
    'Papua'
  ];

  const filteredStores = enrichedStores.filter(s => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = (s.name && s.name.toLowerCase().includes(q)) || 
                          (s.mallName && s.mallName.toLowerCase().includes(q)) || 
                          (s.city && s.city.toLowerCase().includes(q)) ||
                          (s.code && s.code.toLowerCase().includes(q)) ||
                          (s.floorUnit && s.floorUnit.toLowerCase().includes(q)) ||
                          (s.address && s.address.toLowerCase().includes(q));
    const matchesRegion = selectedRegion === 'ALL' || s.region === selectedRegion;
    const matchesStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    return matchesSearch && matchesRegion && matchesStatus;
  });

  const handleOpenCreate = () => {
    setFormData({
      code: 'WTC-' + Math.floor(100 + Math.random() * 900),
      name: '',
      mallName: '',
      floorUnit: '',
      city: 'Jakarta',
      region: 'Jabodetabek',
      address: '',
      fullAddress: '',
      email: '',
      phone: '',
      whatsapp: '+628123456789',
      managerName: '',
      cashierCount: 3,
      status: 'ONLINE',
      operatingHours: '10:00 - 22:00 WIB',
      description: 'Official Watch Club boutique offering luxury timepieces.'
    });
    setSelectedDetailStore(null);
    setMode('create');
    scrollToTop();
  };

  const handleOpenEdit = (store: StoreBranch) => {
    setFormData({ ...store });
    setEditingStoreId(store.id);
    setActiveMenuStoreId(null);
    setSelectedDetailStore(null);
    setMode('edit');
    scrollToTop();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // Validate and upload to Storage (URL only, no Base64 in Firestore or state)
      const uploaded = await uploadImageToStorage(file, 'stores');
      setFormData(prev => ({ ...prev, imageUrl: uploaded.url }));
      showAlert('Gambar cabang berhasil divalidasi dan diunggah ke Cloud Storage.', 'Upload Berhasil', 'success');
    } catch (err: any) {
      console.error('Error uploading image to storage:', err);
      showAlert(err?.message || 'Gagal mengupload gambar cabang.', 'Upload Gagal', 'error');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.mallName) return;
    
    setIsSaving(true);

    try {
      if (mode === 'create') {
        const created: StoreBranch = {
          id: 'store_' + Date.now(),
          code: formData.code || 'WTC-' + Math.floor(100 + Math.random() * 900),
          name: formData.name || '',
          mallName: formData.mallName || '',
          city: formData.city || 'Jakarta',
          region: (formData.region as any) || 'Jabodetabek',
          address: formData.address || '',
          fullAddress: formData.fullAddress || formData.address || '',
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
          description: formData.description || 'Official Watch Club boutique.',
          imageUrl: formData.imageUrl,
          latitude: formData.latitude,
          longitude: formData.longitude
        };
        
        await safeSetDoc('stores', created.id, created);
        const newStores = [created, ...stores];
        setStores(newStores);
        try {
          localStorage.setItem('wtc_stores', JSON.stringify(newStores));
        } catch {}
        showAlert('Cabang baru berhasil disimpan ke database.', 'Sukses', 'success');
        setMode('list');
        setEditingStoreId(null);
        scrollToTop();
      } else if (mode === 'edit' && editingStoreId) {
        const existingStore = stores.find(s => s.id === editingStoreId);
        const updatedData: StoreBranch = cleanAndEnrichStore({
          ...existingStore,
          ...formData,
          id: editingStoreId
        });
        
        await safeSetDoc('stores', updatedData.id, updatedData);
        const newStores = stores.map(s => s.id === editingStoreId ? updatedData : s);
        setStores(newStores);
        try {
          localStorage.setItem('wtc_stores', JSON.stringify(newStores));
        } catch {}
        showAlert(`Perubahan cabang ${updatedData.name} berhasil disimpan.`, 'Sukses', 'success');
        setMode('list');
        setEditingStoreId(null);
        scrollToTop();
      }
    } catch (err: any) {
      console.error('Failed to save store in Firestore/Storage', err);
      showAlert('Gagal menyimpan perubahan cabang ke database: ' + (err?.message || err), 'Penyimpanan Gagal', 'error');
      // DO NOT reset mode to 'list' on failure: let user retry without losing form edits
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStore = (id: string) => {
    setActiveMenuStoreId(null);
    const storeObj = stores.find(s => s.id === id);
    showConfirm(
      `Hapus cabang ${storeObj?.name || id} secara permanen? Tindakan ini tidak dapat dibatalkan.`,
      'Konfirmasi Hapus Cabang',
      async () => {
        try {
          await deleteDoc(doc(db, 'stores', id));
        } catch (err) {
          console.error('Failed to delete store', err);
        }
        const newStores = stores.filter(s => s.id !== id);
        setStores(newStores);
        try {
          localStorage.setItem('wtc_stores', JSON.stringify(newStores));
        } catch {}
        if (selectedDetailStore?.id === id) {
          setSelectedDetailStore(null);
        }
      },
      'Ya, Hapus',
      'Batal'
    );
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1800);
  };

  if (isSkeletonLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
        <div className="h-12 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map(i => (
            <div key={i} className="h-14 bg-neutral-200 dark:bg-neutral-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Refined Header Bar */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shrink-0">
            <Store className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                Store & Branch Settings
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                {enrichedStores.length} Cabang
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              Direktori operasional, status sistem, konfigurasi staf, dan pemantauan cabang HO.
            </p>
          </div>
        </div>

        {mode === 'list' && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleForceSyncStores}
              disabled={isSyncingStores}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Sinkronkan master 42 cabang Watch Club ke database Firestore"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingStores ? 'animate-spin text-emerald-600' : 'text-neutral-500'}`} />
              <span>{isSyncingStores ? 'Menyinkronkan...' : 'Sinkronkan Cabang'}</span>
            </button>

            {onViewTransactions && (
              <button
                id="stores-tab-view-all-transactions-btn"
                onClick={() => onViewTransactions(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors flex items-center gap-2 cursor-pointer"
                title="Buka ledger transaksi seluruh cabang nasional"
              >
                <Receipt className="w-3.5 h-3.5 text-neutral-500" />
                <span>Transaksi Nasional</span>
              </button>
            )}

            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Branch</span>
            </button>
          </div>
        )}
      </div>

      {/* CREATE / EDIT FORM */}
      {mode !== 'list' && (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden animate-fadeIn">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMode('list')}
                className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-sm font-bold text-neutral-900 dark:text-white">
                  {mode === 'create' ? 'Tambah Cabang Baru' : `Edit Cabang: ${formData.name || 'Store'}`}
                </h2>
                <p className="text-[11px] text-neutral-500">Isi parameter cabang, kontak, dan alamat operasional.</p>
              </div>
            </div>
            <button
              onClick={() => setMode('list')}
              className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium"
            >
              Batal
            </button>
          </div>

          <form onSubmit={handleSaveStore} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Kode Toko / Store ID</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Nama Cabang Resmi</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900"
                  placeholder="Contoh: 23 Paskal Shopping Center Bandung"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Mall / Nama Gedung</label>
                <input
                  type="text"
                  value={formData.mallName || ''}
                  onChange={(e) => setFormData({ ...formData, mallName: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900"
                  placeholder="Contoh: 23 Paskal Shopping Center"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Lantai & Unit</label>
                <input
                  type="text"
                  value={formData.floorUnit || ''}
                  onChange={(e) => setFormData({ ...formData, floorUnit: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900"
                  placeholder="Contoh: Lantai 2 No. 86"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Kota</label>
                <input
                  type="text"
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Wilayah (Region)</label>
                <select
                  value={formData.region || 'Jabodetabek'}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value as any })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                >
                  {regionsList.filter(r => r !== 'ALL').map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Status Operasional</label>
                <select
                  value={formData.status || 'ONLINE'}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900 cursor-pointer"
                >
                  <option value="ONLINE">ONLINE (Aktif Transaksi)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Pemeliharaan)</option>
                  <option value="OFFLINE">OFFLINE (Tutup Sementara)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Alamat Lengkap</label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value, fullAddress: e.target.value })}
                className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900 resize-y min-h-[60px]"
                placeholder="Alamat jalan lengkap..."
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Latitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude || ''}
                  onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white"
                  placeholder="-6.914744"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Longitude (GPS)</label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude || ''}
                  onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white"
                  placeholder="107.593086"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Nama Manager</label>
                <input
                  type="text"
                  value={formData.managerName || ''}
                  onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white"
                  placeholder="Branch Manager"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">WhatsApp / Telepon</label>
                <input
                  type="text"
                  value={formData.whatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white"
                  placeholder="0822-6007-7509"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Jam Operasional</label>
                <input
                  type="text"
                  value={formData.operatingHours || ''}
                  onChange={(e) => setFormData({ ...formData, operatingHours: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white"
                  placeholder="10:00 - 22:00 WIB"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Email Toko</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white"
                  placeholder="wtc.branch@watchclub.co.id"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400 mb-1.5">Jumlah Staff Kasir</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.cashierCount || 3}
                  onChange={(e) => setFormData({ ...formData, cashierCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-neutral-600 dark:text-neutral-400">
                  Foto Profil Cabang (Muncul di Customer PWA)
                </label>
                {formData.imageUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: '' })}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus Foto</span>
                  </button>
                )}
              </div>

              {/* Upload via File or URL */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-3">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="block w-full text-xs text-neutral-500
                      file:mr-4 file:py-1.5 file:px-3.5
                      file:rounded-xl file:border-0
                      file:text-xs file:font-semibold
                      file:bg-neutral-100 dark:file:bg-neutral-800 file:text-neutral-700 dark:file:text-neutral-200
                      hover:file:bg-neutral-200 cursor-pointer"
                  />
                  {isUploading && <span className="text-amber-600 font-bold text-xs animate-pulse flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Mengunggah...</span>}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formData.imageUrl || ''}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="Atau tempel link URL foto toko langsung (https://...)"
                    className="flex-1 px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-hidden focus:border-neutral-900"
                  />
                </div>

                {/* Preset Luxury Store Banners */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                    Pilihan Cepat Foto Butik Resmi Watch Club:
                  </span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { name: 'Grand Indonesia', url: 'https://images.unsplash.com/photo-1549429532-6804ff69b22b?w=800&q=80' },
                      { name: 'Senayan City', url: 'https://images.unsplash.com/photo-1513094735237-8f2714d57c13?w=800&q=80' },
                      { name: 'Pondok Indah', url: 'https://images.unsplash.com/photo-1582845512747-e42001c95638?w=800&q=80' },
                      { name: 'Modern Boutique', url: 'https://images.unsplash.com/photo-1548678967-f1fc1ca0c113?w=800&q=80' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: preset.url })}
                        className={`text-left p-1.5 rounded-xl border transition-all text-[10px] flex flex-col gap-1 cursor-pointer ${
                          formData.imageUrl === preset.url
                            ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 font-bold'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-400 text-neutral-600 dark:text-neutral-400'
                        }`}
                      >
                        <img src={preset.url} alt={preset.name} className="w-full h-10 object-cover rounded-lg" />
                        <span className="truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.imageUrl && (
                  <div className="mt-3 flex items-center gap-3 p-2 bg-neutral-50 dark:bg-neutral-800/40 rounded-xl border border-neutral-200 dark:border-neutral-700">
                    <div className="relative rounded-lg overflow-hidden border border-neutral-300 dark:border-neutral-600 w-24 h-16 shrink-0 bg-neutral-100">
                      <img 
                        src={formData.imageUrl} 
                        alt="Preview Cabang" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1549429532-6804ff69b22b?w=800&q=80';
                        }}
                      />
                    </div>
                    <div className="text-xs space-y-0.5 min-w-0">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Foto Aktif Siap Tampil
                      </span>
                      <p className="text-[11px] text-neutral-500 truncate max-w-xs">{formData.imageUrl}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMode('list')}
                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold cursor-pointer hover:bg-neutral-200 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving || isUploading}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" /> {mode === 'create' ? 'Simpan Cabang' : 'Simpan Perubahan'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modern Compact Toolbar: Search + Dropdown Filter Wilayah & Status */}
      <div className="bg-white dark:bg-neutral-900 p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari cabang, mall, kota, kode..."
            className="w-full pl-9 pr-8 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-hidden focus:border-neutral-900 font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Filters (Eliminating rigid horizontal scrollbar) */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Region Dropdown */}
          <div className="relative flex items-center">
            <Filter className="absolute left-3 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
            <select
              value={selectedRegion || 'ALL'}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="pl-8 pr-7 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 focus:outline-hidden focus:border-neutral-900 cursor-pointer appearance-none"
            >
              <option value="ALL">Semua Wilayah ({enrichedStores.length})</option>
              {regionsList.filter(r => r !== 'ALL').map(reg => {
                const count = enrichedStores.filter(s => s.region === reg).length;
                return (
                  <option key={reg} value={reg}>
                    {reg} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Status Dropdown */}
          <select
            value={selectedStatus || 'ALL'}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 focus:outline-hidden focus:border-neutral-900 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="ONLINE">🟢 Online</option>
            <option value="MAINTENANCE">🟡 Maintenance</option>
            <option value="OFFLINE">⚪ Offline</option>
          </select>

          {/* Counter badge */}
          <div className="text-[11px] font-medium text-neutral-500 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg whitespace-nowrap">
            {filteredStores.length} dari {enrichedStores.length} cabang
          </div>
        </div>
      </div>

      {/* Modern Data Table */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/40 text-[11px] font-semibold text-neutral-500 dark:text-neutral-400">
                <th className="py-3 px-4 w-28">KODE CABANG</th>
                <th className="py-3 px-4">NAMA CABANG & MALL</th>
                <th className="py-3 px-4 w-48">KOTA & WILAYAH</th>
                <th className="py-3 px-4 w-36">STATUS</th>
                <th className="py-3 px-4 w-36">STAFF KASIR</th>
                <th className="py-3 px-4 w-20 text-right">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
              {filteredStores.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    <Store className="w-8 h-8 mx-auto mb-2 text-neutral-300 dark:text-neutral-600" />
                    <p className="font-semibold text-sm text-neutral-700 dark:text-neutral-300">Tidak ada cabang yang cocok</p>
                    <p className="text-xs text-neutral-400 mt-1">Coba sesuaikan kata kunci pencarian atau filter wilayah Anda.</p>
                    <button
                      onClick={() => { setSearchTerm(''); setSelectedRegion('ALL'); setSelectedStatus('ALL'); }}
                      className="mt-3 px-3 py-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 text-neutral-700 dark:text-neutral-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </td>
                </tr>
              ) : (
                filteredStores.map((store) => {
                  const isMenuOpen = activeMenuStoreId === store.id;

                  return (
                    <tr
                      key={store.id}
                      onClick={() => setSelectedDetailStore(store)}
                      className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer group"
                    >
                      {/* Store Code */}
                      <td className="py-3.5 px-4 font-mono font-bold text-neutral-800 dark:text-neutral-200">
                        <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[11px] font-semibold group-hover:bg-neutral-200 dark:group-hover:bg-neutral-700 transition-colors">
                          {store.code}
                        </span>
                      </td>

                      {/* Store Name & Mall */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {store.imageUrl ? (
                            <img 
                              src={store.imageUrl} 
                              alt={store.name} 
                              className="w-10 h-10 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-700 bg-neutral-100" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shrink-0 text-neutral-400">
                              <Store className="w-4 h-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-neutral-900 dark:text-white text-sm group-hover:text-neutral-950 dark:group-hover:text-neutral-100 transition-colors truncate">
                              {store.name}
                            </div>
                            <div className="text-[11px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 mt-0.5 truncate">
                              <span>{store.mallName}</span>
                              {store.floorUnit && (
                                <>
                                  <span className="text-neutral-300 dark:text-neutral-600">•</span>
                                  <span>{store.floorUnit}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* City & Region */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-neutral-800 dark:text-neutral-200 text-xs">
                          {store.city}
                        </div>
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                          {store.region || 'Nasional'}
                        </div>
                      </td>

                      {/* Status Indicator */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          store.status === 'ONLINE'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40'
                            : store.status === 'MAINTENANCE'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            store.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse' :
                            store.status === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-neutral-400'
                          }`} />
                          {store.status}
                        </span>
                      </td>

                      {/* Cashiers & Staff */}
                      <td className="py-3.5 px-4 text-neutral-600 dark:text-neutral-300 font-medium">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span>{store.cashierCount || 1} Staff</span>
                        </div>
                        <div className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[120px]">
                          {store.managerName || 'Branch Mgr'}
                        </div>
                      </td>

                      {/* Clean Row Kebab Actions */}
                      <td 
                        className="py-3.5 px-4 text-right relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveMenuStoreId(isMenuOpen ? null : store.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                          title="Actions menu"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            ref={menuRef}
                            className="absolute right-4 top-10 w-48 bg-white dark:bg-neutral-800 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-700 py-1.5 z-30 text-left animate-fadeIn"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuStoreId(null);
                                setSelectedDetailStore(store);
                              }}
                              className="w-full px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Store className="w-3.5 h-3.5 text-neutral-500" />
                              Lihat Detail Cabang
                            </button>

                            {onViewTransactions && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuStoreId(null);
                                  onViewTransactions(store);
                                }}
                                className="w-full px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2 font-medium cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5 text-amber-500" />
                                View Transactions
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenEdit(store)}
                              className="w-full px-3.5 py-2 text-xs text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 flex items-center gap-2 font-medium cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-neutral-500" />
                              Edit Branch
                            </button>

                            <div className="my-1 border-t border-neutral-100 dark:border-neutral-700" />

                            <button
                              type="button"
                              onClick={() => handleDeleteStore(store.id)}
                              className="w-full px-3.5 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 font-semibold cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              Delete Branch
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Drawer: Secondary Detail Panel */}
      {selectedDetailStore && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-fadeIn"
          onClick={() => setSelectedDetailStore(null)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-neutral-900 h-full shadow-2xl flex flex-col overflow-hidden border-l border-neutral-200 dark:border-neutral-800 animate-slideLeft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
                  {selectedDetailStore.code}
                </span>
                <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  selectedDetailStore.status === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                  selectedDetailStore.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400' :
                  'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    selectedDetailStore.status === 'ONLINE' ? 'bg-emerald-500' :
                    selectedDetailStore.status === 'MAINTENANCE' ? 'bg-amber-500' : 'bg-neutral-400'
                  }`} />
                  {selectedDetailStore.status}
                </span>
              </div>
              <button
                onClick={() => setSelectedDetailStore(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* Branch Image & Title */}
              <div>
                {selectedDetailStore.imageUrl && (
                  <div className="w-full aspect-[16/9] rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-750 mb-3 bg-neutral-100">
                    <img 
                      src={selectedDetailStore.imageUrl} 
                      alt={selectedDetailStore.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                  {selectedDetailStore.name}
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {selectedDetailStore.mallName}, {selectedDetailStore.city} ({selectedDetailStore.region})
                </p>
              </div>

              {/* Quick Communication & Navigation Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {(() => {
                  const rawNum = (selectedDetailStore.whatsapp || selectedDetailStore.phone || '').replace(/[^0-9]/g, '');
                  const waNum = rawNum.startsWith('0') ? '62' + rawNum.slice(1) : (rawNum.startsWith('62') ? rawNum : (rawNum ? '62' + rawNum : '628129868888'));
                  return (
                    <a
                      href={`https://wa.me/${waNum}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <WhatsAppLogo className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                      <span>Hubungi WhatsApp</span>
                      <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                    </a>
                  );
                })()}

                <a
                  href={
                    selectedDetailStore.latitude && selectedDetailStore.longitude
                      ? `https://www.google.com/maps/search/?api=1&query=${selectedDetailStore.latitude},${selectedDetailStore.longitude}`
                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedDetailStore.name + ' ' + selectedDetailStore.city)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Compass className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Google Maps</span>
                  <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                </a>
              </div>

              {/* Secondary Details List */}
              <div className="space-y-3.5 text-xs text-neutral-600 dark:text-neutral-300">
                {/* Floor & Unit */}
                {selectedDetailStore.floorUnit && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <Building className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Unit / Lantai</div>
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedDetailStore.floorUnit}</div>
                    </div>
                  </div>
                )}

                {/* Full Address */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Alamat Lengkap</span>
                      <button
                        onClick={() => copyToClipboard(selectedDetailStore.fullAddress || selectedDetailStore.address, 'address')}
                        className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedField === 'address' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        {copiedField === 'address' ? 'Tersalin' : 'Salin'}
                      </button>
                    </div>
                    <p className="mt-0.5 leading-relaxed text-neutral-700 dark:text-neutral-300 font-medium">
                      {selectedDetailStore.fullAddress || selectedDetailStore.address}
                    </p>
                  </div>
                </div>

                {/* GPS Coordinates */}
                {selectedDetailStore.latitude !== undefined && selectedDetailStore.longitude !== undefined && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <Compass className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Koordinat GPS</div>
                      <div className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 mt-0.5">
                        {selectedDetailStore.latitude.toFixed(6)}, {selectedDetailStore.longitude.toFixed(6)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Email */}
                {selectedDetailStore.email && (
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <Mail className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Email Cabang</div>
                      <div className="font-semibold text-neutral-800 dark:text-neutral-200 mt-0.5">{selectedDetailStore.email}</div>
                    </div>
                  </div>
                )}

                {/* Hours & Staff */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Jam Operasional</span>
                    </div>
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {selectedDetailStore.operatingHours || '10:00 - 22:00 WIB'}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="flex items-center gap-1.5 text-neutral-400 mb-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Staf Kasir</span>
                    </div>
                    <div className="font-semibold text-neutral-800 dark:text-neutral-200">
                      {selectedDetailStore.cashierCount || 1} Personil
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedDetailStore.description && (
                  <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Deskripsi Aplikasi Member</div>
                    <p className="text-neutral-600 dark:text-neutral-300 italic text-xs leading-relaxed">
                      "{selectedDetailStore.description}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-850/40 flex items-center gap-2">
              {onViewTransactions && (
                <button
                  type="button"
                  onClick={() => {
                    const store = selectedDetailStore;
                    setSelectedDetailStore(null);
                    onViewTransactions(store);
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Transaksi Cabang</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleOpenEdit(selectedDetailStore)}
                className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
