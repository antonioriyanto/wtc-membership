import React, { useState } from 'react';
import { Member, Transaction } from '../types';
import { 
  X, 
  Edit3, 
  ShieldAlert, 
  ShieldCheck, 
  Trash2, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  Receipt, 
  CreditCard, 
  Award, 
  Sparkles, 
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  QrCode
} from 'lucide-react';
import { TierBadge, getTierStyle } from '../utils/tierBadge';

interface MemberPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  transactions?: Transaction[];
  onOpenEdit: (member: Member) => void;
  onToggleSuspend: (memberId: string) => void;
  onDelete: (memberId: string) => void;
  onOpenPointAdjust?: (member: Member) => void;
}

export const MemberPreviewModal: React.FC<MemberPreviewModalProps> = ({
  isOpen,
  onClose,
  member,
  transactions = [],
  onOpenEdit,
  onToggleSuspend,
  onDelete,
  onOpenPointAdjust
}) => {
  if (!isOpen || !member) return null;

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TRANSACTIONS' | 'SECURITY'>('OVERVIEW');
  const [isConfirmDelete, setIsConfirmDelete] = useState(false);

  const memberTrx = transactions.filter(t => 
    (t.memberId && t.memberId === member.id) || 
    (t.memberPhone && t.memberPhone === member.phone) ||
    (t.memberName && t.memberName.toLowerCase() === member.name.toLowerCase())
  );

  const initials = member.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isSuspended = member.status === 'SUSPENDED';
  const tierStyle = getTierStyle(member.tier);

  // Card theme gradients based on tier
  const getCardGradient = () => {
    switch (member.tier) {
      case 'BLACK':
        return 'from-slate-950 via-slate-900 to-zinc-950 border-amber-500/30 text-white';
      case 'PLATINUM':
        return 'from-slate-800 via-slate-700 to-slate-900 border-slate-400/40 text-white';
      case 'GOLD':
        return 'from-amber-700 via-amber-600 to-amber-800 border-amber-300/50 text-white';
      case 'SILVER':
        return 'from-slate-600 via-slate-500 to-slate-700 border-slate-300/40 text-white';
      default: // BLUE
        return 'from-blue-900 via-blue-800 to-slate-900 border-blue-400/40 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-slate-900 text-base sm:text-lg">Preview Kartu Member & CRM</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
              isSuspended 
                ? 'bg-rose-100 text-rose-800 border-rose-200' 
                : 'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {member.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEdit(member)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
              <span>Edit Member</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* DIGITAL MEMBERSHIP CARD */}
          <div className={`relative w-full rounded-2xl p-5 sm:p-6 bg-gradient-to-br shadow-xl border overflow-hidden ${getCardGradient()}`}>
            {/* Background Pattern */}
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
              <Award className="w-48 h-48" />
            </div>

            <div className="relative z-10 flex items-start justify-between">
              <div>
                <span className="text-[10px] tracking-[0.2em] uppercase opacity-75 font-mono">WATCH CLUB INDONESIA</span>
                <h4 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">{member.name}</h4>
                <div className="flex items-center gap-2 mt-1 font-mono text-xs opacity-80">
                  <span>ID: {member.membershipId}</span>
                  <span>•</span>
                  <span>Store: {member.registeredStore || 'Puri Jakarta'}</span>
                </div>
              </div>

              <div className="text-right">
                <TierBadge tier={member.tier} size="md" />
                <div className="mt-1 text-[10px] opacity-75">
                  Member sejak {member.joinDate ? member.joinDate.substring(0, 10) : '2024'}
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-8 flex items-end justify-between border-t border-white/10 mt-6">
              <div>
                <span className="text-[10px] tracking-wider uppercase opacity-70">Saldo Poin Loyalitas</span>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-300">
                  {(member.points || 0).toLocaleString('id-ID')} <span className="text-xs font-normal text-white/80">Pts</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] tracking-wider uppercase opacity-70">Total Transaksi</span>
                <div className="text-sm sm:text-base font-bold font-mono">
                  Rp {(member.totalSpend || 0).toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                activeTab === 'OVERVIEW'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Profil & Detail Kontak
            </button>
            <button
              onClick={() => setActiveTab('TRANSACTIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'TRANSACTIONS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Riwayat Transaksi ({memberTrx.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('SECURITY')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'SECURITY'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />
              <span>Keamanan & Password</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Lifetime Poin</span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    {(member.lifetimePoints || member.points).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Jenis Kelamin</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {member.gender || 'Pria'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Tanggal Lahir</span>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {member.birthDate ? new Date(member.birthDate).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Kunjungan Terakhir</span>
                  <div className="text-xs font-bold text-slate-900 mt-1">
                    {member.lastVisitDate ? member.lastVisitDate.substring(0, 10) : member.joinDate ? member.joinDate.substring(0, 10) : 'Hari ini'}
                  </div>
                </div>
              </div>

              {/* DETAILED INFO LIST */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> No. Handphone / WA:
                  </span>
                  <span className="font-mono font-bold text-slate-900">{member.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" /> Alamat Email:
                  </span>
                  <span className="font-bold text-slate-900">{member.email || '-'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Home Branch / Toko Asal:
                  </span>
                  <span className="font-bold text-slate-900">{member.registeredStore}</span>
                </div>
                <div className="flex items-start justify-between gap-4 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-400 shrink-0 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Alamat Lengkap:
                  </span>
                  <span className="font-medium text-slate-800 text-right">{member.address || 'Belum diisi'}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSACTIONS */}
          {activeTab === 'TRANSACTIONS' && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Daftar Transaksi Kasir</span>
                <span className="text-slate-400 font-medium">{memberTrx.length} struk tercatat</span>
              </div>

              {memberTrx.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs">
                  Belum ada riwayat transaksi yang tercatat untuk member ini di cabang manapun.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {memberTrx.map((trx) => (
                    <div 
                      key={trx.id}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100/70 border border-slate-100 rounded-xl flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{trx.receiptNo}</span>
                          <span className="px-1.5 py-0.5 bg-slate-200/80 rounded text-[10px] font-mono text-slate-700">
                            {trx.type}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {trx.storeName} • {trx.timestamp} • Kasir: {trx.cashierName || 'Staff'}
                        </div>
                        {trx.notes && (
                          <div className="text-[11px] text-slate-600 italic mt-0.5">{trx.notes}</div>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-bold text-slate-900 font-mono">
                          Rp {(trx.amount || 0).toLocaleString('id-ID')}
                        </div>
                        <div className={`font-bold font-mono text-xs ${
                          trx.pointsDelta > 0 ? 'text-emerald-600' : 'text-rose-500'
                        }`}>
                          {trx.pointsDelta > 0 ? `+${trx.pointsDelta}` : trx.pointsDelta} Pts
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === 'SECURITY' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Password Login Member:</span>
                  <span className="font-mono font-bold bg-white px-3 py-1 rounded-lg border border-slate-200 text-slate-800">
                    {member.password || 'watchclub123'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 font-medium">Status Akun:</span>
                  <span className={`font-bold ${isSuspended ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isSuspended ? 'DITANGGUHKAN (SUSPENDED)' : 'AKTIF BEROPERASI'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggleSuspend(member.id)}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
                    isSuspended
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isSuspended ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                  <span>{isSuspended ? 'Aktifkan Kembali Akun' : 'Suspend / Bekukan Akun'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenEdit(member)}
                  className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4 text-amber-400" />
                  <span>Ganti Password & Detail</span>
                </button>
              </div>

              {/* DANGER CONFIRM DELETE */}
              <div className="pt-2 border-t border-slate-100">
                {!isConfirmDelete ? (
                  <button
                    onClick={() => setIsConfirmDelete(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Akun Member Ini</span>
                  </button>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                    <p className="text-xs text-rose-800 font-medium">
                      Yakin ingin menghapus akun <strong>{member.name}</strong> ({member.membershipId})? Tindakan ini tidak dapat dibatalkan.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onDelete(member.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
                      >
                        Ya, Hapus Sekarang
                      </button>
                      <button
                        onClick={() => setIsConfirmDelete(false)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          {onOpenPointAdjust && (
            <button
              onClick={() => {
                onClose();
                onOpenPointAdjust(member);
              }}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
              <span>Adjust Saldo Poin</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => onOpenEdit(member)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Detail</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
