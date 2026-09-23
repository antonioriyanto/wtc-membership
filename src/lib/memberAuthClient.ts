/**
 * Client-Side Member Authentication Service
 * Communicates strictly with the trusted Express backend on Cloud Run.
 * All PIN validations, lockout logic, and Google linking are server-authoritative.
 */

import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';
import { CanonicalMemberDocument } from './canonicalMember';
import { apiFetch } from './apiClient';

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
 * Pre-checks a customer's registered status, PIN configuration, and lockout status.
 * Evaluated strictly on the trusted backend server.
 */
export async function precheckCustomer(rawPhone: string, _fallbackMembers?: any[]): Promise<PrecheckResult> {
  const cleanPhone = (rawPhone || '').trim();
  const digits = cleanPhone.replace(/[^0-9]/g, '');
  if (digits.length < 8) {
    return { exists: false, isPinSet: false, isLocked: false, remainingLockoutSeconds: 0 };
  }

  try {
    const data = await apiFetch('/v1/auth/member/precheck', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ phone: cleanPhone })
    });

    return {
      exists: Boolean(data.exists),
      isPinSet: Boolean(data.isPinSet),
      isLocked: Boolean(data.isLocked),
      remainingLockoutSeconds: Number(data.remainingLockoutSeconds) || 0,
      name: data.name || 'Member Watch Club',
      membershipId: data.membershipId || '',
      recoveryEmail: data.recoveryEmail || ''
    };
  } catch (err: any) {
    console.warn('[memberAuthClient] Precheck error:', err);
    throw new Error(err?.message || 'Gagal menghubungi server untuk verifikasi nomor member.');
  }
}

/**
 * Verifies a customer's 6-digit PIN on the backend server.
 * Returns custom token and signs in the Firebase Auth client session with verified member claims.
 */
export async function verifyCustomerPinClient(
  rawPhone: string,
  enteredPin: string,
  _fallbackMembers?: any[]
): Promise<VerifyPinResult> {
  const cleanPhone = (rawPhone || '').trim();
  const digits = cleanPhone.replace(/[^0-9]/g, '');
  if (digits.length < 8 || !enteredPin) {
    throw new Error('Nomor HP dan 6-digit PIN wajib diisi.');
  }

  try {
    const data = await apiFetch('/v1/auth/member/login-pin', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ phone: cleanPhone, pin: enteredPin })
    });

    if (!data.success || !data.memberId) {
      throw new Error(data.error || 'Verifikasi PIN gagal.');
    }

    if (data.token) {
      try {
        await signInWithCustomToken(auth, data.token);
      } catch (authErr: any) {
        console.warn('Firebase custom token sign in warning:', authErr?.message);
      }
    }

    return {
      success: true,
      memberId: data.memberId,
      memberDoc: data.member as CanonicalMemberDocument,
      customToken: data.token
    };
  } catch (err: any) {
    console.error('[memberAuthClient] Verify PIN error:', err);
    throw new Error(err?.message || 'Gagal memverifikasi PIN.');
  }
}

/**
 * Sets customer 6-digit PIN on backend server.
 */
export async function setCustomerPinClient(params: {
  rawPhone: string;
  pin: string;
  recoveryEmail?: string;
  googleUid?: string;
  googleEmail?: string;
}): Promise<CanonicalMemberDocument> {
  try {
    const data = await apiFetch('/v1/auth/member/set-pin', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(params)
    });

    if (!data.success || !data.member) {
      throw new Error(data.error || 'Gagal mengatur PIN baru.');
    }

    return data.member as CanonicalMemberDocument;
  } catch (err: any) {
    console.error('[memberAuthClient] Set PIN error:', err);
    throw new Error(err?.message || 'Gagal mengatur PIN.');
  }
}

/**
 * Resets member PIN via Google OAuth verification on backend server.
 */
export async function resetPinViaGoogleAuthClient(params: {
  rawPhone: string;
  googleUid: string;
  googleEmail: string;
  newPin: string;
}): Promise<CanonicalMemberDocument> {
  try {
    const data = await apiFetch('/v1/auth/member/reset-pin-google', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify(params)
    });

    if (!data.success || !data.member) {
      throw new Error(data.error || 'Gagal mereset PIN via Google.');
    }

    return data.member as CanonicalMemberDocument;
  } catch (err: any) {
    console.error('[memberAuthClient] Reset PIN Google error:', err);
    throw new Error(err?.message || 'Gagal mereset PIN.');
  }
}

/**
 * Cashier-assisted PIN reset at boutique terminal.
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
  try {
    const data = await apiFetch('/v1/cashier/reset-pin', {
      method: 'POST',
      body: JSON.stringify(params)
    });

    if (!data.success || !data.member) {
      throw new Error(data.error || 'Gagal mereset PIN berbantuan kasir.');
    }

    return data.member as CanonicalMemberDocument;
  } catch (err: any) {
    console.error('[memberAuthClient] Cashier reset PIN error:', err);
    throw new Error(err?.message || 'Gagal mereset PIN oleh kasir.');
  }
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

/**
 * Server-Authoritative Google OAuth account linking.
 * Never performs direct writes to Firestore from client; executed via backend endpoint.
 */
export async function linkGoogleAccountClient(params: {
  memberId: string;
  googleUid: string;
  googleEmail: string;
  idToken?: string;
}): Promise<CanonicalMemberDocument> {
  const { memberId, googleUid, googleEmail, idToken } = params;
  if (!memberId || !googleUid) {
    throw new Error('Member ID dan Google UID wajib disertakan.');
  }

  try {
    const data = await apiFetch('/v1/member/link-google', {
      method: 'POST',
      body: JSON.stringify({
        memberId,
        googleUid,
        googleEmail,
        idToken
      })
    });

    if (!data.success || !data.member) {
      throw new Error(data.error || 'Gagal menautkan akun Google pada server.');
    }

    return data.member as CanonicalMemberDocument;
  } catch (err: any) {
    console.error('[memberAuthClient] Link Google error:', err);
    throw new Error(err?.message || 'Gagal menautkan akun Google.');
  }
}
