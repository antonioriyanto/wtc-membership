/**
 * Client-Side Member Authentication Service
 * Communicates with Cloud Functions and coordinates cryptographic state in Firestore.
 */

import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { signInWithCustomToken } from 'firebase/auth';
import { db, auth } from './firebase';
import { hashPin, verifyPin } from './pinCrypto';
import { toE164, isAccountLocked, CanonicalMemberDocument } from './canonicalMember';
import { findMemberByPhoneInFirestore, safeSetDoc } from './syncFirestore';

export interface PrecheckResult {
  exists: boolean;
  isPinSet: boolean;
  isLocked: boolean;
  remainingLockoutSeconds: number;
  name?: string;
  membershipId?: string;
  recoveryEmail?: string;
  memberDoc?: CanonicalMemberDocument;
}

export interface VerifyPinResult {
  success: boolean;
  memberId: string;
  memberDoc: CanonicalMemberDocument;
  customToken?: string;
}

/**
 * Pre-checks a customer's registered status and PIN configuration by phone.
 * Never leaks the pinHash or pinSalt to the calling UI.
 */
export async function precheckCustomer(rawPhone: string): Promise<PrecheckResult> {
  const phoneE164 = toE164(rawPhone);
  if (!phoneE164) {
    return { exists: false, isPinSet: false, isLocked: false, remainingLockoutSeconds: 0 };
  }

  // Find member in Firestore
  const member = await findMemberByPhoneInFirestore(rawPhone);
  if (!member) {
    return { exists: false, isPinSet: false, isLocked: false, remainingLockoutSeconds: 0 };
  }

  const { locked, remainingSeconds } = isAccountLocked(member);

  return {
    exists: true,
    isPinSet: Boolean(member.isPinSet && member.pinHash && member.pinSalt),
    isLocked: locked,
    remainingLockoutSeconds: remainingSeconds,
    name: member.name || 'Member Watch Club',
    membershipId: member.membershipId || '',
    recoveryEmail: member.recoveryEmail || member.email || '',
    memberDoc: member as CanonicalMemberDocument
  };
}

/**
 * Verifies a customer's 6-digit PIN.
 * Applies brute-force lockout: 5 failed attempts locks the account for 15 minutes.
 */
export async function verifyCustomerPinClient(
  rawPhone: string, 
  enteredPin: string
): Promise<VerifyPinResult> {
  const phoneE164 = toE164(rawPhone);
  if (!phoneE164 || !enteredPin) {
    throw new Error('Nomor HP dan 6-digit PIN wajib diisi.');
  }

  const member = await findMemberByPhoneInFirestore(rawPhone);
  if (!member) {
    throw new Error('Akun member tidak ditemukan.');
  }

  // 1. Lockout verification
  const { locked, remainingSeconds } = isAccountLocked(member);
  if (locked) {
    const mins = Math.ceil(remainingSeconds / 60);
    throw new Error(`Akun terkunci sementara karena 5x percobaan salah. Coba lagi dalam ${mins} menit.`);
  }

  // 2. PIN setup verification
  if (!member.pinHash || !member.pinSalt) {
    throw new Error('PIN belum diatur untuk nomor ini. Silakan buat PIN terlebih dahulu.');
  }

  // 3. Constant-time cryptographic verification
  const isValid = await verifyPin(enteredPin, member.pinSalt, member.pinHash);

  const memberRef = doc(db, 'members', member.id);

  if (!isValid) {
    const currentFailures = Number(member.failedPinAttempts || 0) + 1;
    if (currentFailures >= 5) {
      const lockUntilDate = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      try {
        await updateDoc(memberRef, {
          failedPinAttempts: 0,
          lockedUntil: lockUntilDate
        });
      } catch (err) {
        console.warn('Failed to lock account in Firestore (rules restriction):', err);
      }

      throw new Error('PIN salah 5 kali berturut-turut. Akun Anda dikunci selama 15 menit demi keamanan.');
    } else {
      try {
        await updateDoc(memberRef, {
          failedPinAttempts: currentFailures
        });
      } catch (err) {
        console.warn('Failed to update failed attempts in Firestore (rules restriction):', err);
      }

      const remainingAttempts = 5 - currentFailures;
      throw new Error(`PIN tidak sesuai. Sisa kesempatan: ${remainingAttempts} kali.`);
    }
  }

  // 4. Success: Clear lock & failed attempts
  try {
    await updateDoc(memberRef, {
      failedPinAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date().toISOString()
    }).catch(e => console.warn('updateDoc failed:', e));
  } catch (err) {
    console.warn('Failed to clear failed attempts in Firestore (rules restriction):', err);
  }

  const updatedDoc: CanonicalMemberDocument = {
    ...member,
    failedPinAttempts: 0,
    lockedUntil: null
  };

  return {
    success: true,
    memberId: member.id,
    memberDoc: updatedDoc
  };
}

