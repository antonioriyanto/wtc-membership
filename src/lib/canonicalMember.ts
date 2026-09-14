/**
 * Canonical Member Document Schema and E.164 Normalization
 * Watch Club Loyalty & POS System
 */

import { MemberTier } from '../types';

export interface CanonicalMemberDocument {
  id: string;
  membershipId: string;
  name: string;
  phone: string;
  phoneE164: string;
  email?: string;
  tier: MemberTier;
  points: number;
  lifetimePoints: number;
  totalSpend: number;
  joinDate: string;
  
  // Cryptographic Credential Attributes
  pinHash?: string;
  pinSalt?: string;
  isPinSet: boolean;
  failedPinAttempts: number;
  lockedUntil: string | null; // ISO timestamp e.g. "2026-09-14T03:45:00.000Z"
  recoveryEmail?: string;
  forcePinChangeOnNextLogin?: boolean;
  tempPinExpiresAt?: string | null;
  
  // Identity & Auth Links
  googleUid?: string;
  linkedAuthUids?: string[];
  
  // Retail Meta
  registeredStore?: string;
  lastStoreVisited?: string;
  lastVisitDate?: string;
  gender?: 'Pria' | 'Wanita';
  birthDate?: string;
  address?: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

/**
 * Standardizes any Indonesian mobile number into standard E.164 format (+628xxxxxxxxxx).
 * Examples:
 *   "081234567890"   -> "+6281234567890"
 *   "6281234567890"  -> "+6281234567890"
 *   "+62 812-3456-7890" -> "+6281234567890"
 */
export function toE164(rawPhone: string): string {
  if (!rawPhone) return '';
  const digits = rawPhone.replace(/[^0-9]/g, '');
  if (!digits) return '';

  if (digits.startsWith('62')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+62${digits.slice(1)}`;
  }
  if (digits.length >= 9) {
    return `+62${digits}`;
  }
  return `+${digits}`;
}

/**
 * Normalizes an E.164 phone number into standard local Indonesian representation (08xxxxxxxxxx).
 */
export function toLocalPhone(phone: string): string {
  if (!phone) return '';
  let digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('62')) {
    return '0' + digits.slice(2);
  }
  if (!digits.startsWith('0') && digits.length >= 8) {
    return '0' + digits;
  }
  return digits;
}

/**
 * Checks if a member account is currently locked due to failed PIN attempts.
 */
export function isAccountLocked(member: Pick<CanonicalMemberDocument, 'lockedUntil'>): {
  locked: boolean;
  remainingSeconds: number;
} {
  if (!member.lockedUntil) {
    return { locked: false, remainingSeconds: 0 };
  }

  const lockedTime = new Date(member.lockedUntil).getTime();
  const now = Date.now();
  if (now >= lockedTime) {
    return { locked: false, remainingSeconds: 0 };
  }

  const remainingSeconds = Math.ceil((lockedTime - now) / 1000);
  return { locked: true, remainingSeconds };
}
