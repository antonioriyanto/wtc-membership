import React, { useState, useEffect, useCallback } from 'react';
import { Lock, ShieldCheck, AlertCircle, X, Delete } from 'lucide-react';
import { Member } from '../types';
import { verifyCustomerPinClient } from '../lib/memberAuthClient';
import { isAccountLocked } from '../lib/canonicalMember';

interface CustomerPinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  actionTitle: string; // e.g. "Klaim Voucher Diskon" or "Tukar Poin Loyalitas"
  actionDetails?: string; // e.g. "Kode Voucher: WC-WELCOME20" or "Deduction: -50 Poin"
  onVerified: () => void;
}

export const CustomerPinPromptModal: React.FC<CustomerPinPromptModalProps> = ({
  isOpen,
  onClose,
  member,
  actionTitle,
  actionDetails,
  onVerified,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // Check initial lockout state when modal opens
  useEffect(() => {
    if (isOpen && member) {
      setPin('');
      setError('');
      const { locked, remainingSeconds } = isAccountLocked(member);
      if (locked && remainingSeconds > 0) {
        setLockoutSeconds(remainingSeconds);
      } else {
        setLockoutSeconds(0);
      }
    }
  }, [isOpen, member]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  const handleVerify = async (pinCandidate: string) => {
    if (pinCandidate.length !== 6 || isVerifying || lockoutSeconds > 0) return;
    setIsVerifying(true);
    setError('');

    try {
      // If member has no PIN set yet, allow initial cashier bypass with notice, OR prompt to set PIN
      if (!member.isPinSet && !member.pinHash) {
        // First time member without PIN at counter - inform cashier and proceed
        onVerified();
        onClose();
        return;
      }

      const res = await verifyCustomerPinClient(member.phone, pinCandidate);
      if (res.success) {
        onVerified();
        onClose();
      }
    } catch (err: any) {
      console.error('POS PIN verification error:', err);
      const msg = err?.message || 'PIN tidak valid.';
      setError(msg);
      setPin('');
      if (msg.includes('15 menit') || msg.includes('terkunci')) {
        setLockoutSeconds(15 * 60);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleKeypadPress = useCallback((digit: string) => {
    if (lockoutSeconds > 0 || isVerifying) return;
    if (pin.length < 6) {
      const next = pin + digit;
      setPin(next);
      if (next.length === 6) {
        handleVerify(next);
      }
    }
  }, [pin, lockoutSeconds, isVerifying, member]);

  const handleBackspace = () => {
    if (lockoutSeconds > 0 || isVerifying) return;
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (lockoutSeconds > 0 || isVerifying) return;
    setPin('');
  };

  // Physical keyboard listener
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, handleKeypadPress, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl p-6 text-white relative">
        
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          disabled={isVerifying}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* HEADER */}
        <div className="text-center pt-2 pb-1">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold tracking-tight">Otorisasi PIN Member</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Pelanggan wajib memasukkan 6-digit PIN untuk menyetujui transaksi ini.
          </p>
        </div>

        {/* ACTION DETAILS BOX */}
        <div className="my-3 p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Member</span>
            <span className="font-bold text-slate-200">{member.name}</span>
            <span className="text-[11px] text-slate-400 block font-mono">{member.membershipId} • {member.phone}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">{actionTitle}</span>
            <span className="font-semibold text-emerald-400">{actionDetails || 'Pengurangan Poin / Kuota'}</span>
          </div>
        </div>

        {/* ERROR BANNER */}
        {error && (
          <div className="bg-red-950/80 text-red-300 p-3 rounded-xl text-xs font-semibold mb-3 border border-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* LOCKOUT DISPLAY */}
        {lockoutSeconds > 0 ? (
          <div className="p-4 bg-red-950/50 border border-red-800 rounded-2xl text-center space-y-2 my-4">
            <span className="text-xs font-bold uppercase tracking-wider text-red-300 block">
              Akun Member Terkunci Sementara
            </span>
            <span className="text-2xl font-mono font-extrabold text-red-400 block">
              {formatTimer(lockoutSeconds)}
            </span>
            <p className="text-[11px] text-slate-400">
              5 kali percobaan PIN salah. Transaksi penukaran ditolak sampai kunci terbuka.
            </p>
          </div>
        ) : (
          <>
            {/* PIN DOTS */}
            <div className="flex justify-center items-center gap-3 my-5">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = idx < pin.length;
                const isCurrent = idx === pin.length;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                      isFilled
                        ? 'bg-amber-400 scale-110 shadow-[0_0_10px_rgba(251,191,36,0.6)]'
                        : isCurrent
                        ? 'border-2 border-amber-400 bg-slate-800 scale-105'
                        : 'border border-slate-700 bg-slate-950'
                    }`}
                  />
                );
              })}
            </div>

            {/* NUMERIC TOUCHPAD */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  disabled={isVerifying}
                  className="h-12 sm:h-13 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 border border-slate-700 text-lg font-bold text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                disabled={isVerifying || !pin}
                className="h-12 sm:h-13 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold uppercase text-slate-400 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                disabled={isVerifying}
                className="h-12 sm:h-13 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 text-lg font-bold text-white flex items-center justify-center border border-slate-700 cursor-pointer disabled:opacity-40"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isVerifying || !pin}
                className="h-12 sm:h-13 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 flex items-center justify-center cursor-pointer disabled:opacity-40"
              >
                <Delete className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </>
        )}

        {/* FOOTER ACTIONS */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white font-medium transition-colors"
          >
            Batalkan Transaksi
          </button>
          
          <button
            type="button"
            onClick={() => handleVerify(pin)}
            disabled={pin.length !== 6 || isVerifying || lockoutSeconds > 0}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? 'Memeriksa...' : 'Otorisasi'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
