import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  Send, 
  ShieldCheck, 
  X, 
  Store, 
  Receipt, 
  Phone, 
  Coins, 
  ArrowUpRight, 
  Check, 
  Sparkles,
  ChevronRight,
  HelpCircle
} from 'lucide-react';
import { SupportTicket, Member, StoreBranch } from '../types';
import { TierBadge } from '../utils/tierBadge';

interface SupportTicketsTabProps {
  tickets: SupportTicket[];
  onUpdateTicket: (updated: SupportTicket) => void;
  onDirectPointAdjustment: (memberId: string, pointsDelta: number, note: string, ticketId: string) => Promise<boolean>;
  members: Member[];
  stores: StoreBranch[];
  isSkeletonLoading?: boolean;
}

export const SupportTicketsTab: React.FC<SupportTicketsTabProps> = ({
  tickets,
  onUpdateTicket,
  onDirectPointAdjustment,
  members,
  stores,
  isSkeletonLoading = false
}) => {
  if (isSkeletonLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'MEMBER' | 'CASHIER'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH_OR_CRITICAL' | 'MEDIUM' | 'LOW'>('ALL');
  
  // Active modal/drawer
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);

  // Form states in detail drawer
  const [assignedAgent, setAssignedAgent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [adjustPoints, setAdjustPoints] = useState<number>(500);
  const [adjustReason, setAdjustReason] = useState('Kompensasi kendala loyalty sesuai tiket');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [adjustSuccessMsg, setAdjustSuccessMsg] = useState<string | null>(null);

  const availableAgents = [
    'Dimas (Support HO)',
    'Sarah (Customer Care Specialist)',
    'Bambang (IT & Store Systems)',
    'Bayu (Lead Loyalty Tech)'
  ];

  const handleOpenDetail = (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setAssignedAgent(ticket.assignedTo || availableAgents[0]);
    setReplyText('');
    setAdjustSuccessMsg(null);
  };

  // Filter tickets
  const filteredTickets = tickets.filter(t => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSubject = t.subject.toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      const matchMember = (t.memberName || '').toLowerCase().includes(q);
      const matchStore = (t.storeName || '').toLowerCase().includes(q);
      const matchReceipt = (t.receiptNo || '').toLowerCase().includes(q);
      if (!matchSubject && !matchId && !matchMember && !matchStore && !matchReceipt) return false;
    }

    // Status filter
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;

    // Source filter
    if (sourceFilter !== 'ALL' && t.source !== sourceFilter) return false;

    // Priority filter
    if (priorityFilter === 'HIGH_OR_CRITICAL' && t.priority !== 'HIGH' && t.priority !== 'CRITICAL') return false;
    if (priorityFilter === 'MEDIUM' && t.priority !== 'MEDIUM') return false;
    if (priorityFilter === 'LOW' && t.priority !== 'LOW') return false;

    return true;
  });

  // Top summary stats
  const openCount = tickets.filter(t => t.status === 'OPEN').length;
  const inProgressCount = tickets.filter(t => t.status === 'IN_PROGRESS').length;
  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length;
  const urgentCount = tickets.filter(t => (t.priority === 'HIGH' || t.priority === 'CRITICAL') && t.status !== 'RESOLVED' && t.status !== 'CLOSED').length;

  // Handle assign agent
  const handleAssignAgent = (agentName: string) => {
    if (!activeTicket) return;
    const updated: SupportTicket = {
      ...activeTicket,
      assignedTo: agentName,
      status: activeTicket.status === 'OPEN' ? 'IN_PROGRESS' : activeTicket.status,
      updatedAt: new Date().toISOString(),
      messages: [
        ...activeTicket.messages,
        {
          sender: 'SYSTEM',
          text: `Petugas ditugaskan ke: ${agentName}`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    onUpdateTicket(updated);
    setActiveTicket(updated);
    setAssignedAgent(agentName);
  };

  // Handle status update
  const handleStatusChange = (nextStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') => {
    if (!activeTicket) return;
    const statusLabel = 
      nextStatus === 'IN_PROGRESS' ? 'Sedang Diproses' :
      nextStatus === 'RESOLVED' ? 'Selesai / Resolved' :
      nextStatus === 'CLOSED' ? 'Ditutup' : 'Dibuka Kembali';

    const updated: SupportTicket = {
      ...activeTicket,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
      messages: [
        ...activeTicket.messages,
        {
          sender: 'SYSTEM',
          text: `Status tiket diubah menjadi: ${statusLabel}`,
          timestamp: new Date().toISOString()
        }
      ]
    };
    onUpdateTicket(updated);
    setActiveTicket(updated);
  };

  // Handle sending reply message
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;

    const newMsg = {
      sender: 'AGENT' as const,
      text: replyText.trim(),
      timestamp: new Date().toISOString()
    };

    const updated: SupportTicket = {
      ...activeTicket,
      updatedAt: new Date().toISOString(),
      messages: [...activeTicket.messages, newMsg]
    };

    onUpdateTicket(updated);
    setActiveTicket(updated);
    setReplyText('');
  };

  // Handle direct point adjustment
  const handleExecutePointAdjustment = async () => {
    if (!activeTicket || !activeTicket.memberId) return;
    setIsAdjusting(true);
    setAdjustSuccessMsg(null);

    const success = await onDirectPointAdjustment(
      activeTicket.memberId,
      adjustPoints,
      adjustReason,
      activeTicket.id
    );

    setIsAdjusting(false);

    if (success) {
      const deltaSign = adjustPoints >= 0 ? `+${adjustPoints}` : `${adjustPoints}`;
      setAdjustSuccessMsg(`Berhasil! ${deltaSign} Pts telah dikreditkan ke saldo member.`);

      const updated: SupportTicket = {
        ...activeTicket,
        status: 'RESOLVED',
        updatedAt: new Date().toISOString(),
        adjustmentMade: {
          pointsDelta: adjustPoints,
          timestamp: new Date().toISOString(),
          adminName: assignedAgent || 'Superadmin HO',
          note: adjustReason
        },
        messages: [
          ...activeTicket.messages,
          {
            sender: 'SYSTEM',
            text: `[PENYESUAIAN POIN SELESAI] Penyesuaian ${deltaSign} Pts berhasil disalurkan ke akun member oleh ${assignedAgent || 'Superadmin HO'}. Tiket otomatis ditandai SELESAI.`,
            timestamp: new Date().toISOString()
          }
        ]
      };

      onUpdateTicket(updated);
      setActiveTicket(updated);
    }
  };

  // Find linked member for active ticket
  const linkedMember = activeTicket?.memberId 
    ? members.find(m => m.id === activeTicket.memberId || m.phone === activeTicket.memberPhone)
    : null;

  return (
    <div className="animate-fadeIn space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-slate-900">Support Tickets Center</h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              {tickets.length} Tiket Terdaftar
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Pusat penanganan kendala & komplain dari Member dan Kasir Toko di seluruh Indonesia, dilengkapi penyesuaian poin otomatis.
          </p>
        </div>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>TIKET MASUK (OPEN)</span>
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-blue-700">{openCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Perlu ditinjau & ditugaskan</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>SEDANG DIPROSES</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{inProgressCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Dalam investigasi petugas HO</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>SELESAI (RESOLVED)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Solusi & poin disalurkan</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>URGENSI TINGGI</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-600">{urgentCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Prioritas tinggi / kritis</div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari ID tiket, nama member, no HP, toko cabang, struk, atau judul..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors" 
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {[
                { id: 'ALL', label: 'Semua' },
                { id: 'OPEN', label: 'Open' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
                { id: 'RESOLVED', label: 'Resolved' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    statusFilter === st.id 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Source pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              {[
                { id: 'ALL', label: 'Semua Sumber' },
                { id: 'MEMBER', label: '👤 Member' },
                { id: 'CASHIER', label: '🏪 Kasir' }
              ].map(src => (
                <button
                  key={src.id}
                  onClick={() => setSourceFilter(src.id as any)}
                  className={`px-2.5 py-1 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                    sourceFilter === src.id 
                      ? 'bg-white text-slate-900 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TICKETS TABLE */}
      <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-5">ID & Subjek Tiket</th>
                <th className="py-3.5 px-5">Sumber Pelapor</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Prioritas</th>
                <th className="py-3.5 px-5">Petugas HO</th>
                <th className="py-3.5 px-5">Waktu Lapor</th>
                <th className="py-3.5 px-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">Tidak ada tiket bantuan ditemukan</p>
                    <p className="text-xs text-slate-400">Silakan ubah filter status atau pencarian.</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => {
                  const isFromMember = t.source === 'MEMBER';
                  const isCritical = t.priority === 'HIGH' || t.priority === 'CRITICAL';

                  return (
                    <tr 
                      key={t.id} 
                      onClick={() => handleOpenDetail(t)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      {/* Subject & ID */}
                      <td className="py-4 px-5">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {t.subject}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {t.id}
                          </span>
                          {t.category && (
                            <span className="text-[10px] text-slate-500 uppercase font-semibold">
                              • {t.category.replace('_', ' ')}
                            </span>
                          )}
                          {t.receiptNo && (
                            <span className="text-[10px] text-emerald-700 font-mono bg-emerald-50 px-1 rounded">
                              Struk: {t.receiptNo}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          {isFromMember ? (
                            <>
                              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px]">
                                Member
                              </span>
                              <span>{t.memberName || 'Pelanggan'}</span>
                            </>
                          ) : (
                            <>
                              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded text-[10px]">
                                Kasir Toko
                              </span>
                              <span>{t.storeName || 'Cabang Watch Club'}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                          {isFromMember ? (t.memberPhone || t.memberId) : `Kasir: ${t.cashierName || 'Staff'}`}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-5">
                        <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider flex items-center w-fit gap-1
                          ${t.status === 'OPEN' ? 'bg-blue-100 text-blue-700 border border-blue-200' : 
                            t.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 border border-amber-200' : 
                            t.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            'bg-slate-100 text-slate-600 border border-slate-200'}
                        `}>
                          {t.status === 'RESOLVED' && <CheckCircle2 className="w-3 h-3" />}
                          {t.status === 'IN_PROGRESS' && <Clock className="w-3 h-3" />}
                          {t.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-4 px-5">
                        <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider
                          ${isCritical ? 'text-red-600' : 
                            t.priority === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600'}
                        `}>
                          {isCritical && <AlertCircle className="w-3.5 h-3.5" />}
                          {t.priority}
                        </div>
                      </td>

                      {/* Assigned Agent */}
                      <td className="py-4 px-5">
                        {t.assignedTo ? (
                          <div className="flex items-center gap-1 text-slate-800 font-semibold">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{t.assignedTo.split(' ')[0]}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum ditugaskan</span>
                        )}
                      </td>

                      {/* Timestamp */}
                      <td className="py-4 px-5 text-slate-500">
                        {new Date(t.createdAt).toLocaleString('id-ID', { 
                          day: '2-digit', 
                          month: 'short', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(t);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                        >
                          Kelola
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & ACTION DRAWER / MODAL */}
      {activeTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-scaleUp overflow-hidden">
            {/* MODAL HEADER */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {activeTicket.id}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${
                    activeTicket.source === 'MEMBER' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activeTicket.source === 'MEMBER' ? 'Laporan Member' : 'Laporan Kasir Toko'}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                    activeTicket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                    activeTicket.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {activeTicket.status.replace('_', ' ')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900">{activeTicket.subject}</h3>
              </div>

              <button 
                onClick={() => setActiveTicket(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* MODAL BODY */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* SENDER INFO SUMMARY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Pelapor</div>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {activeTicket.memberName || activeTicket.storeName}
                  </div>
                  <div className="text-slate-500 mt-0.5 font-mono">
                    {activeTicket.memberPhone || `Kasir: ${activeTicket.cashierName || 'Staff'}`}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Cabang Toko / Struk</div>
                  <div className="font-bold text-slate-800 mt-0.5">
                    {activeTicket.storeName || 'Watch Club Online'}
                  </div>
                  {activeTicket.receiptNo && (
                    <div className="text-emerald-700 font-mono font-bold mt-0.5">
                      No. Struk: {activeTicket.receiptNo}
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 1: ASSIGN TECHNICIAN / AGENT */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Petugas Penanggung Jawab (Assignee HO)</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Status saat ini: <strong>{activeTicket.assignedTo || 'Belum Ditugaskan'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <select
                    value={assignedAgent}
                    onChange={(e) => setAssignedAgent(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {availableAgents.map(ag => (
                      <option key={ag} value={ag}>{ag}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleAssignAgent(assignedAgent)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Simpan Petugas
                  </button>
                </div>
              </div>

              {/* SECTION 2: ONE-CLICK POINT ADJUSTMENT (FOR LOYALTY COMPLAINTS) */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 rounded-2xl border border-amber-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">Penyesuaian Poin Langsung (Direct Adjustment)</h4>
                      <p className="text-[11px] text-slate-600">
                        Tambahkan atau kurangkan saldo poin pelanggan secara instan dari tiket ini.
                      </p>
                    </div>
                  </div>

                  {linkedMember && (
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 font-bold uppercase">Saldo Saat Ini</div>
                      <div className="font-bold text-emerald-700 text-xs font-mono">
                        {linkedMember.points.toLocaleString('id-ID')} Pts
                      </div>
                    </div>
                  )}
                </div>

                {adjustSuccessMsg && (
                  <div className="p-2.5 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 font-bold text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{adjustSuccessMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Jumlah Poin (+ / -)
                    </label>
                    <input 
                      type="number" 
                      value={adjustPoints}
                      onChange={(e) => setAdjustPoints(parseInt(e.target.value) || 0)}
                      placeholder="+500 atau -100"
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      Alasan / Keterangan Penyesuaian
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={adjustReason}
                        onChange={(e) => setAdjustReason(e.target.value)}
                        placeholder="Contoh: Kompensasi poin struk INV-092..."
                        className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <button
                        onClick={handleExecutePointAdjustment}
                        disabled={isAdjusting || adjustPoints === 0 || !activeTicket.memberId}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                      >
                        {isAdjusting ? 'Memproses...' : 'Kreditkan Poin'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: MESSAGES & SYSTEM LOG HISTORY */}
              <div className="space-y-3">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider text-slate-400">
                  Riwayat Diskusi & Log Solusi
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  {activeTicket.messages.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic">
                      Belum ada pesan tercatat. Mulai diskusi atau berikan solusi di bawah.
                    </div>
                  ) : (
                    activeTicket.messages.map((msg, idx) => {
                      const isAgent = msg.sender === 'AGENT';
                      const isSystem = msg.sender === 'SYSTEM';

                      if (isSystem) {
                        return (
                          <div key={idx} className="p-2 bg-slate-200/70 rounded-xl text-slate-700 text-[11px] font-medium flex items-center gap-2">
                            <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{msg.text}</span>
                            <span className="ml-auto text-[10px] text-slate-400 whitespace-nowrap">
                              {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={idx} 
                          className={`p-3 rounded-2xl max-w-[85%] ${
                            isAgent 
                              ? 'ml-auto bg-slate-900 text-white rounded-tr-xs' 
                              : 'mr-auto bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-xs'
                          }`}
                        >
                          <div className={`text-[10px] font-bold mb-1 ${isAgent ? 'text-slate-300' : 'text-blue-600'}`}>
                            {isAgent ? (activeTicket.assignedTo || 'Tim HO') : (activeTicket.memberName || 'Pelapor')}
                          </div>
                          <p className="leading-relaxed">{msg.text}</p>
                          <div className={`text-[10px] mt-1 text-right ${isAgent ? 'text-slate-400' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* REPLY INPUT */}
                <form onSubmit={handleSendReply} className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik balasan atau catatan investigasi teknis..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim</span>
                  </button>
                </form>
              </div>
            </div>

            {/* MODAL FOOTER: STATUS ACTIONS */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Ubah Status:</span>
                {activeTicket.status !== 'IN_PROGRESS' && (
                  <button
                    onClick={() => handleStatusChange('IN_PROGRESS')}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Proses (In Progress)
                  </button>
                )}
                {activeTicket.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange('RESOLVED')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Selesaikan (Resolved)
                  </button>
                )}
                {activeTicket.status === 'RESOLVED' && (
                  <button
                    onClick={() => handleStatusChange('CLOSED')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Tutup Tiket (Closed)
                  </button>
                )}
              </div>

              <button
                onClick={() => setActiveTicket(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition-colors cursor-pointer"
              >
                Selesai / Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
