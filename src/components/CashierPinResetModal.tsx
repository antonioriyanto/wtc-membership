import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  X, 
  AlertCircle, 
  KeyRound, 
  RefreshCw, 
  CheckCircle2, 
  Copy, 
  Check, 
  UserCheck, 
  FileCheck2, 
  Lock,
  Unlock,
  Building2,
  User
} from 'lucide-react';
import { Member, StoreBranch } from '../types';
import { cashierAssistedPinResetClient } from '../lib/memberAuthClient';
import { toE164, isAccountLocked } from '../lib/canonicalMember';

interface CashierPinResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member | null;
  currentStore?: StoreBranch;
  cashierUsername?: string;
  onSuccess: (updatedMember: Member) => void;
}

export const CashierPinResetModal: React.FC<CashierPinResetModalProps> = ({
  isOpen,
  onClose,
  member,
  currentStore,
  cashierUsername = 'Kasir Resmi',
  onSuccess
}) => {
  const [mode, setMode] = useState<'TEMPORARY_PIN' | 'DIRECT_CUSTOMER_PIN'>('TEMPORARY_PIN');
  const [temporaryPin, setTemporaryPin] = useState<string>('');
  const [directPin, setDirectPin] = useState<string>('');
  const [directPinConfirm, setDirectPinConfirm] = useState<string>('');
  
  // Physical Verification Fields
  const [idVerified, setIdVerified] = useState<boolean>(false);
  const [docType, setDocType] = useState<'KTP' | 'SIM' | 'PASPOR'>('KTP');
  const [notes, setNotes] = useState<string>('');
  
  // State handling
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successResult, setSuccessResult] = useState<{
    member: Member;
    pin: string;
    isTemporary: boolean;
  } | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Generate random 6-digit numeric PIN
  const generateRandomPin = () => {
    const random6 = Math.floor(100000 + Math.random() * 900000).toString();
    setTemporaryPin(random6);
  };

  // Reset modal states whenever opened
  useEffect(() => {
    if (isOpen && member) {
      generateRandomPin();
      setDirectPin('');
      setDirectPinConfirm('');
      setIdVerified(false);
      setNotes('');
      setError('');
      setSuccessResult(null);
      setCopied(false);
      setMode('TEMPORARY_PIN');
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const { locked, remainingSeconds } = isAccountLocked(member);

  const handleCopyPin = () => {
    const pinToCopy = successResult?.pin || temporaryPin;
    if (pinToCopy) {
      navigator.clipboard.writeText(pinToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!idVerified) {
      setError('Verifikasi fisik wajib dicentang setelah Anda memeriksa identitas asli member.');
      return;
    }

    let targetPin = '';
    if (mode === 'TEMPORARY_PIN') {
      if (!temporaryPin || temporaryPin.length !== 6 || !/^\d{6}$/.test(temporaryPin)) {
        setError('PIN sementara harus terdiri dari 6 angka numerik.');
        return;
      }
      targetPin = temporaryPin;
    } else {
      if (!directPin || directPin.length !== 6 || !/^\d{6}$/.test(directPin)) {
        setError('PIN baru harus terdiri dari 6 angka numerik.');
        return;
      }
      if (directPin !== directPinConfirm) {
        setError('Konfirmasi PIN tidak cocok dengan PIN baru.');
        return;
      }
      targetPin = directPin;
    }

    setIsLoading(true);

    try {
      const storeId = currentStore?.id || currentStore?.code || 'STR-BOUTIQUE';
      const storeName = currentStore?.name || 'Butik Watch Club';

      const updated = await cashierAssistedPinResetClient({
        memberId: member.id,
        cashierUsername,
        storeId,
        storeName,
        idDocumentVerified: true,
        notes: `Dokumen: ${docType}. Catatan: ${notes || 'Reset PIN berbantuan kasir di butik.'}`,
        mode,
        newPin: targetPin
      });

      // Synchronize with parent
      const updatedMemberModel: Member = {
        ...member,
        ...updated,
        pinHash: updated.pinHash,
        pinSalt: updated.pinSalt,
        isPinSet: true,
        failedPinAttempts: 0,
        lockedUntil: null,
        forcePinChangeOnNextLogin: mode === 'TEMPORARY_PIN',
        tempPinExpiresAt: mode === 'TEMPORARY_PIN' ? updated.tempPinExpiresAt : null
      };

      setSuccessResult({
        member: updatedMemberModel,
        pin: targetPin,
        isTemporary: mode === 'TEMPORARY_PIN'
      });

      onSuccess(updatedMemberModel);
    } catch (err: any) {
      console.error('Cashier reset error:', err);
      setError(err?.message || 'Gagal mereset PIN member. Periksa koneksi data.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="modal-cashier-pin-override"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl text-slate-100 space-y-5 my-auto">
        
        {/* MODAL HEADER */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Otorisasi Reset PIN Kasir</h3>
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Peran Kasir
                </span>
              </div>
              <p className="text-xs text-slate-400">Protokol keamanan resmi pemulihan PIN di gerai butik</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AUDIT ACTOR BANNER */}
        <div className="grid grid-cols-2 gap-2 text-[11px] p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Kasir: <strong className="text-white">{cashierUsername}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Butik: <strong className="text-emerald-400">{currentStore?.name || 'Puri Jakarta'}</strong></span>
          </div>
        </div>

        {/* SUCCESS CONFIRMATION STATE */}
        {successResult ? (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">PIN Berhasil Direset & Akun Terbuka</h4>
                <p className="text-xs text-emerald-300 mt-0.5">
                  Seluruh lockout brute-force telah dibersihkan dan audit keamanan tersimpan.
                </p>
              </div>

              {/* PIN DISPLAY BOX */}
              <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
                  {successResult.isTemporary ? 'PIN SEMENTARA MEMBER (Aktif 24 Jam)' : 'PIN BARU MEMBER'}
                </span>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-mono text-3xl font-extrabold tracking-widest text-amber-400">
                    {successResult.pin}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    title="Salin PIN"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                {successResult.isTemporary && (
                  <p className="text-[11px] text-amber-300/90 leading-relaxed font-medium pt-1">
                    Member wajib mengganti PIN ini saat pertama kali login di Web PWA (point.watchclub.co.id).
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Selesai & Tutup Jendela
            </button>
          </div>
        ) : (
          /* FORM BODY */
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* MEMBER SNAPSHOT & SECURITY STATUS */}
            <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nama Member:</span>
                <span className="font-semibold text-white">{member.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Nomor Handphone:</span>
                <span className="font-mono font-bold text-amber-400">{toE164(member.phone)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">ID Keanggotaan:</span>
                <span className="font-mono text-slate-300">{member.membershipId}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                <span className="text-slate-400">Status Keamanan:</span>
                {locked ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 text-[10px]">
                    <Lock className="w-3 h-3" /> TERKUNCI (5x Salah)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> Akun Normal ({member.failedPinAttempts || 0}/5 gagal)
                  </span>
                )}
              </div>
            </div>

            {/* ERROR NOTIFICATION */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* PHYSICAL VERIFICATION PROTOCOL (MANDATORY) */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <UserCheck className="w-4 h-4 text-amber-400" />
                <span>Verifikasi Identitas Fisik Wajib (SOP Butik)</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Dokumen Asli:</span>
                {(['KTP', 'SIM', 'PASPOR'] as const).map(dt => (
                  <button
                    key={dt}
                    type="button"
                    onClick={() => setDocType(dt)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      docType === dt 
                        ? 'bg-amber-500 text-slate-950' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  id="chk-physical-id-verified"
                  checked={idVerified}
                  onChange={(e) => setIdVerified(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-[11px] text-slate-300 leading-tight select-none">
                  Saya telah memeriksa kartu identitas fisik asli member (<strong className="text-amber-400">{docType}</strong>) dan memastikan kecocokan identitas dengan akun Watch Club.
                </span>
              </label>

              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan verifikasi (opsional, contoh: NIK sesuai, HP baru)"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* RESET MODE TABS */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Metode Reset PIN:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('TEMPORARY_PIN')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === 'TEMPORARY_PIN'
                      ? 'bg-slate-800 border-amber-500/60 shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">1. PIN Sementara</span>
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Member wajib ubah PIN saat login PWA (Paling Aman).
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('DIRECT_CUSTOMER_PIN')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    mode === 'DIRECT_CUSTOMER_PIN'
                      ? 'bg-slate-800 border-amber-500/60 shadow-xs'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">2. Input Bersama</span>
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Member menentukan PIN baru langsung di counter.
                  </p>
                </button>
              </div>
            </div>

            {/* MODE CONTENT */}
            {mode === 'TEMPORARY_PIN' ? (
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">PIN Sementara 6-Digit:</span>
                  <button
                    type="button"
                    onClick={generateRandomPin}
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Acak Ulang</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={temporaryPin}
                    onChange={(e) => setTemporaryPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1 font-mono text-center text-xl font-bold tracking-widest px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 focus:outline-none focus:border-amber-500"
                    placeholder="6 Digit PIN"
                  />
                  <button
                    type="button"
                    onClick={handleCopyPin}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Berikan 6-digit angka ini kepada member. Sistem akan memaksa pembuatan PIN baru saat member login.
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-2.5">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Ketik 6-Digit PIN Baru Member:</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={directPin}
                    onChange={(e) => setDirectPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full font-mono text-center text-lg font-bold tracking-widest px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    placeholder="••••••"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Konfirmasi Ulang PIN:</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={directPinConfirm}
                    onChange={(e) => setDirectPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full font-mono text-center text-lg font-bold tracking-widest px-4 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-emerald-500"
                    placeholder="••••••"
                  />
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                id="btn-cashier-submit-reset"
                disabled={isLoading || !idVerified}
                className="flex-[2] py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoading ? 'Memproses Reset...' : 'Eksekusi Reset PIN & Buka Akun'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
