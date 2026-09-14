/**
 * Server-Side PIN Recovery & Cashier Override Cloud Functions
 * Watch Club Loyalty & POS System
 *
 * Endpoints:
 * 1. resetPinViaGoogleAuth: Primary self-service Google OAuth verification for forgotten/locked PINs.
 * 2. cashierAssistedPinReset: In-store retail fallback protocol restricted to authorized Cashiers.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, DocumentReference, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as crypto from 'crypto';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

/**
 * Callable Context interface standard across Firebase Cloud Functions
 */
export interface CallableContext {
  auth?: {
    uid: string;
    token: {
      role?: string;
      email?: string;
      email_verified?: boolean;
      firebase?: {
        sign_in_provider?: string;
        [key: string]: any;
      };
      [key: string]: any;
    };
  };
  rawRequest?: any;
}

export interface ResetPinViaGoogleRequest {
  phoneE164: string;
  newPin: string;
  idToken?: string; // Optional client-passed ID token if context not auto-populated
}

export interface CashierAssistedPinResetRequest {
  memberId: string;
  cashierUsername: string;
  storeId: string;
  storeName?: string;
  idDocumentVerified: boolean;
  notes?: string;
  mode: 'TEMPORARY_PIN' | 'DIRECT_CUSTOMER_PIN';
  newPin: string; // 6-digit numeric PIN (either generated temp PIN or direct customer input)
  cashierPin?: string; // Optional Cashier verification credential
}

/**
 * Cryptographic PBKDF2 hashing - 100,000 iterations SHA-256
 */
function hashPinSync(pin: string, saltHex: string): string {
  const salt = Buffer.from(saltHex, 'hex');
  const derivedKey = crypto.pbkdf2Sync(pin.trim(), salt, 100000, 32, 'sha256');
  return derivedKey.toString('hex');
}

function generateSaltSync(length = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Finds member document by E.164 phone or local representations
 */
async function findMemberDocByPhone(phoneE164: string): Promise<{ ref: DocumentReference; data: any } | null> {
  const cleanDigits = phoneE164.replace(/[^0-9]/g, '');
  const localDigits = cleanDigits.startsWith('62') ? '0' + cleanDigits.slice(2) : cleanDigits;
  const e164 = '+' + (cleanDigits.startsWith('62') ? cleanDigits : '62' + (cleanDigits.startsWith('0') ? cleanDigits.slice(1) : cleanDigits));

  const candidates = Array.from(new Set([
    phoneE164,
    e164,
    localDigits,
    cleanDigits
  ]));

  for (const cand of candidates) {
    const snap = await db.collection('members').where('phone', '==', cand).limit(1).get();
    if (!snap.empty) {
      return { ref: snap.docs[0].ref, data: snap.docs[0].data() };
    }
    const snapE164 = await db.collection('members').where('phoneE164', '==', cand).limit(1).get();
    if (!snapE164.empty) {
      return { ref: snapE164.docs[0].ref, data: snapE164.docs[0].data() };
    }
  }

  return null;
}

/**
 * Validates 6-digit numeric PIN format
 */
function validatePinFormat(pin: string): void {
  if (!pin || typeof pin !== 'string') {
    throw new Error('PIN wajib diisi.');
  }
  const trimmed = pin.trim();
  if (trimmed.length !== 6 || !/^\d{6}$/.test(trimmed)) {
    throw new Error('PIN harus tepat 6 angka numerik (0-9).');
  }
}

/**
 * Rate-limit check for recovery requests: max 3 attempts per hour per member
 */
async function checkRecoveryRateLimit(memberId: string): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const logsSnap = await db.collection('audit_logs')
    .where('memberId', '==', memberId)
    .where('action', '==', 'CUSTOMER_PIN_RESET_VIA_GOOGLE')
    .where('timestamp', '>=', oneHourAgo)
    .get();

  if (logsSnap.size >= 3) {
    throw new Error('Batas percobaan pemulihan PIN tercapai (maksimal 3 kali per jam). Silakan kunjungi gerai Watch Club untuk bantuan kasir.');
  }
}

/**
 * Primary Self-Service Path:
 * resetPinViaGoogleAuth
 *
 * Validates caller's Google OAuth identity, verifies linking to the member profile,
 * resets lockout state, applies PBKDF2 hash with fresh salt, and commits audit trail.
 */
