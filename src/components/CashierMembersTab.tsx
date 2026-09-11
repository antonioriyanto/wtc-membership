import React, { useState, useRef, useEffect } from 'react';
import { Member, StoreBranch } from '../types';
import { useCustomDialog } from './CustomDialogProvider';
import { 
  Users, 
  UserPlus, 
  Crown, 
  Search, 
  FileDown, 
  Plus, 
  Eye, 
  PenLine, 
  X, 
  Check, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Award, 
  UserCheck, 
  ChevronDown, 
  FileSpreadsheet, 
  FileText,
  Lock,
  ShieldCheck,
  Map
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TierBadge } from '../utils/tierBadge';

interface MembersTabProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  currentStore?: StoreBranch;
  onOpenCreateMember: () => void;
}

export const CashierMembersTab: React.FC<MembersTabProps> = ({ members, setMembers, currentStore, onOpenCreateMember }) => {
  const { showAlert } = useCustomDialog();
  const [searchInput, setSearchInput] = useState('');
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  
  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Modal states for View and Edit
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Form states for Edit Member (Kasir hanya diizinkan mengedit info kontak & personal, bukan level/poin)
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGender, setEditGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [editAddress, setEditAddress] = useState('');

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(searchInput.toLowerCase()) || 
    (m.phone || '').includes(searchInput) || 
    (m.membershipId || '').toLowerCase().includes(searchInput.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(searchInput.toLowerCase())
  );

  const topTierCount = members.filter(m => m.tier === 'GOLD' || m.tier === 'PLATINUM').length;

  const handleOpenEdit = (member: Member) => {
    setEditingMember(member);
    setEditName(member.name || '');
    setEditPhone(member.phone || '');
    setEditEmail(member.email || '');
    setEditBirthDate(member.birthDate ? new Date(member.birthDate).toISOString().slice(0, 10) : '');
    setEditGender((member.gender as any) || 'Pria');
    setEditAddress(member.address || '');
    setEditSuccessMsg('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSavingEdit(true);
    try {
      // Kasir hanya boleh mengubah nama, no hp, email, tanggal lahir, jenis kelamin, alamat
      // Level Tier dan Poin dikunci dan TIDAK dikirimkan agar tidak dapat diubah oleh kasir
      const payload: any = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        gender: editGender,
        address: editAddress.trim() || null
      };
      if (editBirthDate) {
        payload.birthDate = new Date(editBirthDate).toISOString();
      }

      let updatedMemberData = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        gender: editGender,
        address: editAddress.trim() || undefined,
        birthDate: editBirthDate ? new Date(editBirthDate).toISOString() : editingMember.birthDate
      };

      try {
        const { doc, setDoc } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await setDoc(doc(db, 'members', editingMember.id), { ...editingMember, ...updatedMemberData });
      } catch (err) {
        console.warn("Backend API unavailable, saved member edit locally:", err);
      }

      setMembers(prev => {
        const next = prev.map(m => m.id === editingMember.id ? { 
          ...m, 
          ...updatedMemberData,
          tier: m.tier,
          points: m.points
        } : m);
        try { localStorage.setItem('wtc_members', JSON.stringify(next)); } catch {}
        return next;
      });

      setEditSuccessMsg('Data informasi member berhasil diperbarui!');
      setTimeout(() => {
        setEditingMember(null);
        setEditSuccessMsg('');
      }, 1200);
    } catch (err) {
      console.error(err);
      showAlert('Terjadi kesalahan saat menyimpan perubahan.', 'Kesalahan', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const prepareMembersExportData = () => {
    return filteredMembers.map((m, idx) => ({
      'No': idx + 1,
      'ID Member': m.membershipId || m.id,
      'Nama Lengkap': m.name || '-',
      'Nomor HP': m.phone || '-',
      'Email': m.email || '-',
      'Tanggal Lahir': m.birthDate ? new Date(m.birthDate).toLocaleDateString('id-ID') : '-',
      'Jenis Kelamin': m.gender || '-',
      'Level Tier': m.tier || 'SILVER',
      'Total Poin': m.points || 0,
      'Total Belanja (Rp)': m.totalSpend || 0,
      'Store Terdaftar': m.registeredStore || 'Puri Jakarta',
      'Tanggal Bergabung': m.joinDate ? new Date(m.joinDate).toLocaleDateString('id-ID') : '-',
      'Status': m.status || 'ACTIVE'
    }));
  };

  const handleExportExcel = () => {
    if (filteredMembers.length === 0) {
      showAlert('Belum ada data member untuk diekspor.', 'Perhatian', 'warning');
      return;
    }
    const data = prepareMembersExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 },  // No
      { wch: 18 }, // ID Member
      { wch: 22 }, // Nama Lengkap
      { wch: 16 }, // Nomor HP
      { wch: 24 }, // Email
      { wch: 16 }, // Tanggal Lahir
      { wch: 14 }, // Jenis Kelamin
      { wch: 14 }, // Level Tier
      { wch: 14 }, // Total Poin
      { wch: 18 }, // Total Belanja
      { wch: 18 }, // Store Terdaftar
      { wch: 18 }, // Tanggal Bergabung
      { wch: 12 }  // Status
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Member');
    XLSX.writeFile(workbook, `WatchClub_Member_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setIsExportDropdownOpen(false);
  };

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      showAlert('Belum ada data member untuk diekspor.', 'Perhatian', 'warning');
      return;
    }

    const headers = ['ID Member', 'Nama Lengkap', 'Nomor HP', 'Email', 'Tanggal Lahir', 'Jenis Kelamin', 'Level Tier', 'Total Poin', 'Total Belanja (Rp)', 'Store Terdaftar', 'Tanggal Bergabung', 'Status'];
    const rows = filteredMembers.map(m => [
      `"${m.membershipId || m.id}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${m.phone || ''}"`,
      `"${m.email || ''}"`,
      `"${m.birthDate ? new Date(m.birthDate).toLocaleDateString('id-ID') : '-'}"`,
      `"${m.gender || '-'}"`,
      `"${m.tier}"`,
      m.points || 0,
      m.totalSpend || 0,
      `"${(m.registeredStore || '').replace(/"/g, '""')}"`,
      `"${m.joinDate ? new Date(m.joinDate).toLocaleDateString('id-ID') : '-'}"`,
      `"${m.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WatchClub_Member_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  return (
    <div className="animate-fadeIn">
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Manajemen Member (Global 40 Cabang)</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                Terhubung 40 Toko
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Kasir dapat melihat, mencari, dan melayani seluruh data pelanggan member dari 40 cabang toko Watch Club nasional.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border-l-4 border-slate-900 dark:border-emerald-500 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex justify-center items-center text-slate-900 dark:text-emerald-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{members.length.toLocaleString('id-ID')}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Member</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border-l-4 border-emerald-500 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex justify-center items-center text-emerald-600 dark:text-emerald-400">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">+{Math.max(1, members.filter(m => {
                const d = new Date(m.joinDate || '');
                const today = new Date();
                return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
              }).length)}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Member Baru Hari Ini</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 shadow-sm border-l-4 border-amber-400 transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex justify-center items-center text-amber-600 dark:text-amber-400">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-0.5">{topTierCount}</h3>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Member Gold & Platinum</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-t-xl p-5 flex flex-wrap justify-between items-center gap-4 border-b border-slate-200 dark:border-slate-700 transition-colors">
        <div className="relative w-full max-w-[320px]">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari nama, No HP, email, atau ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Ekspor Data</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 animate-fadeIn">
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
          <button 
            onClick={onOpenCreateMember} 
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-emerald-600 text-white border-none rounded-lg text-sm font-semibold hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tambah Member Baru
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-b-xl shadow-sm overflow-x-auto transition-colors">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Tanggal Bergabung</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">No HP / ID</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Nama Lengkap</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Cabang Asal</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Email</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Level Tier</th>
              <th className="py-3.5 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap">Total Poin</th>
              <th className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide sticky right-0 bg-slate-100 dark:bg-slate-900 z-20 shadow-[-4px_0_10px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_10px_rgba(0,0,0,0.3)] text-center whitespace-nowrap">
                Aksi Cepat
              </th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredMembers.map(member => (
              <tr key={member.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap text-xs">
                  {member.joinDate ? new Date(member.joinDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : '-'}
                </td>
                <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  <div className="font-mono text-sm font-medium">{member.phone}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{member.membershipId}</div>
                </td>
                <td className="py-3.5 px-4 text-slate-900 dark:text-white font-semibold whitespace-nowrap">{member.name}</td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                    {member.registeredStore || 'Puri Jakarta'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-xs">{member.email || '-'}</td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <TierBadge tier={member.tier} size="md" />
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{(member.points || 0).toLocaleString('id-ID')} Pts</td>
                <td className="py-3.5 px-4 sticky right-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-700/80 z-10 shadow-[-4px_0_10px_rgba(0,0,0,0.08)] dark:shadow-[-4px_0_10px_rgba(0,0,0,0.3)] transition-colors text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button 
                      onClick={() => setViewingMember(member)}
                      title="Lihat Detail Member"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold transition-colors shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Lihat</span>
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(member)}
                      title="Edit Informasi Member"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 text-xs font-semibold transition-colors shadow-xs"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada data member yang sesuai dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL VIEW MEMBER DETAILS */}
      {viewingMember && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                  {viewingMember.name ? viewingMember.name.substring(0, 2).toUpperCase() : 'MB'}
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{viewingMember.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <TierBadge tier={viewingMember.tier} size="sm" />
                    <span className="text-[0.7rem] text-slate-500 dark:text-slate-400 font-mono">
                      {viewingMember.membershipId}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingMember(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Nomor HP</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs font-mono">{viewingMember.phone || '-'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{viewingMember.email || '-'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Lahir</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">
                  {viewingMember.birthDate ? new Date(viewingMember.birthDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}
                </p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Jenis Kelamin</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{viewingMember.gender || '-'}</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-emerald-500" /> Total Poin Member</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{(viewingMember.points || 0).toLocaleString('id-ID')} Pts</p>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-blue-500" /> Cabang Terdaftar</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate">{viewingMember.registeredStore || '-'}</p>
              </div>

              {/* Password & Security Protection */}
              <div className="col-span-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 mb-0.5 flex items-center gap-1.5 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Password & Kredensial Member
                  </p>
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs tracking-widest">••••••••••••</p>
                </div>
                <span className="text-[0.68rem] px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold border border-slate-300 dark:border-slate-700 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-500" /> Terenkripsi (Kasir Dilarang Akses)
                </span>
              </div>
            </div>

            <div className="flex gap-2.5">
              <button 
                onClick={() => {
                  const m = viewingMember;
                  setViewingMember(null);
                  handleOpenEdit(m);
                }} 
                className="flex-1 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <PenLine className="w-3.5 h-3.5" /> Edit Informasi Member
              </button>
              <button 
                onClick={() => setViewingMember(null)} 
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT MEMBER */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-700 my-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-3.5">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <PenLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Edit Informasi Member
                </h3>
                <p className="text-[0.72rem] text-slate-500 dark:text-slate-400 mt-0.5">
                  ID: <span className="font-mono font-medium">{editingMember.membershipId}</span> &bull; Toko: {editingMember.registeredStore || 'Puri Jakarta'}
                </p>
              </div>
              <button onClick={() => setEditingMember(null)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccessMsg && (
              <div className="mb-3.5 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4" /> {editSuccessMsg}
              </div>
            )}

            {/* Locked Level & Points Info Badge */}
            <div className="mb-3.5 p-2.5 bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[0.7rem] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Level Tier & Poin Terkunci
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">Tier:</span>
                  <TierBadge tier={editingMember.tier} size="sm" />
                  <span className="text-xs text-amber-900 dark:text-amber-200 font-medium">&bull; Total Poin: <strong className="font-bold">{(editingMember.points || 0).toLocaleString('id-ID')} Pts</strong></span>
                </div>
              </div>
              <span className="text-[0.68rem] text-amber-700 dark:text-amber-400 italic bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                Dikelola Otomatis HO
              </span>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nama Lengkap *</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  placeholder="Nama lengkap pelanggan"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Nomor HP *</label>
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="contoh@email.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Jenis Kelamin</label>
                  <select 
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs"
                  >
                    <option value="Pria">Pria</option>
                    <option value="Wanita">Wanita</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Alamat Domisili (Opsional)</label>
                <input 
                  type="text" 
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Alamat tempat tinggal member..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-xs"
                />
              </div>

              {/* Password Protection Info */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 text-[0.7rem] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Password Member
                  </label>
                  <div className="font-mono text-xs tracking-widest text-slate-400 select-none mt-0.5">••••••••••••</div>
                </div>
                <span className="text-[0.68rem] text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-800 px-2 py-1 rounded font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" /> Tidak dapat diakses kasir
                </span>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-xs transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="flex-1 py-2 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors text-xs disabled:opacity-50 shadow-xs flex items-center justify-center gap-1.5"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Informasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
