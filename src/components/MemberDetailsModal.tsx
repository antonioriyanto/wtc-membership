import React from 'react';
import { Member, Transaction } from '../types';
import { X, Crown, Award, Phone, Mail, MapPin, Calendar, CreditCard, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { TierBadge, getTierStyle } from '../utils/tierBadge';

interface MemberDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  transactions: Transaction[];
  onOpenManualAdjust: (member: Member) => void;
}

export const MemberDetailsModal: React.FC<MemberDetailsModalProps> = ({
  isOpen,
  onClose,
  member,
  transactions,
  onOpenManualAdjust,
}) => {
  if (!isOpen || !member) return null;

  const memberTransactions = transactions.filter(t => t.memberId === member.id);
  const initials = member.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-base shadow-md border"
              style={{
                background: getTierStyle(member.tier).background,
                color: getTierStyle(member.tier).textColor,
                borderColor: getTierStyle(member.tier).borderColor
              }}
            >
              {initials}
            </div>
            <div>
              <h3 className="font-bold text-xl text-slate-900">{member.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-mono">ID: {member.membershipId}</span>
                <span className="text-slate-300">•</span>
                <TierBadge tier={member.tier} size="sm" />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Member Profile Stats */}
        <div className="grid grid-cols-3 gap-3 my-6">
          <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-100">
            <div className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Current Balance</div>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">
              {(member.points || 0).toLocaleString('id-ID')} Pts
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Lifetime Points</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">
              {(member.lifetimePoints || 0).toLocaleString('id-ID')} Pts
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Spend</div>
            <div className="text-lg font-bold text-slate-900 mt-0.5 truncate">
              Rp {(member.totalSpend / 1000000).toFixed(1)} Jt
            </div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-700 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Phone / WhatsApp:</span>
            <span className="font-semibold text-slate-900">{member.phone}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Email:</span>
            <span className="font-semibold text-slate-900">{member.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Home Store:</span>
            <span className="font-semibold text-slate-900">{member.registeredStore}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Member Since:</span>
            <span className="font-semibold text-slate-900">{member.joinDate}</span>
          </div>
          {member.address && (
            <div className="flex items-start justify-between gap-4 pt-1 border-t border-slate-200/60">
              <span className="text-slate-400 shrink-0">Address:</span>
              <span className="font-medium text-slate-800 text-right">{member.address}</span>
            </div>
          )}
        </div>

        {/* Multi-Store Transaction History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">Multi-Store Purchase History</h4>
            <span className="text-xs text-slate-400">{memberTransactions.length} logs recorded</span>
          </div>

          <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200/80 rounded-2xl p-1 bg-white">
            {memberTransactions.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No recent transactions recorded for this member.
              </div>
            ) : (
              memberTransactions.map((trx) => (
                <div key={trx.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 rounded-xl">
                  <div>
                    <div className="font-bold text-slate-900">{trx.storeName}</div>
                    <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                      {trx.receiptNo} • {trx.timestamp}
                    </div>
                    {trx.notes && (
                      <div className="text-slate-600 text-[11px] mt-0.5 italic">{trx.notes}</div>
                    )}
                  </div>
                  <div className={`font-bold font-mono text-sm ${
                    trx.pointsDelta > 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {trx.pointsDelta > 0 ? `+${trx.pointsDelta}` : trx.pointsDelta} Pts
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              onOpenManualAdjust(member);
            }}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Perform Point Adjustment</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