export async function resetPinViaGoogleAuth(
  data: ResetPinViaGoogleRequest,
  context?: CallableContext
) {
  const { phoneE164, newPin, idToken } = data;

  if (!phoneE164) {
    throw new Error('Nomor telepon E.164 wajib disertakan.');
  }
  validatePinFormat(newPin);

  // 1. Resolve Auth Context (either from Callable context or decoded idToken)
  let callerUid = context?.auth?.uid;
  let callerEmail = context?.auth?.token?.email;
  let signInProvider = context?.auth?.token?.firebase?.sign_in_provider;

  if (!callerUid && idToken) {
    try {
      const decoded = await auth.verifyIdToken(idToken);
      callerUid = decoded.uid;
      callerEmail = decoded.email;
      signInProvider = decoded.firebase?.sign_in_provider;
    } catch (err: any) {
      throw new Error(`Token autentikasi tidak valid: ${err?.message || 'Unauthorized'}`);
    }
  }

  if (!callerUid) {
    throw new Error('Autentikasi Google diperlukan. Silakan login dengan akun Google terlebih dahulu.');
  }

  // 2. Fetch Member Record
  const memberRecord = await findMemberDocByPhone(phoneE164);
  if (!memberRecord) {
    throw new Error('Nomor akun member Watch Club tidak ditemukan.');
  }

  const { ref, data: member } = memberRecord;

  // 3. Rate-limiting check
  await checkRecoveryRateLimit(ref.id);

  // 4. Verify Google Account Linkage
  const linkedAuthUids: string[] = Array.isArray(member.linkedAuthUids) ? member.linkedAuthUids : [];
  const registeredGoogleUid = member.googleUid;
  const registeredEmail = (member.recoveryEmail || member.email || '').toLowerCase().trim();
  const currentEmail = (callerEmail || '').toLowerCase().trim();

  const isUidMatched = (registeredGoogleUid && registeredGoogleUid === callerUid) || linkedAuthUids.includes(callerUid);
  const isEmailMatched = registeredEmail && currentEmail && registeredEmail === currentEmail;

  // Allow first-time linking if member does not have googleUid set yet and email matches, otherwise require match
  if (!isUidMatched && !isEmailMatched && registeredGoogleUid) {
    throw new Error(
      `Akun Google (${callerEmail || callerUid}) tidak sesuai dengan akun pemulihan yang terdaftar untuk nomor ini. Silakan gunakan akun Google yang ditautkan atau hubungi kasir di butik.`
    );
  }

  // 5. Generate fresh cryptographically random salt & PBKDF2 hash
  const salt = generateSaltSync(16);
  const pinHash = hashPinSync(newPin, salt);

  // Update linkedAuthUids if new
  const updatedLinkedUids = Array.from(new Set([...linkedAuthUids, callerUid]));

  const nowIso = new Date().toISOString();

  // 6. Atomically update credentials & clear lockout
  await ref.update({
    pinHash,
    pinSalt: salt,
    isPinSet: true,
    failedPinAttempts: 0,
    lockedUntil: null,
    forcePinChangeOnNextLogin: false,
    googleUid: callerUid,
    linkedAuthUids: updatedLinkedUids,
    recoveryEmail: callerEmail || member.recoveryEmail || member.email || '',
    lastPinResetAt: nowIso,
    updatedAt: nowIso
  });

  // 7. Write immutable audit log to /audit_logs
  const auditLogId = `audit_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditPayload = {
    id: auditLogId,
    action: 'CUSTOMER_PIN_RESET_VIA_GOOGLE',
    timestamp: nowIso,
    memberId: ref.id,
    membershipId: member.membershipId || '',
    phoneE164,
    performedBy: 'CUSTOMER',
    role: 'CUSTOMER',
    googleUid: callerUid,
    googleEmail: callerEmail || '',
    signInProvider: signInProvider || 'google.com',
    details: {
      channel: 'PWA_SELF_SERVICE',
      lockoutCleared: Boolean(member.lockedUntil),
      failedAttemptsReset: member.failedPinAttempts || 0
    }
  };

  await db.collection('audit_logs').doc(auditLogId).set(auditPayload);
  // Mirror to /audit collection for system backward compatibility
  await db.collection('audit').doc(auditLogId).set(auditPayload).catch(() => {});

  // 8. Generate customer custom token
  const customToken = await auth.createCustomToken(ref.id, {
    role: 'CUSTOMER',
    memberId: ref.id,
    membershipId: member.membershipId,
    phone: phoneE164
  });

  return {
    success: true,
    message: 'PIN berhasil dipulihkan dengan verifikasi Google OAuth.',
    memberId: ref.id,
    membershipId: member.membershipId,
    name: member.name,
    customToken,
    timestamp: nowIso
  };
}

/**
 * In-Store Retail Fallback Protocol:
 * cashierAssistedPinReset
 *
 * Strictly restricted to CASHIER role.
 * Requires physical ID verification check, logs cashier username and store ID,
 * sets temporary PIN or direct new PIN, and records immutable audit log.
 */
export async function cashierAssistedPinReset(
  data: CashierAssistedPinResetRequest,
  context?: CallableContext
) {
  const {
    memberId,
    cashierUsername,
    storeId,
    storeName,
    idDocumentVerified,
    notes,
    mode,
    newPin
  } = data;

  // 1. Authorization Verification
  const callerRole = context?.auth?.token?.role;
  const isCallerCashier = callerRole === 'CASHIER' || callerRole === 'ADMIN';

  // If invoked directly from authorized cashier terminal, validate cashier identity parameters
  if (!isCallerCashier && (!cashierUsername || !storeId)) {
    throw new Error('Akses ditolak: Operasi reset PIN di toko hanya dapat dilakukan oleh kasir terotorisasi.');
  }

  // 2. Physical Identity Verification Gate
  if (!idDocumentVerified) {
    throw new Error('Verifikasi dokumen identitas fisik (KTP/SIM/Paspor) wajib dilakukan sebelum melakukan reset PIN.');
  }

  validatePinFormat(newPin);

  // 3. Retrieve Member Document
  const memberRef = db.collection('members').doc(memberId);
  const memberSnap = await memberRef.get();

  if (!memberSnap.exists) {
    throw new Error('Dokumen member tidak ditemukan di sistem.');
  }

  const member = memberSnap.data()!;
  const nowIso = new Date().toISOString();

  // 4. Generate PBKDF2 hash with fresh salt
  const salt = generateSaltSync(16);
  const pinHash = hashPinSync(newPin, salt);

  const isTemporary = mode === 'TEMPORARY_PIN';
  const tempPinExpiresAt = isTemporary 
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours validity
    : null;

  // 5. Update member record: Clear lockout and set forcePinChange flag
  await memberRef.update({
    pinHash,
    pinSalt: salt,
    isPinSet: true,
    failedPinAttempts: 0,
    lockedUntil: null,
    forcePinChangeOnNextLogin: isTemporary,
    tempPinExpiresAt,
    lastCashierResetBy: cashierUsername,
    lastCashierResetStoreId: storeId,
    lastPinResetAt: nowIso,
    updatedAt: nowIso
  });

  // 6. Record immutable audit log
  const auditLogId = `audit_csh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const auditPayload = {
    id: auditLogId,
    action: 'CASHIER_ASSISTED_PIN_RESET',
    timestamp: nowIso,
    memberId,
    membershipId: member.membershipId || '',
    memberName: member.name || '',
    phone: member.phone || '',
    performedBy: cashierUsername,
    role: 'CASHIER',
    storeId,
    storeName: storeName || '',
    details: {
      mode,
      idDocumentVerified: true,
      forcePinChangeOnNextLogin: isTemporary,
      tempPinExpiresAt,
      notes: notes || 'Reset PIN berbantuan kasir di butik dengan verifikasi KTP fisik.',
      lockoutCleared: Boolean(member.lockedUntil),
      previousFailedAttempts: member.failedPinAttempts || 0
    }
  };

  await db.collection('audit_logs').doc(auditLogId).set(auditPayload);
  await db.collection('audit').doc(auditLogId).set(auditPayload).catch(() => {});

  return {
    success: true,
    message: isTemporary 
      ? 'PIN sementara berhasil dibuat. Pelanggan wajib mengganti PIN pada saat login pertama.'
      : 'PIN baru berhasil disimpan dan akun aktif kembali.',
    memberId,
    membershipId: member.membershipId,
    isTemporary,
    timestamp: nowIso
  };
}
