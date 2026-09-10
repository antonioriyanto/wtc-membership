import React, { useState, useRef, useEffect } from 'react';
import { Member, Transaction } from '../types';
import { Search, FileDown, Eye, PenLine, Plus, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { TierBadge } from '../utils/tierBadge';

interface MembersTabProps {
  members: Member[];
  transactions?: Transaction[];
  onOpenCreateMember?: () => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({ members, onOpenCreateMember }) => {
  const [search, setSearch] = useState('');
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

  const filteredMembers = members.filter(m => 
    (m.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (m.phone || '').includes(search) || 
    (m.membershipId || '').toLowerCase().includes(search.toLowerCase()) ||
    (m.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const prepareExportData = () => {
    return filteredMembers.map((m, idx) => ({
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
    if (filteredMembers.length === 0) {
      alert('Belum ada data member untuk diekspor.');
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
    if (filteredMembers.length === 0) {
      alert('Belum ada data member untuk diekspor.');
      return;
    }
    const headers = ['ID Member', 'Nama Lengkap', 'Nomor HP', 'Email', 'Tanggal Lahir', 'Level Tier', 'Total Poin', 'Total Belanja', 'Store Terdaftar', 'Status'];
    const rows = filteredMembers.map(m => [
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

  return (
    <div className="animate-fadeIn space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Members Ledger & CRM</h2>
          <p className="text-sm text-slate-500">Database seluruh member aktif dan riwayat perolehan loyalitas.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={exportDropdownRef}>
            <button 
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Data</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>

            {isExportDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-fadeIn">
                <button
                  onClick={handleExportExcel}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-100 font-medium transition-colors text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor ke Excel (.xlsx)</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-800 hover:bg-slate-100 font-medium transition-colors text-left"
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
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Member
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search members by name, phone, ID, or email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-slate-400" 
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Menampilkan {filteredMembers.length} dari {members.length} Member
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">ID Member</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Nama Lengkap</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">No HP</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Email</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Level Tier</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Total Poin</th>
                <th className="py-3 px-5 text-xs font-bold text-slate-500 uppercase tracking-wide">Store</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredMembers.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-xs font-semibold text-slate-600">{m.membershipId}</td>
                  <td className="py-3.5 px-5 font-bold text-slate-900">{m.name}</td>
                  <td className="py-3.5 px-5 text-slate-600 font-mono text-xs">{m.phone}</td>
                  <td className="py-3.5 px-5 text-slate-600 text-xs">{m.email || '-'}</td>
                  <td className="py-3.5 px-5">
                    <TierBadge tier={m.tier} size="sm" showSuffix={false} />
                  </td>
                  <td className="py-3.5 px-5 font-bold text-emerald-600">{(m.points || 0).toLocaleString('id-ID')} Pts</td>
                  <td className="py-3.5 px-5 text-xs font-medium text-slate-600">{m.registeredStore || 'Puri Jakarta'}</td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada member yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
