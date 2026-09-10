import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Terminal, 
  Info, 
  Coins, 
  Ticket, 
  Users, 
  Settings, 
  HelpCircle,
  Clock
} from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTrailTabProps {
  logs?: AuditLog[];
}

export const AuditTrailTab: React.FC<AuditTrailTabProps> = ({ logs: propLogs }) => {
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');

  // Realistic mock logs showing real administrative and system events
  const defaultLogs: AuditLog[] = [
    { 
      id: 'AL-901', 
      timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), 
      actorName: 'Dimas (HO Admin)', 
      actorRole: 'HO_ADMIN', 
      action: 'MANUAL_POINT_COMPENSATION', 
      details: 'Disalurkan +500 Pts via Support Ticket TKT-1049 ke member MBR-9381 (Budi Santoso). Alasan: Kompensasi kendala sistem kasir.', 
      module: 'SUPPORT_TICKETS' 
    },
    { 
      id: 'AL-902', 
      timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), 
      actorName: 'Superadmin HO (PIK)', 
      actorRole: 'HO_ADMIN', 
      action: 'LOYALTY_RULE_UPDATE', 
      details: 'Mengubah rasio perolehan poin menjadi Rp 1.000 / 1 Pts untuk tier Platinum.', 
      module: 'LOYALTY' 
    },
    { 
      id: 'AL-903', 
      timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(), 
      actorName: 'Superadmin HO (PIK)', 
      actorRole: 'HO_ADMIN', 
      action: 'VOUCHER_PUBLISHED', 
      details: 'Menerbitkan kupon diskon baru "SUMMER20" (Potongan 20% Min. Belanja Rp 1.500.000, Kuota 500 klaim).', 
      module: 'VOUCHERS' 
    },
    { 
      id: 'AL-904', 
      timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString(), 
      actorName: 'System Loyalty Engine', 
      actorRole: 'SYSTEM', 
      action: 'AUTO_TIER_PROMOTION', 
      details: 'Menaikkan tier member MBR-1029 dari GOLD ke PLATINUM otomatis setelah total belanja melampaui Rp 20.000.000.', 
      module: 'MEMBERS' 
    },
    { 
      id: 'AL-905', 
      timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), 
      actorName: 'Kasir Puri (Rizal)', 
      actorRole: 'CASHIER', 
      action: 'CASHIER_LOGIN_SHIFT', 
      details: 'Membuka shift kasir di Store ID: PUR (Watch Club - Puri Jakarta), IP: 182.253.11.89.', 
      module: 'SECURITY' 
    },
    { 
      id: 'AL-906', 
      timestamp: new Date(Date.now() - 1000 * 60 * 360).toISOString(), 
      actorName: 'Superadmin HO (PIK)', 
      actorRole: 'HO_ADMIN', 
      action: 'MEMBER_PHONE_MODIFIED', 
      details: 'Memperbarui nomor WhatsApp member MBR-8821 atas permintaan pemilik kartu melalui verifikasi KTP.', 
      module: 'MEMBERS' 
    }
  ];

  const logs = propLogs && propLogs.length > 0 ? propLogs : defaultLogs;

  const filteredLogs = logs.filter(l => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor = l.actorName.toLowerCase().includes(q);
      const matchAction = l.action.toLowerCase().includes(q);
      const matchDetails = l.details.toLowerCase().includes(q);
      const matchId = l.id.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchDetails && !matchId) return false;
    }

    // Module
    if (selectedModule !== 'ALL' && l.module !== selectedModule) return false;

    // Role
    if (selectedRole !== 'ALL' && l.actorRole !== selectedRole) return false;

    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID Log', 'Timestamp', 'Pelaku (Actor)', 'Role', 'Modul', 'Aksi', 'Keterangan Rinci'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.timestamp).toLocaleString('id-ID'),
      l.actorName,
      l.actorRole,
      l.module,
      l.action,
      `"${l.details.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'audit_trail_watchclub_system.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900">System Audit Trail</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-800 border border-slate-200 font-mono">
              Immutable Ledger
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Rekam jejak kepatuhan (*governance log*) yang mencatat setiap aksi administratif sensitif, perubahan konfigurasi, penyesuaian poin manual, dan keamanan.
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Ekspor Audit CSV
        </button>
      </div>

      {/* EDUCATIONAL / ARCHITECTURAL COMPARISON BANNER */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl shadow-md border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl shrink-0 mt-0.5 border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="font-bold text-sm text-white flex items-center gap-2">
              <span>Perbedaan Mendasar: System Audit Trail vs Transaksi Toko Kasir</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-slate-300 leading-relaxed">
              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>System Audit Trail (Security & Change Log):</span>
                </div>
                <p>
                  Mencatat <strong>siapa operator/sistem yang mengubah data internal</strong>. Misalnya: Admin mengubah rasio poin loyalty, kasir login shift, admin memberikan kompensasi manual 500 Pts via tiket komplain, atau voucher baru diaktifkan. Berfungsi sebagai <em>black box</em> anti-fraud.
                </p>
              </div>

              <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                <div className="font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Transaksi Toko Kasir (Commercial Ledger):</span>
                </div>
                <p>
                  Mencatat <strong>aktivitas transaksi belanja konsumen</strong> di kasir cabang (No. Struk belanja Rp 2.500.000, perolehan +250 Pts, pembayaran, serta penukaran kode voucher di mesin POS). Berfungsi untuk rekonsiliasi omzet dan saldo kartu member.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari pelaku (actor), ID log, jenis aksi, atau detail perubahan..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors" 
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Role filter */}
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Pelaku (All Roles)</option>
              <option value="HO_ADMIN">Superadmin HO</option>
              <option value="CASHIER">Kasir Cabang</option>
              <option value="SYSTEM">Mesin Otomatis (System)</option>
            </select>

            {/* Module filter */}
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Modul</option>
              <option value="SUPPORT_TICKETS">Support & Tiket</option>
              <option value="LOYALTY">Loyalty Rules</option>
              <option value="VOUCHERS">Voucher Promosi</option>
              <option value="MEMBERS">Member CRM</option>
              <option value="TRANSACTIONS">Transaksi & Penyesuaian</option>
              <option value="SECURITY">Keamanan & Sesi Login</option>
            </select>
          </div>
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">Waktu (Timestamp)</th>
                <th className="py-3.5 px-5">Pelaku (Actor)</th>
                <th className="py-3.5 px-5">Modul Sistem</th>
                <th className="py-3.5 px-5">Jenis Aksi</th>
                <th className="py-3.5 px-5">Detail Perubahan Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => {
                const isHO = log.actorRole === 'HO_ADMIN';
                const isCashier = log.actorRole === 'CASHIER';

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Timestamp */}
                    <td className="py-4 px-5 font-mono text-slate-500 whitespace-nowrap">
                      <div>{new Date(log.timestamp).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      <div className="text-[11px] text-slate-400">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</div>
                    </td>

                    {/* Actor */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase mt-0.5 ${
                        isHO 
                          ? 'bg-purple-100 text-purple-800' 
                          : isCashier 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-slate-100 text-slate-700'
                      }`}>
                        {log.actorRole}
                      </span>
                    </td>

                    {/* Module */}
                    <td className="py-4 px-5 whitespace-nowrap">
                      <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                        {log.module}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-4 px-5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {log.action}
                    </td>

                    {/* Details */}
                    <td className="py-4 px-5 text-slate-700 leading-relaxed max-w-md">
                      {log.details}
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Ref ID: {log.id}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="py-12 text-center text-slate-400 text-xs">
            Tidak ada catatan audit yang cocok dengan filter pencarian Anda.
          </div>
        )}
      </div>
    </div>
  );
};
