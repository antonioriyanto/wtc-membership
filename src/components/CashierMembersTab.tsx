import React, { useState, useRef, useEffect } from 'react';
import { Member } from '../types';
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
  FileText 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface MembersTabProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onOpenCreateMember: () => void;
}

export const CashierMembersTab: React.FC<MembersTabProps> = ({ members, setMembers, onOpenCreateMember }) => {
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

  // Form states for Edit Member
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editBirthDate, setEditBirthDate] = useState('');
  const [editGender, setEditGender] = useState<'Pria' | 'Wanita'>('Pria');
  const [editTier, setEditTier] = useState<'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'BLACK'>('BLUE');
  const [editStore, setEditStore] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ACTIVE');

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
    setEditTier(member.tier || 'BLUE');
    setEditStore(member.registeredStore || 'Puri Jakarta');
    setEditStatus((member.status as any) || 'ACTIVE');
    setEditSuccessMsg('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsSavingEdit(true);
    try {
      const payload: any = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || null,
        gender: editGender,
        
        registeredStore: editStore,
        status: editStatus
      };
      if (editBirthDate) {
        payload.birthDate = new Date(editBirthDate).toISOString();
      }

      const res = await fetch(`/api/members/${editingMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const updated = await res.json();
        setMembers(prev => prev.map(m => m.id === updated.id ? { ...m, ...updated } : m));
        setEditSuccessMsg('Data member berhasil diperbarui!');
        setTimeout(() => {
          setEditingMember(null);
          setEditSuccessMsg('');
        }, 1200);
      } else {
        alert('Gagal memperbarui data member.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan perubahan.');
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
      alert('Belum ada data member untuk diekspor.');
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
      alert('Belum ada data member untuk diekspor.');
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
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">Manajemen Member</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Kelola dan pantau seluruh data pelanggan loyalitas Watch Club.</p>
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
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700">
              <th className="py-4 px-5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Tanggal Bergabung</th>
              <th className="py-4 px-5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">No HP / ID</th>
              <th className="py-4 px-5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Nama Lengkap</th>
              <th className="py-4 px-5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Email</th>
              <th className="py-4 px-5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Level Tier</th>
              <th className="py-4 px-5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Total Poin</th>
              <th className="py-4 px-5 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredMembers.map(member => (
              <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                <td className="py-4 px-5 text-slate-700 dark:text-slate-300">
                  {member.joinDate ? new Date(member.joinDate).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'}) : '-'}
                </td>
                <td className="py-4 px-5 text-slate-800 dark:text-slate-200">
                  <div className="font-mono text-sm font-medium">{member.phone}</div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">{member.membershipId}</div>
                </td>
                <td className="py-4 px-5 text-slate-900 dark:text-white font-semibold">{member.name}</td>
                <td className="py-4 px-5 text-slate-600 dark:text-slate-300 text-xs">{member.email || '-'}</td>
                <td className="py-4 px-5">
                  <span className={`px-2.5 py-1 rounded text-[0.7rem] font-bold ${
                    member.tier === 'BLACK' ? 'bg-black text-white' :
                    member.tier === 'DIAMOND' ? 'bg-cyan-100 text-cyan-800' :
                    member.tier === 'PLATINUM' ? 'bg-slate-900 text-white' :
                    member.tier === 'GOLD' ? 'bg-amber-100 text-amber-800' :
                    member.tier === 'BLUE' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {member.tier} TIER
                  </span>
                </td>
                <td className="py-4 px-5 font-bold text-emerald-600 dark:text-emerald-400">{(member.points || 0).toLocaleString('id-ID')} Pts</td>
                <td className="py-4 px-5">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setViewingMember(member)}
                      title="Lihat Detail Member"
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex justify-center items-center text-slate-600 dark:text-slate-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenEdit(member)}
                      title="Edit Data Member"
                      className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex justify-center items-center text-slate-600 dark:text-slate-300 hover:bg-blue-100 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      <PenLine className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredMembers.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                  Tidak ada data member yang sesuai dengan pencarian.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL VIEW MEMBER DETAILS */}
      {viewingMember && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                  {viewingMember.name ? viewingMember.name.substring(0, 2).toUpperCase() : 'MB'}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{viewingMember.name}</h3>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded text-white ${
                    viewingMember.tier === 'GOLD' ? 'bg-amber-500' :
                    viewingMember.tier === 'PLATINUM' ? 'bg-slate-700' : 'bg-slate-400'
                  }`}>
                    {viewingMember.tier} TIER &bull; {viewingMember.status}
                  </span>
                </div>
              </div>
              <button onClick={() => setViewingMember(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> Nomor HP</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{viewingMember.phone || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Email</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{viewingMember.email || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Tanggal Lahir</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {viewingMember.birthDate ? new Date(viewingMember.birthDate).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-'}
                </p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><UserCheck className="w-3.5 h-3.5" /> Jenis Kelamin</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{viewingMember.gender || '-'}</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Total Poin</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-base">{(viewingMember.points || 0).toLocaleString('id-ID')} Pts</p>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> Store Terdaftar</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">{viewingMember.registeredStore || '-'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const m = viewingMember;
                  setViewingMember(null);
                  handleOpenEdit(m);
                }} 
                className="flex-1 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <PenLine className="w-4 h-4" /> Edit Data Member
              </button>
              <button 
                onClick={() => setViewingMember(null)} 
                className="px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT MEMBER */}
      {editingMember && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex justify-center items-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <PenLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Edit Data Member
              </h3>
              <button onClick={() => setEditingMember(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <Check className="w-4 h-4" /> {editSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-sm">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Nama Lengkap *</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Nomor HP *</label>
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Email</label>
                <input 
                  type="email" 
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Level Tier</label>
                  <select 
                    value={editTier}
                    onChange={(e) => setEditTier(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="BLUE">BLUE</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="PLATINUM">PLATINUM</option>
                    <option value="DIAMOND">DIAMOND</option>
                    <option value="BLACK">BLACK</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">Status</label>
                  <select 
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 text-sm"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 text-sm"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                >
                  {isSavingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
