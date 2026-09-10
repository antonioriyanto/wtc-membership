import React, { useState, useEffect } from 'react';
import { Member } from '../types';
import { X, SlidersHorizontal, AlertCircle, CheckCircle } from 'lucide-react';

interface ManualPointAdjustmentModalProps {
  isSubmitting?: boolean;
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  initialMember?: Member | null;
  onSubmitAdjustment: (memberId: string, pointsDelta: number, reason: string) => void;
}

export const ManualPointAdjustmentModal: React.FC<ManualPointAdjustmentModalProps> = ({ isSubmitting,
  isOpen,
  onClose,
  members,
  initialMember,
  onSubmitAdjustment,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [adjustType, setAdjustType] = useState<'ADD' | 'DEDUCT'>('ADD');
  const [pointsAmount, setPointsAmount] = useState<number>(100);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (initialMember) {
      setSelectedMemberId(initialMember.id);
    } else if (members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [initialMember, members, isOpen]);

  if (!isOpen) return null;

  const currentMember = members.find(m => m.id === selectedMemberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) {
      setError('Please select a member.');
      return;
    }
    if (!reason.trim()) {
      setError('A valid audit reason is mandatory for all Head Office point adjustments.');
      return;
    }
    if (pointsAmount <= 0) {
      setError('Points amount must be greater than zero.');
      return;
    }

    const finalDelta = adjustType === 'ADD' ? pointsAmount : -pointsAmount;
    if (adjustType === 'DEDUCT' && currentMember && currentMember.points < pointsAmount) {
      setError(`Cannot deduct more points than current balance (${currentMember.points.toLocaleString('id-ID')} Pts).`);
      return;
    }

    onSubmitAdjustment(selectedMemberId, finalDelta, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Head Office Point Adjustment</h3>
              <p className="text-xs text-slate-500">Authorized manual balance override with audit log</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-5">
          {/* Member Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Member
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => { setSelectedMemberId(e.target.value); setError(''); }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.phone}) - Current: {m.points.toLocaleString('id-ID')} Pts [{m.tier}]
                </option>
              ))}
            </select>
          </div>

          {currentMember && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">Current Balance:</span>
              <span className="font-bold text-slate-900 font-mono">{currentMember.points.toLocaleString('id-ID')} Pts</span>
            </div>
          )}

          {/* Action Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustType('ADD')}
                className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  adjustType === 'ADD'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                + Add / Credit Points
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('DEDUCT')}
                className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                  adjustType === 'DEDUCT'
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                - Deduct Points
              </button>
            </div>
          </div>

          {/* Points Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Points Delta Amount
            </label>
            <input
              type="text"
              value={pointsAmount ? pointsAmount.toLocaleString('id-ID') : ''}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (!val) {
                  setPointsAmount(0);
                  return;
                }
                setPointsAmount(parseInt(val));
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
            />
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mandatory Audit Reason
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              placeholder="E.g., Customer compensation for delayed invoice sync at Puri Indah Mall"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-800"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-md transition-all"
            >
              Confirm & Post to Ledger
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
