import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Member, Transaction, StoreBranch, MemberTier } from '../types';
import { useCustomDialog } from './CustomDialogProvider';
import { 
  Search, 
  FileDown, 
  Eye, 
  PenLine, 
  Plus, 
  ChevronDown, 
  FileSpreadsheet, 
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Lock,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { TierBadge } from '../utils/tierBadge';
import { EditMemberModal } from './EditMemberModal';
import { MemberPreviewModal } from './MemberPreviewModal';

export type MemberSortField = 'id' | 'name' | 'phone' | 'email' | 'tier' | 'points' | 'store';
export type SortDirection = 'asc' | 'desc';

interface MembersTabProps {
  members: Member[];
  stores?: StoreBranch[];
  transactions?: Transaction[];
  onOpenCreateMember?: () => void;
  onUpdateMember?: (updated: Member) => void;
  onDeleteMember?: (memberId: string) => void;
  onToggleSuspendMember?: (memberId: string) => void;
  onOpenPointAdjust?: (member: Member) => void;
  isSkeletonLoading?: boolean;
}

export const MembersTab: React.FC<MembersTabProps> = ({ 
  members, 
  stores = [],
  transactions = [], 
  onOpenCreateMember,
  onUpdateMember,
  onDeleteMember,
  onToggleSuspendMember,
  onOpenPointAdjust,
  isSkeletonLoading = false
}) => { 
  const { showAlert, showConfirm } = useCustomDialog();
  if (isSkeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-slate-200 rounded-xl" />
          <div className="h-10 w-48 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-16 bg-slate-200 rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  const [search, setSearch] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortField, setSortField] = useState<MemberSortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modals state
  const [previewMember, setPreviewMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setIsExportDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle column sorting
  const handleSort = (field: MemberSortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // For numeric points, default to descending (highest first)
      setSortDirection(field === 'points' ? 'desc' : 'asc');
    }
  };

  // Filter members
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchSearch = 
        (m.name || '').toLowerCase().includes(search.toLowerCase()) || 
        (m.phone || '').includes(search) || 
        (m.membershipId || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.registeredStore || '').toLowerCase().includes(search.toLowerCase());
      
      const matchTier = filterTier === 'ALL' || m.tier === filterTier;
      const matchStatus = filterStatus === 'ALL' || (m.status || 'ACTIVE') === filterStatus;

      return matchSearch && matchTier && matchStatus;
    });
  }, [members, search, filterTier, filterStatus]);

  // Sort members
  const sortedMembers = useMemo(() => {
    const tierRank: Record<string, number> = {
      BLUE: 1,
      SILVER: 2,
      GOLD: 3,
      PLATINUM: 4,
      BLACK: 5
    };

    return [...filteredMembers].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = (a.membershipId || a.id).localeCompare(b.membershipId || b.id);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'phone':
          comparison = (a.phone || '').localeCompare(b.phone || '');
          break;
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '');
          break;
        case 'tier':
          comparison = (tierRank[a.tier] || 0) - (tierRank[b.tier] || 0);
          break;
        case 'points':
          comparison = (a.points || 0) - (b.points || 0);
          break;
        case 'store':
          comparison = (a.registeredStore || '').localeCompare(b.registeredStore || '');
          break;
        default:
          comparison = 0;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredMembers, sortField, sortDirection]);

  // Keep preview / edit member reference fresh if list updates
  useEffect(() => {
    if (previewMember) {
      const fresh = members.find(m => m.id === previewMember.id);
      if (fresh) setPreviewMember(fresh);
    }
    if (editingMember) {
      const fresh = members.find(m => m.id === editingMember.id);
      if (fresh) setEditingMember(fresh);
    }
  }, [members]);

  const prepareExportData = () => {
    return sortedMembers.map((m, idx) => ({
      'No': idx + 1,
      'ID Member': m.membershipId || m.id,
      'Nama Lengkap': m.name || '-',
      'Nomor HP': m.phone || '-',
      'Email': m.email || '-',
      'Tanggal Lahir': m.birthDate ? new Date(m.birthDate).toLocaleDateString('id-ID') : '-',
      'Level Tier': m.tier || 'SILVER',
      'Total Poin': m.points || 0,
      'Total Belanja': m.totalSpend || 0,
      'Store Terdaftar': m.registeredStore || 'Puri Jakarta',
      'Status': m.status || 'ACTIVE'
    }));
  };

  const handleExportExcel = () => {
    if (sortedMembers.length === 0) {
      showAlert('Belum ada data member untuk diekspor.', 'Perhatian', 'warning');
      return;
    }
    const data = prepareExportData();
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 18 },
      { wch: 22 },
      { wch: 16 },
      { wch: 24 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Member');
    XLSX.writeFile(workbook, `WatchClub_Member_HO_${new Date().toISOString().slice(0, 10)}.xlsx`);
    setIsExportDropdownOpen(false);
  };

  const handleExportCSV = () => {
    if (sortedMembers.length === 0) {
      showAlert('Belum ada data member untuk diekspor.', 'Perhatian', 'warning');
      return;
    }
    const headers = ['ID Member', 'Nama Lengkap', 'Nomor HP', 'Email', 'Tanggal Lahir', 'Level Tier', 'Total Poin', 'Total Belanja', 'Store Terdaftar', 'Status'];
    const rows = sortedMembers.map(m => [
      `"${m.membershipId || m.id}"`,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${m.phone || ''}"`,
      `"${m.email || ''}"`,
      `"${m.birthDate ? new Date(m.birthDate).toLocaleDateString('id-ID') : '-'}"`,
      `"${m.tier}"`,
      m.points || 0,
      m.totalSpend || 0,
      `"${(m.registeredStore || '').replace(/"/g, '""')}"`,
      `"${m.status || 'ACTIVE'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `WatchClub_Member_HO_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsExportDropdownOpen(false);
  };

  const handleSaveMember = (updatedMember: Member) => {
    if (onUpdateMember) {
      onUpdateMember(updatedMember);
    }
  };

  const handleDeleteMember = (memberId: string) => {
    if (onDeleteMember) {
      onDeleteMember(memberId);
    }
    if (previewMember && previewMember.id === memberId) {
      setPreviewMember(null);
    }
    if (editingMember && editingMember.id === memberId) {
      setEditingMember(null);
    }
  };

  const handleToggleSuspend = (memberId: string) => {
    if (onToggleSuspendMember) {
      onToggleSuspendMember(memberId);
    }
  };

  const renderSortIndicator = (field: MemberSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-amber-600 font-bold" />
      : <ArrowDown className="w-3.5 h-3.5 text-amber-600 font-bold" />;
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Members Ledger & CRM</h2>
          <p className="text-sm text-slate-500">Database master member 41 cabang, status akun, password, dan riwayat loyalitas.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* EXPORT DROPDOWN */}
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Data</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-30 animate-fadeIn">
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-800 hover:bg-slate-100 font-bold transition-colors text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor ke Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-800 hover:bg-slate-100 font-bold transition-colors text-left"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Ekspor ke CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {onOpenCreateMember && (
            <button 
              onClick={onOpenCreateMember}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" /> Add Member
            </button>
          )}
        </div>
      </div>

      {/* MEMBERS TABLE CONTAINER */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* TOOLBAR & SEARCH / FILTER (Matches CSS Selector 2) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2.5 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, no HP, membership ID, email, atau cabang..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent" 
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 font-bold"
                >
                  Clear
                </button>
              )}
            </div>

            {/* TIER FILTER */}
            <select
              value={filterTier}
              onChange={(e) => setFilterTier(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">Semua Tier</option>
              <option value="BLUE">BLUE</option>
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
              <option value="PLATINUM">PLATINUM</option>
              <option value="BLACK">BLACK</option>
            </select>

            {/* STATUS FILTER */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif (ACTIVE)</option>
              <option value="SUSPENDED">Ditangguhkan (SUSPENDED)</option>
            </select>

            {(filterTier !== 'ALL' || filterStatus !== 'ALL' || search) && (
              <button
                onClick={() => {
                  setFilterTier('ALL');
                  setFilterStatus('ALL');
                  setSearch('');
                }}
                className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors shrink-0"
                title="Reset Filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-900">{sortedMembers.length}</span> member ditampilkan 
            <span className="text-slate-300">•</span>
            <span>Urut: <strong className="text-amber-700 capitalize">{sortField}</strong> ({sortDirection === 'asc' ? 'Naik' : 'Turun'})</span>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs">
                {/* CSS Selector 3: th:nth-of-type(1) -> ID Member */}
                <th 
                  onClick={() => handleSort('id')}
                  className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan ID Member"
                >
                  <div className="flex items-center gap-1.5">
                    <span>ID Member</span>
                    {renderSortIndicator('id')}
                  </div>
                </th>

                {/* CSS Selector 4: th:nth-of-type(2) -> Nama Lengkap */}
                <th 
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Nama Lengkap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Nama Lengkap</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>

                {/* CSS Selector 5: th:nth-of-type(3) -> No HP */}
                <th 
                  onClick={() => handleSort('phone')}
                  className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Nomor Handphone"
                >
                  <div className="flex items-center gap-1.5">
                    <span>No HP</span>
                    {renderSortIndicator('phone')}
                  </div>
                </th>

                {/* CSS Selector 6: th:nth-of-type(4) -> Email */}
                <th 
                  onClick={() => handleSort('email')}
                  className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Email"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Email</span>
                    {renderSortIndicator('email')}
                  </div>
                </th>

                {/* CSS Selector 7: th:nth-of-type(5) -> Level Tier */}
                <th 
                  onClick={() => handleSort('tier')}
                  className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Level Tier Keanggotaan"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Level Tier</span>
                    {renderSortIndicator('tier')}
                  </div>
                </th>

                {/* CSS Selector 8: th:nth-of-type(6) -> Total Poin */}
                <th 
                  onClick={() => handleSort('points')}
                  className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group text-right"
                  title="Klik untuk mengurutkan berdasarkan Total Saldo Poin"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Total Poin</span>
                    {renderSortIndicator('points')}
                  </div>
                </th>

                {/* CSS Selector 9: th:nth-of-type(7) -> Store */}
                <th 
                  onClick={() => handleSort('store')}
                  className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                  title="Klik untuk mengurutkan berdasarkan Cabang Store"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Store</span>
                    {renderSortIndicator('store')}
                  </div>
                </th>

                {/* Column 8: Aksi & Status */}
                <th className="py-3.5 px-4 text-xs font-bold text-slate-600 uppercase tracking-wider text-center">
                  Aksi & Status
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {sortedMembers.map(m => {
                const isSuspended = m.status === 'SUSPENDED';

                return (
                  <tr 
                    key={m.id} 
                    className="hover:bg-slate-50/90 transition-colors group cursor-pointer"
                    onClick={() => setPreviewMember(m)}
                  >
                    {/* 1. ID Member */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition-colors">
                          {m.membershipId || m.id}
                        </span>
                      </div>
                    </td>

                    {/* 2. Nama Lengkap */}
                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        {isSuspended && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200">
                            SUSPENDED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. No HP */}
                    <td className="py-3.5 px-4 text-slate-600 font-mono whitespace-nowrap">
                      {m.phone}
                    </td>

                    {/* 4. Email */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {m.email || '-'}
                    </td>

                    {/* 5. Level Tier */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <TierBadge tier={m.tier} size="sm" showSuffix={false} />
                    </td>

                    {/* 6. Total Poin */}
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 text-right whitespace-nowrap">
                      {(m.points || 0).toLocaleString('id-ID')} Pts
                    </td>

                    {/* 7. Store */}
                    <td className="py-3.5 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {m.registeredStore || 'Puri Jakarta'}
                    </td>

                    {/* 8. Aksi & Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1.5">
                        {/* PREVIEW BUTTON */}
                        <button
                          onClick={() => setPreviewMember(m)}
                          className="p-1.5 rounded-xl text-slate-600 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                          title="Preview Kartu & Riwayat Transaksi Member"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* EDIT BUTTON */}
                        <button
                          onClick={() => setEditingMember(m)}
                          className="p-1.5 rounded-xl text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer"
                          title="Edit Password, Biodata, Poin, & Akun CRM"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                        </button>

                        {/* QUICK SUSPEND TOGGLE */}
                        <button
                          onClick={() => handleToggleSuspend(m.id)}
                          className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                            isSuspended
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={isSuspended ? 'Aktifkan Kembali Akun' : 'Suspend / Bekukan Akun'}
                        >
                          {isSuspended ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                        </button>

                        {/* DELETE BUTTON */}
                        <button
                          onClick={() => {
                            showConfirm(
                              `Hapus akun member ${m.name} (${m.membershipId}) secara permanen?`,
                              'Konfirmasi Hapus Member',
                              () => handleDeleteMember(m.id),
                              'Ya, Hapus Permanen',
                              'Batal'
                            );
                          }}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus Akun Member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {sortedMembers.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada member yang cocok dengan filter atau kata kunci pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      <MemberPreviewModal
        isOpen={!!previewMember}
        onClose={() => setPreviewMember(null)}
        member={previewMember}
        transactions={transactions}
        onOpenEdit={(m) => {
          setPreviewMember(null);
          setEditingMember(m);
        }}
        onToggleSuspend={handleToggleSuspend}
        onDelete={handleDeleteMember}
        onOpenPointAdjust={(m) => {
          if (onOpenPointAdjust) onOpenPointAdjust(m);
        }}
      />

      {/* EDIT MODAL */}
      <EditMemberModal
        isOpen={!!editingMember}
        onClose={() => setEditingMember(null)}
        member={editingMember}
        stores={stores}
        onSave={handleSaveMember}
        onDelete={handleDeleteMember}
        onToggleSuspend={handleToggleSuspend}
      />
    </div>
  );
};
