import React, { useState } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Member } from '../types';

interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  onConfirmDelete: (memberId: string) => void;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({
  isOpen,
  onClose,
  member,
  onConfirmDelete
}) => {
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

  if (!isOpen || !member) return null;

  const handleExecuteDelete = () => {
    onConfirmDelete(member.id);
    setDeleteConfirmationText('');
    onClose();
  };

  const handleCancel = () => {
    setDeleteConfirmationText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[9999] p-4 animate-fadeIn">
      <div className="bg-white rounded-[24px] w-full max-w-[650px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] flex flex-col relative overflow-hidden">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors cursor-pointer z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="pr-4">
                <h4 className="text-base font-bold text-rose-900">Hapus Akun Member Secara Permanen</h4>
                <p className="text-[13px] text-rose-700 mt-1.5 leading-relaxed">
                  Menghapus akun <strong>{member.name}</strong> ({member.membershipId}) akan menghapus akun secara permanen dari database, termasuk hak poin sejumlah <strong>{(member.points || 0).toLocaleString('id-ID')} Pts</strong>, dan seluruh riwayat transaksi terkait otomatis dihapus dari sistem tanpa bisa dipulihkan.
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-rose-300 space-y-4 mt-2">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Konfirmasi Pengaman Diperlukan</span>
              </div>
              <p className="text-sm text-slate-600">
                Ketik <strong>HAPUS</strong> di bawah ini untuk mengonfirmasi bahwa Anda yakin ingin menghapus akun ini:
              </p>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="Ketik HAPUS"
                className="w-full px-4 py-3 text-sm border-2 border-rose-200 rounded-xl font-mono focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 focus:outline-none transition-all placeholder:text-slate-400"
              />
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={deleteConfirmationText !== 'HAPUS'}
                  onClick={handleExecuteDelete}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer flex-shrink-0"
                >
                  Ya, Hapus Akun Ini Permanen
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors flex-shrink-0"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