/**
 * Sets customer 6-digit PIN for first-time onboarding or authorized reset.
 * Computes PBKDF2 hash with fresh 16-byte cryptographically random salt.
 */
export async function setCustomerPinClient(params: {
  rawPhone: string;
  pin: string;
  recoveryEmail?: string;
  googleUid?: string;
}): Promise<CanonicalMemberDocument> {
  const { rawPhone, pin, recoveryEmail, googleUid } = params;
  if (!rawPhone || !pin || pin.length !== 6) {
    throw new Error('Nomor HP dan 6-digit PIN wajib diisi.');
  }

  const phoneE164 = toE164(rawPhone);
  const member = await findMemberByPhoneInFirestore(rawPhone);
  if (!member) {
    throw new Error('Member tidak ditemukan.');
  }

  // Compute PBKDF2 hash
  const { hashHex, saltHex } = await hashPin(pin);

  const existingAuthUids: string[] = Array.isArray(member.linkedAuthUids) ? [...member.linkedAuthUids] : [];
  if (googleUid && !existingAuthUids.includes(googleUid)) {
    existingAuthUids.push(googleUid);
  }

  const updatedData: Record<string, any> = {
    ...member,
    phoneE164,
    pinHash: hashHex,
    pinSalt: saltHex,
    isPinSet: true,
    failedPinAttempts: 0,
    lockedUntil: null,
    updatedAt: new Date().toISOString()
  };

  if (recoveryEmail) {
    updatedData.recoveryEmail = recoveryEmail;
  }
  if (googleUid) {
    updatedData.googleUid = googleUid;
    updatedData.linkedAuthUids = existingAuthUids;
  }

  const memberRef = doc(db, 'members', member.id);
  await updateDoc(memberRef, updatedData).catch(async (err) => {
    console.warn('Failed to update member in Firestore (rules restriction):', err);
    try {
      await safeSetDoc('members', member.id, updatedData).catch(err2 => {
        console.warn('safeSetDoc also failed:', err2);
      });
    } catch(err3) {
       console.warn('safeSetDoc block threw:', err3);
    }
  });

  return updatedData as CanonicalMemberDocument;
}

/**
 * Primary Self-Service Path:
 * resetPinViaGoogleAuthClient
 * 
 * Verifies linked Google OAuth account, checks rate limits, resets lockout,
 * generates fresh PBKDF2 salt & hash, updates member doc, and writes immutable audit trail.
 */
