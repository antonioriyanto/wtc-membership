import React, { useState } from 'react';
import { Member, MemberTier, StoreBranch } from '../types';
import { 
  X, 
  Save, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  User, 
  CreditCard, 
  Store, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Sparkles,
  Award
} from 'lucide-react';
import { TierBadge } from '../utils/tierBadge';

interface EditMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  stores: StoreBranch[];
  onSave: (updatedMember: Member) => void;
  onDelete: (memberId: string) => void;
  onToggleSuspend: (memberId: string) => void;
}

export const EditMemberModal: React.FC<EditMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  stores,
  onSave,
  onDelete,
  onToggleSuspend,
}) => {
  if (!isOpen || !member) return null;

  const [activeSection, setActiveSection] = useState<'PERSONAL' | 'MEMBERSHIP' | 'SECURITY' | 'DANGER'>('PERSONAL');
  
  // Form state
  const [formData, setFormData] = useState<Member>({ ...member });
  const [passwordInput, setPasswordInput] = useState(member.password || 'watchclub123');
  const [showPassword, setShowPassword] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'WTC-';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPasswordInput(result);
    setFormData(prev => ({ ...prev, password: result }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: Member = {
      ...formData,
      password: passwordInput,
      points: Number(formData.points) || 0,
      lifetimePoints: Number(formData.lifetimePoints) || 0,
      totalSpend: Number(formData.totalSpend) || 0,
    };
    onSave(updated);
    setSaveSuccessNotice(true);
    setTimeout(() => {
      setSaveSuccessNotice(false);
      onClose();
    }, 600);
  };

  const handleExecuteDelete = () => {
    onDelete(member.id);
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  const isSuspended = formData.status === 'SUSPENDED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
              isSuspended ? 'bg-rose-600' : 'bg-slate-900'
            }`}>
              {isSuspended ? <ShieldAlert className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">Edit Data Member & Akun CRM</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                  isSuspended 
                    ? 'bg-rose-100 text-rose-800 border-rose-200' 
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {formData.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {member.name} • <span className="font-mono">{member.membershipId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECTION NAVIGATION TABS */}
        <div className="px-6 border-b border-slate-100 bg-white flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
          <button
            type="button"
            onClick={() => setActiveSection('PERSONAL')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeSection === 'PERSONAL'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Informasi Personal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('MEMBERSHIP')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeSection === 'MEMBERSHIP'
                ? 'border-amber-500 text-amber-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Membership & Poin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('SECURITY')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeSection === 'SECURITY'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-blue-600" />
            <span>Password & Status Akun</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('DANGER')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeSection === 'DANGER'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-rose-600'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>Zona Hapus</span>
          </button>
        </div>

        {/* MODAL FORM BODY */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: PERSONAL INFORMATION */}
          {activeSection === 'PERSONAL' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80 mb-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Data Identitas Pribadi Pelanggan</h4>
                <p className="text-xs text-slate-500">Kelola identitas resmi member sesuai KTP/SIM untuk verifikasi saat klaim garansi jam tangan dan reward.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="Contoh: Budi Santoso"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    No. Handphone / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="+62 812 3456 7890"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    placeholder="member@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Lahir (Untuk Promo Birthday)
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate ? formData.birthDate.substring(0, 10) : ''}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Jenis Kelamin
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Pria' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.gender === 'Pria'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Pria
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, gender: 'Wanita' })}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                        formData.gender === 'Wanita'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      Wanita
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.joinDate}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-100 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Domisili Lengkap
                </label>
                <textarea
                  rows={2}
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                  placeholder="Nama jalan, perumahan, kelurahan, kota, kode pos"
                />
              </div>
            </div>
          )}

          {/* SECTION 2: MEMBERSHIP & POINTS */}
          {activeSection === 'MEMBERSHIP' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-0.5">Tingkat Tier & Saldo Poin Loyalitas</h4>
                  <p className="text-xs text-amber-700">Penyesuaian manual status keanggotaan dan saldo poin pelanggan Watch Club.</p>
                </div>
                <TierBadge tier={formData.tier} size="md" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Level Tier Membership
                  </label>
                  <select
                    value={formData.tier}
                    onChange={(e) => setFormData({ ...formData, tier: e.target.value as MemberTier })}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="BLUE">BLUE (Tier Dasar)</option>
                    <option value="SILVER">SILVER (Tier Menengah)</option>
                    <option value="GOLD">GOLD (Tier Prioritas)</option>
                    <option value="PLATINUM">PLATINUM (VIP Eksklusif)</option>
                    <option value="BLACK">BLACK (VVIP Tertinggi / Sultan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor ID Membership Kartu
                  </label>
                  <input
                    type="text"
                    value={formData.membershipId}
                    onChange={(e) => setFormData({ ...formData, membershipId: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Saldo Poin Aktif (Dapat Digunakan)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-600 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Pts</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Total Akumulasi Lifetime Points
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      value={formData.lifetimePoints}
                      onChange={(e) => setFormData({ ...formData, lifetimePoints: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Pts</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Total Belanja Akumulatif (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min={0}
                      step={50000}
                      value={formData.totalSpend}
                      onChange={(e) => setFormData({ ...formData, totalSpend: Number(e.target.value) })}
                      className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Store Terdaftar (Home Branch)
                  </label>
                  <select
                    value={formData.registeredStore}
                    onChange={(e) => setFormData({ ...formData, registeredStore: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
                  >
                    {stores.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 3: SECURITY, PASSWORD & STATUS */}
          {activeSection === 'SECURITY' && (
            <div className="space-y-5 animate-fadeIn">
              {/* PASSWORD CARD */}
              <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Kelola Password / PIN Akun Member</h4>
                  </div>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Generate Password Acak</span>
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Password ini digunakan oleh member untuk login ke Customer Member App (`/member`) serta otentikasi saat verifikasi kupon di POS kasir.
                </p>

                <div className="relative max-w-md">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full pl-3.5 pr-20 py-2.5 text-xs font-mono font-bold bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Masukkan password baru..."
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors"
                      title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* ACCOUNT STATUS (ACTIVE vs SUSPENDED) */}
              <div className={`p-5 rounded-2xl border transition-all ${
                isSuspended 
                  ? 'bg-rose-50/70 border-rose-200' 
                  : 'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shrink-0 mt-0.5 ${
                      isSuspended ? 'bg-rose-600' : 'bg-emerald-600'
                    }`}>
                      {isSuspended ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Status Keanggotaan: {isSuspended ? 'DITANGGUHKAN (SUSPENDED)' : 'AKTIF BEROPERASI (ACTIVE)'}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 max-w-lg">
                        {isSuspended 
                          ? 'Akun ini sedang disuspend. Member tidak dapat login ke aplikasi, tidak dapat menggunakan poin belanja, dan kasir akan menerima notifikasi blokir saat memindai ID ini.'
                          : 'Akun berstatus aktif normal. Member dapat mengumpulkan poin, menukarkan voucher, dan bertransaksi di 41 cabang Watch Club.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus = isSuspended ? 'ACTIVE' : 'SUSPENDED';
                      setFormData({ ...formData, status: nextStatus });
                      onToggleSuspend(member.id);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                      isSuspended
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isSuspended ? 'Aktifkan Kembali Akun' : 'Suspend / Bekukan Akun'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: DANGER ZONE (DELETE ACCOUNT) */}
          {activeSection === 'DANGER' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900">Hapus Akun Member Secara Permanen</h4>
                    <p className="text-xs text-rose-700 mt-1">
                      Menghapus akun <strong>{member.name}</strong> ({member.membershipId}) akan menghapus seluruh data profil, hak poin sejumlah <strong>{member.points.toLocaleString('id-ID')} Pts</strong>, dan akses masuk member dari sistem.
                    </p>
                  </div>
                </div>

                {!isConfirmDeleteOpen ? (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setIsConfirmDeleteOpen(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Lanjutkan Penghapusan Akun</span>
                    </button>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-xl border border-rose-300 space-y-3">
                    <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Konfirmasi Pengaman Diperlukan</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Ketik <strong>HAPUS</strong> di bawah ini untuk mengonfirmasi bahwa Anda yakin ingin menghapus akun ini:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      placeholder="Ketik HAPUS"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-rose-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        disabled={deleteConfirmationText !== 'HAPUS'}
                        onClick={handleExecuteDelete}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Ya, Hapus Akun Ini Permanen
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsConfirmDeleteOpen(false);
                          setDeleteConfirmationText('');
                        }}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SAVE / CANCEL BAR */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saveSuccessNotice ? (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Perubahan berhasil disimpan!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Pastikan seluruh data terisi dengan benar sebelum menyimpan.
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
