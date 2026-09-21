import React, { useState, useEffect, useCallback } from 'react';
import { WatchClubLogo } from './WatchClubLogo';
import { 
  Smartphone, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  AlertCircle, 
  ArrowLeft, 
  CheckCircle2, 
  Delete, 
  Fingerprint, 
  HelpCircle, 
  Store, 
  X, 
  ShieldAlert,
  Mail
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { toE164 } from '../lib/canonicalMember';
import { 
  precheckCustomer, 
  verifyCustomerPinClient, 
  setCustomerPinClient, 
  resetPinViaGoogleAuthClient,
  PrecheckResult 
} from '../lib/memberAuthClient';

interface MemberLoginProps {
  onLogin: (memberId: string, memberObj?: any) => void;
  onRegisterGoogle: (phone: string) => Promise<void>;
  members: any[];
}

type LoginStep = 
  | 'PHONE' 
  | 'PIN_INPUT' 
  | 'FIRST_PIN_CREATE' 
  | 'FIRST_PIN_CONFIRM' 
  | 'FIRST_PIN_LINK_GOOGLE' 
  | 'RESET_PIN_CREATE'
  | 'RESET_PIN_CONFIRM'
  | 'MANDATORY_PIN_CHANGE_CREATE'
  | 'MANDATORY_PIN_CHANGE_CONFIRM';

export const MemberLogin: React.FC<MemberLoginProps> = ({ onLogin, onRegisterGoogle, members = [] }) => {
  const [step, setStep] = useState<LoginStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Member Context from Pre-check
  const [memberInfo, setMemberInfo] = useState<PrecheckResult | null>(null);
  
  // Lockout countdown
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);

  // Recovery Modal State
  const [isRecoveryModalOpen, setIsRecoveryModalOpen] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');

  // PIN inputs
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [createdPin, setCreatedPin] = useState<string>('');
  const [confirmedPin, setConfirmedPin] = useState<string>('');
  
  // Google Recovery context
  const [verifiedGoogleAuth, setVerifiedGoogleAuth] = useState<{ uid: string; email: string } | null>(null);

  // Countdown timer effect
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Format seconds to mm:ss
  const formatLockoutTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainder = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  // Handle Step 1: Submit Phone Number
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setError('Silakan masukkan nomor ponsel Anda.');
      return;
    }

    const localDigits = cleanPhone.replace(/[^0-9]/g, '');
    if (localDigits.length < 8) {
      setError('Nomor ponsel tidak valid (minimal 8-10 digit angka).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const result = await precheckCustomer(cleanPhone, members);
      setMemberInfo(result);

      if (!result.exists) {
        setError(`Maaf, nomor ponsel ${cleanPhone} belum terdaftar. Mari bergabung bersama kami.`);
        return;
      }

      // Check lockout status
      if (result.isLocked && result.remainingLockoutSeconds > 0) {
        setLockoutSeconds(result.remainingLockoutSeconds);
        setStep('PIN_INPUT');
        return;
      }

      // If PIN is already configured
      if (result.isPinSet) {
        setEnteredPin('');
        setStep('PIN_INPUT');
      } else {
        // First-Time PIN Setup Onboarding
        setCreatedPin('');
        setConfirmedPin('');
        setStep('FIRST_PIN_CREATE');
      }
    } catch (err: any) {
      console.error('Pre-check error:', err);
      setError('Gagal memverifikasi status akun member. Periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  };

  // Keypad actions
  const handleKeypadPress = useCallback((digit: string) => {
    if (lockoutSeconds > 0 || loading) return;

    if (step === 'PIN_INPUT') {
      if (enteredPin.length < 6) {
        const next = enteredPin + digit;
        setEnteredPin(next);
        if (next.length === 6) {
          // Auto submit on 6th digit
          submitPinVerification(next);
        }
      }
    } else if (step === 'FIRST_PIN_CREATE' || step === 'RESET_PIN_CREATE' || step === 'MANDATORY_PIN_CHANGE_CREATE') {
      if (createdPin.length < 6) {
        setCreatedPin(prev => prev + digit);
      }
    } else if (step === 'FIRST_PIN_CONFIRM' || step === 'RESET_PIN_CONFIRM' || step === 'MANDATORY_PIN_CHANGE_CONFIRM') {
      if (confirmedPin.length < 6) {
        setConfirmedPin(prev => prev + digit);
      }
    }
  }, [step, enteredPin, createdPin, confirmedPin, lockoutSeconds, loading]);

  const handleKeypadBackspace = () => {
    if (lockoutSeconds > 0 || loading) return;
    if (step === 'PIN_INPUT') {
      setEnteredPin(prev => prev.slice(0, -1));
    } else if (step === 'FIRST_PIN_CREATE' || step === 'RESET_PIN_CREATE' || step === 'MANDATORY_PIN_CHANGE_CREATE') {
      setCreatedPin(prev => prev.slice(0, -1));
    } else if (step === 'FIRST_PIN_CONFIRM' || step === 'RESET_PIN_CONFIRM' || step === 'MANDATORY_PIN_CHANGE_CONFIRM') {
      setConfirmedPin(prev => prev.slice(0, -1));
    }
  };

  const handleKeypadClear = () => {
    if (lockoutSeconds > 0 || loading) return;
    if (step === 'PIN_INPUT') {
      setEnteredPin('');
    } else if (step === 'FIRST_PIN_CREATE' || step === 'RESET_PIN_CREATE' || step === 'MANDATORY_PIN_CHANGE_CREATE') {
      setCreatedPin('');
    } else if (step === 'FIRST_PIN_CONFIRM' || step === 'RESET_PIN_CONFIRM' || step === 'MANDATORY_PIN_CHANGE_CONFIRM') {
      setConfirmedPin('');
    }
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([
        'PIN_INPUT', 
        'FIRST_PIN_CREATE', 
        'FIRST_PIN_CONFIRM', 
        'RESET_PIN_CREATE', 
        'RESET_PIN_CONFIRM',
        'MANDATORY_PIN_CHANGE_CREATE',
        'MANDATORY_PIN_CHANGE_CONFIRM'
      ].includes(step)) {
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault();
          handleKeypadPress(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          handleKeypadBackspace();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleKeypadClear();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handleKeypadPress]);

  // Submit PIN for verification
  const submitPinVerification = async (pinToVerify: string) => {
    if (!phone || pinToVerify.length !== 6 || loading) return;
    setLoading(true);
    setError('');

    try {
      const res = await verifyCustomerPinClient(phone, pinToVerify, members);
      if (res.success) {
        // If customer account requires mandatory PIN change (e.g. from cashier temporary PIN)
        if (res.memberDoc?.forcePinChangeOnNextLogin) {
          setMemberInfo(prev => prev ? { ...prev, memberDoc: res.memberDoc } : null);
          setCreatedPin('');
          setConfirmedPin('');
          setStep('MANDATORY_PIN_CHANGE_CREATE');
          setSuccessMsg('PIN sementara valid. Demi keamanan saldo poin & akun Anda, buat 6-digit PIN permanen baru.');
          return;
        }

        setSuccessMsg('Verifikasi berhasil! Mengalihkan ke dashboard...');
        setTimeout(() => {
          onLogin(res.memberId, res.memberDoc);
        }, 500);
      }
    } catch (err: any) {
      console.error('PIN verification error:', err);
      const errMsg = err?.message || 'Verifikasi PIN tidak sesuai.';
      setError(errMsg);
      setEnteredPin('');

      // Check if newly locked
      if (errMsg.includes('15 menit') || errMsg.includes('terkunci')) {
        setLockoutSeconds(15 * 60);
      }
    } finally {
      setLoading(false);
    }
  };

  // First-Time or Reset PIN Setup: Step 1 -> Step 2
  const handleProceedToConfirm = () => {
    if (createdPin.length !== 6) {
      setError('PIN harus berupa 6 angka numerik.');
      return;
    }
    setError('');
    setConfirmedPin('');
    if (step === 'FIRST_PIN_CREATE') {
      setStep('FIRST_PIN_CONFIRM');
    } else if (step === 'RESET_PIN_CREATE') {
      setStep('RESET_PIN_CONFIRM');
    } else if (step === 'MANDATORY_PIN_CHANGE_CREATE') {
      setStep('MANDATORY_PIN_CHANGE_CONFIRM');
    }
  };

  // Step 2 Confirmation Handler
  const handleProceedToGoogleLink = () => {
    if (confirmedPin.length !== 6) {
      setError('Masukkan 6 angka konfirmasi PIN.');
      return;
    }
    if (createdPin !== confirmedPin) {
      setError('Konfirmasi PIN tidak cocok dengan PIN pertama. Silakan coba kembali.');
      setConfirmedPin('');
      return;
    }
    setError('');
    if (step === 'RESET_PIN_CONFIRM') {
      finalizeResetPin();
    } else if (step === 'MANDATORY_PIN_CHANGE_CONFIRM') {
      finalizeMandatoryPinChange();
    } else {
      setStep('FIRST_PIN_LINK_GOOGLE');
    }
  };

  // First-Time PIN: Google Link & Final Save
  const handleGoogleLinkAndSave = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const updated = await setCustomerPinClient({
        rawPhone: phone,
        pin: createdPin,
        recoveryEmail: user.email || '',
        googleUid: user.uid
      });

      setSuccessMsg('PIN berhasil dibuat & Akun Google terhubung sebagai pemulihan!');
      setTimeout(() => {
        onLogin(updated.id, updated);
      }, 700);
    } catch (err: any) {
      console.error('Google link error:', err);
      setError(err?.message || 'Gagal menghubungkan akun Google untuk pemulihan.');
    } finally {
      setLoading(false);
    }
  };

  // Primary Self-Service Path: Instant verification via linked Google OAuth
  const startGoogleRecovery = async () => {
    setLoading(true);
    setError('');
    setRecoveryError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Extract registered credential link info
      const doc = memberInfo?.memberDoc;
      const registeredGoogleUid = doc?.googleUid;
      const linkedUids = Array.isArray(doc?.linkedAuthUids) ? doc.linkedAuthUids : [];
      const registeredEmail = (doc?.recoveryEmail || doc?.email || '').toLowerCase().trim();
      const userEmail = (user.email || '').toLowerCase().trim();

      const isUidMatch = (registeredGoogleUid && registeredGoogleUid === user.uid) || linkedUids.includes(user.uid);
      const isEmailMatch = registeredEmail && userEmail && registeredEmail === userEmail;

      // If customer has a registered recovery account and current Google sign-in does not match
      if (registeredGoogleUid && !isUidMatch && !isEmailMatch) {
        const mismatchMsg = `Akun Google (${user.email}) tidak sesuai dengan data pemulihan yang tersimpan untuk nomor ini. Silakan gunakan akun Google yang tepat, atau kunjungi butik resmi Watch Club terdekat untuk verifikasi fisik oleh kasir.`;
        setError(mismatchMsg);
        setRecoveryError(mismatchMsg);
        return;
      }

      // Verification approved!
      setVerifiedGoogleAuth({
        uid: user.uid,
        email: user.email || ''
      });

      setIsRecoveryModalOpen(false);
      setLockoutSeconds(0);
      setCreatedPin('');
      setConfirmedPin('');
      setStep('RESET_PIN_CREATE');
      setSuccessMsg(`Verifikasi identitas berhasil (${user.email}). Silakan buat 6-digit PIN baru.`);
    } catch (err: any) {
      console.error('Google recovery error:', err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        const msg = err?.message || 'Pemulihan gagal: Akun Google tidak dapat diverifikasi.';
        setError(msg);
        setRecoveryError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Finalize Self-Service PIN Reset
  const finalizeResetPin = async () => {
    if (!verifiedGoogleAuth) {
      setError('Sesi verifikasi Google telah kadaluarsa. Silakan ulangi proses pemulihan.');
      setStep('PHONE');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const updated = await resetPinViaGoogleAuthClient({
        rawPhone: phone,
        googleUid: verifiedGoogleAuth.uid,
        googleEmail: verifiedGoogleAuth.email,
        newPin: createdPin
      });

      setSuccessMsg('Security PIN berhasil dipulihkan! Mengalihkan ke dashboard...');
      setTimeout(() => {
        onLogin(updated.id, updated);
      }, 600);
    } catch (err: any) {
      console.error('Reset PIN error:', err);
      setError(err?.message || 'Gagal memperbarui Security PIN.');
    } finally {
      setLoading(false);
    }
  };

  // Finalize Mandatory PIN Change
  const finalizeMandatoryPinChange = async () => {
    setLoading(true);
    setError('');
    try {
      const updated = await setCustomerPinClient({
        rawPhone: phone,
        pin: createdPin,
        recoveryEmail: memberInfo?.memberDoc?.recoveryEmail || memberInfo?.memberDoc?.email,
        googleUid: memberInfo?.memberDoc?.googleUid
      });

      setSuccessMsg('PIN permanen berhasil disimpan. Selamat datang kembali di Watch Club.');
      setTimeout(() => {
        onLogin(updated.id, updated);
      }, 600);
    } catch (err: any) {
      console.error('Mandatory PIN change error:', err);
      setError(err?.message || 'Gagal menyimpan PIN baru.');
    } finally {
      setLoading(false);
    }
  };

  // Google Onboarding for unregistered numbers
  const handleNewGoogleRegister = async () => {
    if (!phone) return;
    setLoading(true);
    setError('');
    try {
      await onRegisterGoogle(phone);
    } catch (err: any) {
      setError(err?.message || 'Gagal registrasi Google.');
    } finally {
      setLoading(false);
    }
  };

  // Refined Luxury PIN dots indicator
  const renderPinDots = (currentVal: string, isInputLocked: boolean) => {
    return (
      <div className="flex justify-center items-center gap-3.5 my-4">
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const filled = index < currentVal.length;
          const active = index === currentVal.length && !isInputLocked;
          return (
            <div
              key={index}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                filled
                  ? 'bg-black dark:bg-white dark:text-black border border-slate-900 scale-110 shadow-xs'
                  : active
                  ? 'border-2 border-slate-900 bg-white ring-2 ring-slate-400/25 scale-105'
                  : 'border border-black/10 dark:border-white/20 bg-slate-100'
              }`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 text-neutral-900 dark:text-white flex flex-col justify-center items-center p-4 sm:p-6 relative font-sans select-none">
      {/* Subtle Luxury Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-slate-200/50 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-slate-200/40 rounded-full blur-2xl pointer-events-none" />

      {/* Main Luxury White Card Container */}
      <div className="w-full max-w-md bg-white dark:bg-white/5 rounded-3xl shadow-sm dark:shadow-none dark:shadow-none border border-black/5 dark:border-white/10 p-6 sm:p-8 relative z-10 space-y-5 transition-shadow hover:shadow-md">
        
        {/* BRAND LOGO - Deep Obsidian Variant */}
        <div className="flex justify-center mb-2">
          <WatchClubLogo variant="dark" className="scale-105" />
        </div>

        {/* FEEDBACK BANNERS */}
        {error && (
          <div className="bg-rose-50 text-rose-800 p-3.5 rounded-2xl text-xs font-medium border border-rose-200 flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-xs font-medium border border-emerald-200 flex items-center gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="flex-1 leading-relaxed">{successMsg}</div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: PHONE NUMBER INPUT */}
        {/* ========================================================================= */}
        {step === 'PHONE' && (
          <div className="space-y-5 animate-fadeIn">
            <div className="text-center">
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">Portal Member Eksklusif</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Selamat datang kembali. Masukkan nomor ponsel Anda untuk mengakses privilege member, poin reward, dan reward Anda.
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  Nomor Ponsel
                </label>
                <div className="relative">
                  <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 dark:text-neutral-500" />
                  <input
                    type="tel"
                    value={phone || ''}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (error) setError('');
                    }}
                    className="w-full pl-10 pr-4 py-3.5 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-xl text-sm font-semibold text-neutral-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-800 focus:bg-white dark:bg-white/5 focus:ring-1 focus:ring-slate-800/20 transition-all tracking-wide"
                    placeholder="Contoh: 081288889999"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all shadow-sm dark:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>{loading ? 'Memverifikasi...' : 'Lanjutkan ke PIN Keamanan'}</span>
              </button>
            </form>

            {/* Unregistered Member Registration Prompt */}
            {memberInfo && !memberInfo.exists && (
              <div className="p-4 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-2xl text-center space-y-3 animate-fadeIn">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Belum menjadi bagian dari Watch Club? Daftar sekarang untuk menikmati berbagai privilege eksklusif.
                </p>
                <button
                  type="button"
                  onClick={handleNewGoogleRegister}
                  className="w-full py-2.5 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 text-neutral-900 dark:text-white text-xs font-semibold rounded-xl border border-black/5 dark:border-white/10 flex items-center justify-center gap-2.5 transition-all shadow-xs dark:shadow-none cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Daftar Member Baru via Google</span>
                </button>
              </div>
            )}

            {/* Strict Portal Isolation: Luxury Customer Care Footer (No /admin or /cashier) */}
            <div className="pt-4 border-t border-black/5 dark:border-white/10 text-center space-y-2">
              <div className="flex items-center justify-center text-xs font-medium text-neutral-500 dark:text-neutral-400">
                <a 
                  href="mailto:customercare@watchclub.co.id" 
                  className="hover:text-neutral-900 dark:text-white transition-colors flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500" />
                  <span>Customer Care</span>
                </a>
              </div>
              <p className="text-[11px] text-neutral-400 dark:text-neutral-500">
                &copy; {new Date().getFullYear()} Watch Club Indonesia. All rights reserved.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2B: RETURNING MEMBER PIN PROMPT (TACTILE NUMERIC KEYPAD) */}
        {/* ========================================================================= */}
        {step === 'PIN_INPUT' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header with Member Recognition */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep('PHONE');
                  setEnteredPin('');
                  setError('');
                }}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Ganti Nomor
              </button>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-black/5 dark:border-white/10 text-neutral-700 dark:text-neutral-300 text-[10px] font-semibold">
                <Lock className="w-3 h-3 text-neutral-600 dark:text-neutral-400" />
                <span>Keamanan Akun Terenkripsi</span>
              </div>
            </div>

            <div className="text-center pt-1">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                Selamat Datang, {memberInfo?.name || 'Member'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Ketik 6-Digit PIN Anda untuk {toE164(phone)}
              </p>
            </div>

            {/* BRUTE-FORCE LOCKOUT STATE */}
            {lockoutSeconds > 0 ? (
              <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-2.5 animate-pulse">
                <div className="inline-flex p-2.5 rounded-full bg-rose-100 text-rose-700 mb-1">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Akses Dihentikan Sementara Demi Keamanan
                </h3>
                <p className="text-2xl font-mono font-extrabold text-rose-700">
                  {formatLockoutTimer(lockoutSeconds)}
                </p>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Untuk menjaga keamanan dan kerahasiaan poin reward Anda, akses input PIN dinonaktifkan sementara setelah beberapa percobaan tidak sesuai.
                </p>
                <button
                  type="button"
                  id="btn-lockout-open-recovery"
                  onClick={() => {
                    setRecoveryError('');
                    setIsRecoveryModalOpen(true);
                  }}
                  className="mt-2 w-full py-2.5 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm dark:shadow-none"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>Verifikasi Identitas dengan Akun Google</span>
                </button>
              </div>
            ) : (
              <>
                {/* 6-DIGIT MASKED PIN DOTS */}
                {renderPinDots(enteredPin, lockoutSeconds > 0 || loading)}

                {/* TACTILE NUMERIC KEYPAD */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handleKeypadPress(digit)}
                      disabled={loading || lockoutSeconds > 0}
                      className="h-14 rounded-2xl bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 active:bg-black dark:bg-white dark:text-black active:text-white border border-black/5 dark:border-white/10 text-lg font-bold text-neutral-900 dark:text-white transition-all duration-150 flex items-center justify-center shadow-xs dark:shadow-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      {digit}
                    </button>
                  ))}
                  
                  {/* CLEAR BUTTON */}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    disabled={loading || lockoutSeconds > 0 || !enteredPin}
                    className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-black/5 dark:border-white/10 text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                  >
                    Clear
                  </button>

                  {/* ZERO BUTTON */}
                  <button
                    type="button"
                    onClick={() => handleKeypadPress('0')}
                    disabled={loading || lockoutSeconds > 0}
                    className="h-14 rounded-2xl bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 active:bg-black dark:bg-white dark:text-black active:text-white border border-black/5 dark:border-white/10 text-lg font-bold text-neutral-900 dark:text-white transition-all duration-150 flex items-center justify-center shadow-xs dark:shadow-none cursor-pointer disabled:opacity-30"
                  >
                    0
                  </button>

                  {/* BACKSPACE BUTTON */}
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    disabled={loading || lockoutSeconds > 0 || !enteredPin}
                    className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-400 transition-all flex items-center justify-center cursor-pointer disabled:opacity-30"
                  >
                    <Delete className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                  </button>
                </div>

                {/* PIN RECOVERY TRIGGER BENEATH KEYPAD */}
                <div className="pt-2">
                  <button
                    type="button"
                    id="btn-lupa-pin-trigger"
                    onClick={() => {
                      setRecoveryError('');
                      setIsRecoveryModalOpen(true);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 hover:bg-slate-100 text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-black/5 dark:border-white/10 transition-all cursor-pointer shadow-xs"
                  >
                    <HelpCircle className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                    <span>Lupa Security PIN? Pulihkan Akun</span>
                  </button>
                </div>

                {/* LUXURY SECURITY BADGE MICROCOPY */}
                <div className="p-3.5 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-2xl space-y-1 text-xs text-neutral-700 dark:text-neutral-300">
                  <div className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
                    <ShieldCheck className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                    <span>Proteksi Keamanan &amp; Privasi Member</span>
                  </div>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    Security PIN Anda dilindungi dengan enkripsi berstandar perbankan untuk mengamankan hak reward poin serta kerahasiaan arsip aktivitas loyalty Anda.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2A: PIN SETUP / RESET / MANDATORY CHANGE - CREATE */}
        {/* ========================================================================= */}
        {(step === 'FIRST_PIN_CREATE' || step === 'RESET_PIN_CREATE' || step === 'MANDATORY_PIN_CHANGE_CREATE') && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('PHONE')}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Batal
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 bg-slate-100 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/10">
                Langkah 1 dari 2
              </span>
            </div>

            <div className="text-center pt-1">
              <div className="inline-flex p-3 rounded-2xl bg-slate-100 text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 mb-2">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                {step === 'RESET_PIN_CREATE' 
                  ? 'Buat Security PIN Baru' 
                  : step === 'MANDATORY_PIN_CHANGE_CREATE'
                  ? 'Wajib Buat PIN Baru'
                  : 'Aktivasi Keamanan PIN'}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
                {step === 'RESET_PIN_CREATE'
                  ? 'Verifikasi identitas berhasil. Tentukan 6-digit Security PIN baru Anda.'
                  : step === 'MANDATORY_PIN_CHANGE_CREATE'
                  ? 'PIN sementara dari kasir aktif. Buat 6-digit PIN permanen baru demi keamanan.'
                  : 'Tentukan 6-digit Security PIN untuk melindungi poin reward dan aktivitas loyalty Anda.'}
              </p>
            </div>

            {renderPinDots(createdPin, false)}

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-14 rounded-2xl bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 active:bg-black dark:bg-white dark:text-black active:text-white border border-black/5 dark:border-white/10 text-lg font-bold text-neutral-900 dark:text-white transition-all flex items-center justify-center shadow-xs dark:shadow-none cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-14 rounded-2xl bg-slate-100 text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center justify-center border border-black/5 dark:border-white/10 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 active:bg-black dark:bg-white dark:text-black active:text-white text-lg font-bold text-neutral-900 dark:text-white flex items-center justify-center border border-black/5 dark:border-white/10 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-14 rounded-2xl bg-slate-100 text-neutral-600 dark:text-neutral-400 flex items-center justify-center border border-black/5 dark:border-white/10 cursor-pointer"
              >
                <Delete className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleProceedToConfirm}
              disabled={createdPin.length !== 6}
              className="w-full py-3.5 mt-2 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-semibold text-sm rounded-xl transition-all shadow-sm dark:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Lanjut Konfirmasi PIN ({createdPin.length}/6)</span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2B: PIN SETUP / RESET / MANDATORY CHANGE - CONFIRM */}
        {/* ========================================================================= */}
        {(step === 'FIRST_PIN_CONFIRM' || step === 'RESET_PIN_CONFIRM' || step === 'MANDATORY_PIN_CHANGE_CONFIRM') && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setConfirmedPin('');
                  if (step === 'FIRST_PIN_CONFIRM') setStep('FIRST_PIN_CREATE');
                  else if (step === 'RESET_PIN_CONFIRM') setStep('RESET_PIN_CREATE');
                  else setStep('MANDATORY_PIN_CHANGE_CREATE');
                }}
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:text-white flex items-center gap-1.5 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Ubah PIN
              </button>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 bg-slate-100 px-2.5 py-1 rounded-full border border-black/5 dark:border-white/10">
                Langkah 2 dari 2
              </span>
            </div>

            <div className="text-center pt-1">
              <div className="inline-flex p-3 rounded-2xl bg-slate-100 text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 mb-2">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                Konfirmasi Ulang PIN Anda
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Ketik kembali 6-digit PIN yang baru saja Anda buat untuk memastikan kesesuaian.
              </p>
            </div>

            {renderPinDots(confirmedPin, false)}

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeypadPress(digit)}
                  className="h-14 rounded-2xl bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 active:bg-black dark:bg-white dark:text-black active:text-white border border-black/5 dark:border-white/10 text-lg font-bold text-neutral-900 dark:text-white transition-all flex items-center justify-center shadow-xs dark:shadow-none cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={handleKeypadClear}
                className="h-14 rounded-2xl bg-slate-100 text-xs font-bold uppercase text-neutral-600 dark:text-neutral-400 flex items-center justify-center border border-black/5 dark:border-white/10 cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="h-14 rounded-2xl bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 active:bg-black dark:bg-white dark:text-black active:text-white text-lg font-bold text-neutral-900 dark:text-white flex items-center justify-center border border-black/5 dark:border-white/10 cursor-pointer"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="h-14 rounded-2xl bg-slate-100 text-neutral-600 dark:text-neutral-400 flex items-center justify-center border border-black/5 dark:border-white/10 cursor-pointer"
              >
                <Delete className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleProceedToGoogleLink}
              disabled={confirmedPin.length !== 6 || loading}
              className="w-full py-3.5 mt-2 bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 font-semibold text-sm rounded-xl transition-all shadow-sm dark:shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {loading 
                  ? 'Menyimpan...' 
                  : step === 'RESET_PIN_CONFIRM'
                  ? 'Simpan & Aktifkan PIN Baru'
                  : step === 'MANDATORY_PIN_CHANGE_CONFIRM'
                  ? 'Simpan PIN Permanen'
                  : 'Simpan & Lanjut Tautkan Google'}
              </span>
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MANDATORY GOOGLE OAUTH RECOVERY LINKING (FIRST TIME SETUP) */}
        {/* ========================================================================= */}
        {step === 'FIRST_PIN_LINK_GOOGLE' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="text-center pt-2">
              <div className="inline-flex p-3 rounded-2xl bg-slate-100 text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 mb-2">
                <ShieldCheck className="w-6 h-6 text-neutral-800 dark:text-neutral-200" />
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white tracking-tight">
                Amankan Profil Anda
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                Hubungkan akun Google Anda untuk mempermudah akses masuk dan melindungi data keanggotaan Anda di masa mendatang.
              </p>
            </div>

            {/* SECURITY BADGE & DESCRIPTION */}
            <div className="p-4 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-2xl space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              <div className="flex items-center gap-2 font-semibold text-neutral-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-neutral-800 dark:text-neutral-200" />
                <span>Privasi &amp; Keamanan Terjamin</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Data poin reward, dan privasi Anda dilindungi dengan sistem enkripsi setara perbankan. Kenyamanan dan keamanan Anda adalah prioritas kami.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLinkAndSave}
              disabled={loading}
              className="w-full py-3.5 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 text-neutral-900 dark:text-white font-semibold text-sm rounded-xl border border-black/5 dark:border-white/10 transition-all shadow-xs dark:shadow-none flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{loading ? 'Menghubungkan...' : 'Hubungkan & Selesai'}</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* LUPA PIN / MULTI-CHANNEL RECOVERY MODAL (LUXURY WHITE/SLATE THEME) */}
      {/* ========================================================================= */}
      {isRecoveryModalOpen && (
        <div 
          id="modal-lupa-pin-recovery"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
        >
          <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl dark:shadow-none text-neutral-900 dark:text-white space-y-5 animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-neutral-800 dark:text-neutral-200 border border-black/5 dark:border-white/10 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 dark:text-white text-base">Pemulihan Security PIN</h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Verifikasi identitas resmi member Watch Club</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRecoveryModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:text-neutral-300 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Card Snapshot */}
            <div className="p-3.5 bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 rounded-2xl space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between items-center">
                <span>Member Terdaftar:</span>
                <span className="font-semibold text-neutral-900 dark:text-white">{memberInfo?.name || 'Member Watch Club'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Nomor Ponsel:</span>
                <span className="font-mono text-neutral-900 dark:text-white font-semibold">{phone}</span>
              </div>
              {memberInfo?.memberDoc?.recoveryEmail && (
                <div className="flex justify-between items-center">
                  <span>Google Pemulihan Terdaftar:</span>
                  <span className="font-mono text-neutral-700 dark:text-neutral-300">
                    {memberInfo.memberDoc.recoveryEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                  </span>
                </div>
              )}
            </div>

            {/* Mismatch / Rate-Limit Error in Modal */}
            {recoveryError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs space-y-1 animate-shake">
                <div className="flex items-center gap-2 font-bold text-rose-700">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Verifikasi Identitas Ditolak</span>
                </div>
                <p className="text-[11px] leading-relaxed">{recoveryError}</p>
              </div>
            )}

            {/* Path 1: Primary Self-Service (Google OAuth) */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200">
                  Jalur Utama (Instan)
                </span>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">Proses &lt; 30 Detik</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>Verifikasi Akun Google Terkait</span>
                </h4>
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
                  Buka kunci akun dan buat 6-digit PIN baru secara mandiri dengan verifikasi akun Google yang telah ditautkan ke nomor ini.
                </p>
              </div>

              <button
                type="button"
                id="btn-confirm-google-recovery"
                onClick={startGoogleRecovery}
                disabled={loading}
                className="w-full py-3 bg-white dark:bg-white/5 hover:bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 text-neutral-900 dark:text-white font-semibold text-xs rounded-xl border border-black/5 dark:border-white/10 transition-all shadow-xs dark:shadow-none flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{loading ? 'Memverifikasi...' : 'Verifikasi Akun Google'}</span>
              </button>
            </div>

            {/* Path 2: In-Store Retail Fallback (Cashier-assisted) */}
            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-gradient-to-br dark:from-neutral-900 dark:via-black dark:to-neutral-950 border border-black/5 dark:border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 bg-slate-200/80 px-2 py-0.5 rounded-full border border-black/10 dark:border-white/20">
                  Jalur Alternatif di Gerai
                </span>
                <Store className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              </div>
              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">Bantuan Kasir di Butik Watch Club</h4>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Tidak memiliki akses ke akun Google? Kunjungi butik resmi Watch Club terdekat dengan membawa kartu identitas asli (KTP/SIM/Paspor). Kasir resmi kami akan memverifikasi fisik dan membantu mereset PIN akun Anda.
              </p>
            </div>

            {/* Close action */}
            <button
              type="button"
              onClick={() => setIsRecoveryModalOpen(false)}
              className="w-full py-2.5 rounded-xl border border-black/5 dark:border-white/10 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:text-white hover:bg-slate-100 text-xs font-semibold transition-colors cursor-pointer"
            >
              Kembali ke Halaman Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