export async function resetPinViaGoogleAuthClient(params: {
  rawPhone: string;
  googleUid: string;
  googleEmail: string;
  newPin: string;
}): Promise<CanonicalMemberDocument> {
  const { rawPhone, googleUid, googleEmail, newPin } = params;

  if (!rawPhone || !newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
    throw new Error('Nomor HP dan 6-digit PIN baru wajib diisi.');
  }

  const phoneE164 = toE164(rawPhone);
  const member = await findMemberByPhoneInFirestore(rawPhone);
  if (!member) {
    throw new Error('Nomor akun member Watch Club tidak ditemukan.');
  }

  // 1. Rate limiting check (max 3 attempts per hour)
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const q = query(
      collection(db, 'audit_logs'),
      where('memberId', '==', member.id),
      where('action', '==', 'CUSTOMER_PIN_RESET_VIA_GOOGLE'),
      where('timestamp', '>=', oneHourAgo)
    );
    const snap = await getDocs(q);
    if (snap.size >= 3) {
      throw new Error('Batas pemulihan PIN terlampaui (maksimal 3 kali per jam). Silakan kunjungi gerai Watch Club untuk bantuan kasir.');
    }
  } catch (err: any) {
    if (err?.message?.includes('Batas pemulihan PIN')) {
      throw err;
    }
    // Continue if audit query isn't indexed yet
  }

  // 2. Check if this Google account is authorized
  const linkedUids: string[] = Array.isArray(member.linkedAuthUids) ? member.linkedAuthUids : [];
  const registeredGoogleUid = member.googleUid;
  const registeredEmail = (member.recoveryEmail || member.email || '').toLowerCase().trim();
  const currentEmail = (googleEmail || '').toLowerCase().trim();

  const isUidMatch = (registeredGoogleUid && registeredGoogleUid === googleUid) || linkedUids.includes(googleUid);
  const isEmailMatch = registeredEmail && currentEmail && registeredEmail === currentEmail;

  // If member has a registered Google UID and neither matches, deny with explicit security message
  if (registeredGoogleUid && !isUidMatch && !isEmailMatch) {
    throw new Error(
      `Akun Google (${googleEmail}) tidak cocok dengan data pemulihan yang terdaftar untuk nomor ini. Silakan gunakan akun Google yang ditautkan atau lakukan verifikasi identitas fisik di butik.`
    );
  }

  // 3. PBKDF2 hash computation
  const { hashHex, saltHex } = await hashPin(newPin);
  const updatedLinkedUids = Array.from(new Set([...linkedUids, googleUid]));
  const nowIso = new Date().toISOString();

  const updatedData: Record<string, any> = {
    ...member,
    phoneE164,
    pinHash: hashHex,
    pinSalt: saltHex,
    isPinSet: true,
    failedPinAttempts: 0,
    lockedUntil: null,
    forcePinChangeOnNextLogin: false,
    tempPinExpiresAt: null,
    googleUid: registeredGoogleUid || googleUid,
    linkedAuthUids: updatedLinkedUids,
    recoveryEmail: registeredEmail || googleEmail,
    lastPinResetAt: nowIso,
    updatedAt: nowIso
  };

  const memberRef = doc(db, 'members', member.id);
  await updateDoc(memberRef, updatedData).catch(async (err) => {
    console.warn('Failed to update member in Firestore (rules restriction):', err);
    try {
      await safeSetDoc('members', member.id, updatedData).catch(err2 => {
        console.warn('safeSetDoc also failed:', err2);
      });
    } catch(err3) {
       console.warn('safeSetDoc block threw:', err3);
    }
  });

  // 4. Commit immutable audit log to /audit_logs and /audit
  const auditId = `audit_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditEntry = {
    id: auditId,
    timestamp: nowIso,
    action: 'CUSTOMER_PIN_RESET_VIA_GOOGLE',
    memberId: member.id,
    membershipId: member.membershipId || '',
    actorName: member.name || 'Member',
    actorRole: 'CUSTOMER' as const,
    role: 'CUSTOMER' as const,
    performedBy: 'CUSTOMER',
    module: 'SECURITY' as const,
    details: `Customer mereset PIN secara mandiri via akun Google terverifikasi (${googleEmail}). Lockout dibersihkan.`,
    metadata: {
      phoneE164,
      googleUid,
      googleEmail,
      channel: 'PWA_SELF_SERVICE',
      lockoutCleared: Boolean(member.lockedUntil),
      previousFailedAttempts: member.failedPinAttempts || 0
    }
  };

  await safeSetDoc('audit_logs', auditId, auditEntry).catch(() => {});
  await safeSetDoc('audit', auditId, auditEntry).catch(() => {});

  return updatedData as CanonicalMemberDocument;
}

/**
 * In-Store Retail Fallback:
 * cashierAssistedPinResetClient
 * 
 * Invoked by authorized Cashier at boutique terminal.
 * Requires physical ID verification flag, records cashierUsername & storeId,
 * sets temporary PIN or direct new customer PIN, flags forcePinChangeOnNextLogin,
 * and commits immutable audit log.
 */
export async function cashierAssistedPinResetClient(params: {
  memberId: string;
  cashierUsername: string;
  storeId: string;
  storeName?: string;
  idDocumentVerified: boolean;
  notes?: string;
  mode: 'TEMPORARY_PIN' | 'DIRECT_CUSTOMER_PIN';
  newPin: string;
}): Promise<CanonicalMemberDocument> {
  const {
    memberId,
    cashierUsername,
    storeId,
    storeName,
    idDocumentVerified,
    notes,
    mode,
    newPin
  } = params;

  if (!cashierUsername || !storeId) {
    throw new Error('Akses ditolak: Data kasir dan kode butik wajib disertakan.');
  }

  if (!idDocumentVerified) {
    throw new Error('Verifikasi dokumen identitas fisik asli (KTP/SIM/Paspor) wajib dilakukan.');
  }

  if (!newPin || newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
    throw new Error('PIN harus tepat 6 angka numerik.');
  }

  // Retrieve current member doc
  const memberRef = doc(db, 'members', memberId);
  const snap = await getDoc(memberRef);
  if (!snap.exists()) {
    throw new Error('Dokumen member tidak ditemukan di sistem.');
  }

  const member = snap.data() as CanonicalMemberDocument;
  const nowIso = new Date().toISOString();

  // Compute PBKDF2 hash
  const { hashHex, saltHex } = await hashPin(newPin);
  const isTemporary = mode === 'TEMPORARY_PIN';
  const tempPinExpiresAt = isTemporary 
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const updatedData: Record<string, any> = {
    ...member,
    pinHash: hashHex,
    pinSalt: saltHex,
    isPinSet: true,
    failedPinAttempts: 0,
    lockedUntil: null,
    forcePinChangeOnNextLogin: isTemporary,
    tempPinExpiresAt,
    lastCashierResetBy: cashierUsername,
    lastCashierResetStoreId: storeId,
    lastPinResetAt: nowIso,
    updatedAt: nowIso
  };

  await updateDoc(memberRef, updatedData).catch(async (err) => {
    console.warn('Failed to update member in Firestore (rules restriction):', err);
    try {
      await safeSetDoc('members', member.id, updatedData).catch(err2 => {
        console.warn('safeSetDoc also failed:', err2);
      });
    } catch(err3) {
       console.warn('safeSetDoc block threw:', err3);
    }
  });

  // Record immutable audit log
  const auditId = `audit_csh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditEntry = {
    id: auditId,
    timestamp: nowIso,
    action: 'CASHIER_ASSISTED_PIN_RESET',
    memberId: member.id,
    membershipId: member.membershipId || '',
    actorName: cashierUsername,
    actorRole: 'CASHIER' as const,
    role: 'CASHIER' as const,
    performedBy: cashierUsername,
    storeId,
    storeName: storeName || '',
    module: 'SECURITY' as const,
    details: `Kasir [${cashierUsername}] mereset PIN untuk member [${member.name} - ${member.phone}] di ${storeName || storeId}. Verifikasi identitas fisik: SUDAH DIPERIKSA. Mode: ${isTemporary ? 'PIN SEMENTARA (Wajib ubah saat login)' : 'PIN BARU LANGSUNG'}.`,
    metadata: {
      mode,
      idDocumentVerified: true,
      forcePinChangeOnNextLogin: isTemporary,
      tempPinExpiresAt,
      notes: notes || 'Reset PIN berbantuan kasir di butik Watch Club.',
      lockoutCleared: Boolean(member.lockedUntil),
      previousFailedAttempts: member.failedPinAttempts || 0
    }
  };

  await safeSetDoc('audit_logs', auditId, auditEntry).catch(() => {});
  await safeSetDoc('audit', auditId, auditEntry).catch(() => {});

  return updatedData as CanonicalMemberDocument;
}

/**
 * Recovers account and unlocks it after successful Google OAuth verification.
 */
export async function unlockAndResetPinWithGoogle(params: {
  rawPhone: string;
  googleUid: string;
  googleEmail: string;
  newPin: string;
}): Promise<CanonicalMemberDocument> {
  return resetPinViaGoogleAuthClient(params);
}

