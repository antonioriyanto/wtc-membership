/**
 * Cloud Functions for Watch Club Member Credential Authentication
 * Module 2: Server-side PIN verification, brute-force lockout, and Custom Token issuance.
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, DocumentReference } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as crypto from 'crypto';

if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const auth = getAuth();

interface VerifyPinRequest {
  phoneE164: string;
  pin: string;
}

interface SetPinRequest {
  phoneE164: string;
  pin: string;
  recoveryEmail?: string;
  googleUid?: string;
}

interface PrecheckRequest {
  phoneE164: string;
}

/**
 * Server-side PBKDF2 hashing matching the client-side 100,000-iteration SHA-256 spec
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
 * Finds member document by E.164 phone or local phone representations
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
 * Pre-checks customer state without exposing any cryptographic attributes
 */
export async function precheckCustomer(data: PrecheckRequest) {
  const { phoneE164 } = data;
  if (!phoneE164) {
    return { exists: false, isPinSet: false, isLocked: false, remainingLockoutSeconds: 0 };
  }

  const found = await findMemberDocByPhone(phoneE164);
  if (!found) {
    return { exists: false, isPinSet: false, isLocked: false, remainingLockoutSeconds: 0 };
  }

  const doc = found.data;
  const now = Date.now();
  let isLocked = false;
  let remainingSeconds = 0;

  if (doc.lockedUntil) {
    const lockTime = new Date(doc.lockedUntil).getTime();
    if (now < lockTime) {
      isLocked = true;
      remainingSeconds = Math.ceil((lockTime - now) / 1000);
    }
  }

  return {
    exists: true,
    isPinSet: Boolean(doc.isPinSet && doc.pinHash && doc.pinSalt),
    isLocked,
    remainingLockoutSeconds: remainingSeconds,
    name: doc.name || 'Member Watch Club',
    membershipId: doc.membershipId || '',
    recoveryEmail: doc.recoveryEmail || doc.email || ''
  };
}

/**
 * Verifies customer 6-digit PIN strictly server-side.
 * Enforces 15-minute brute-force lockout on 5 consecutive failures.
 * Returns a Firebase Auth Custom Token on success.
 */
export async function verifyCustomerPin(data: VerifyPinRequest) {
  const { phoneE164, pin } = data;
  if (!phoneE164 || !pin) {
    throw new Error('Nomor telepon E.164 dan PIN 6-digit wajib diisi.');
  }

  const found = await findMemberDocByPhone(phoneE164);
  if (!found) {
    throw new Error('Nomor member tidak ditemukan di database Watch Club.');
  }

  const { ref, data: member } = found;
  const now = Date.now();

  // 1. Lockout verification
  if (member.lockedUntil) {
    const lockTime = new Date(member.lockedUntil).getTime();
    if (now < lockTime) {
      const remainingMinutes = Math.ceil((lockTime - now) / 60000);
      const remainingSeconds = Math.ceil((lockTime - now) / 1000);
      throw new Error(
        `Akun terkunci sementara karena 5x percobaan gagal. Coba lagi dalam ${remainingMinutes} menit (${remainingSeconds} detik).`
      );
    }
  }

  // 2. PIN setup check
  if (!member.pinHash || !member.pinSalt) {
    throw new Error('PIN belum diatur untuk akun ini. Silakan lakukan setup PIN terlebih dahulu.');
  }

  // 3. Cryptographic PBKDF2 hash check
  const calculatedHash = hashPinSync(pin, member.pinSalt);
  const isValid = crypto.timingSafeEqual(
    Buffer.from(calculatedHash, 'hex'),
    Buffer.from(member.pinHash, 'hex')
  );

  if (!isValid) {
    const nextAttempts = (member.failedPinAttempts || 0) + 1;
    if (nextAttempts >= 5) {
      const lockedUntil = new Date(now + 15 * 60 * 1000).toISOString();
      await ref.update({
        failedPinAttempts: 0,
        lockedUntil
      });
      throw new Error('Akun Anda terkunci selama 15 menit karena 5 kali percobaan PIN salah.');
    } else {
      await ref.update({
        failedPinAttempts: nextAttempts
      });
      const attemptsRemaining = 5 - nextAttempts;
      throw new Error(`PIN salah. Sisa kesempatan: ${attemptsRemaining} kali.`);
    }
  }

  // 4. Success: Reset failed attempts & clear lockout
  await ref.update({
    failedPinAttempts: 0,
    lockedUntil: null,
    lastLoginAt: new Date().toISOString()
  });

  // 5. Generate Firebase Auth Custom Token with Customer claims
  const customToken = await auth.createCustomToken(ref.id, {
    role: 'CUSTOMER',
    memberId: ref.id,
    membershipId: member.membershipId,
    phone: phoneE164
  });

  return {
    success: true,
    customToken,
    memberId: ref.id,
    membershipId: member.membershipId,
    name: member.name,
    points: member.points || 0,
    tier: member.tier || 'BLUE'
  };
}

/**
 * Sets or resets customer PIN with mandatory cryptographic salt & recovery metadata.
 */
export async function setCustomerPin(data: SetPinRequest) {
  const { phoneE164, pin, recoveryEmail, googleUid } = data;
  if (!phoneE164 || !pin || pin.length !== 6) {
    throw new Error('Nomor telepon E.164 dan PIN 6-digit wajib diisi.');
  }

  const found = await findMemberDocByPhone(phoneE164);
  if (!found) {
    throw new Error('Member tidak ditemukan.');
  }

  const { ref, data: member } = found;
  const salt = generateSaltSync(16);
  const pinHash = hashPinSync(pin, salt);

  const linkedAuthUids: string[] = Array.isArray(member.linkedAuthUids) ? [...member.linkedAuthUids] : [];
  if (googleUid && !linkedAuthUids.includes(googleUid)) {
    linkedAuthUids.push(googleUid);
  }

  const updates: Record<string, any> = {
    pinHash,
    pinSalt: salt,
    isPinSet: true,
    failedPinAttempts: 0,
    lockedUntil: null,
    phoneE164,
    updatedAt: new Date().toISOString()
  };

  if (recoveryEmail) {
    updates.recoveryEmail = recoveryEmail;
  }
  if (googleUid) {
    updates.googleUid = googleUid;
    updates.linkedAuthUids = linkedAuthUids;
  }

  await ref.update(updates);

  const customToken = await auth.createCustomToken(ref.id, {
    role: 'CUSTOMER',
    memberId: ref.id,
    membershipId: member.membershipId,
    phone: phoneE164
  });

  return {
    success: true,
    customToken,
    memberId: ref.id
  };
}
