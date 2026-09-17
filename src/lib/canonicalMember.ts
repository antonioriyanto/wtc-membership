/**
 * Canonical Member Document Schema and E.164 Normalization
 * Watch Club Loyalty  System
 */

import { MemberTier } from '../types';
import { doc, runTransaction } from 'firebase/firestore';
import { db } from './firebase';

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

/**
 * Standardizes a store identifier (store code or boutique name) into
 * a standardized 2-to-4 character alphanumeric store code.
 */
export function resolveStoreCode(
  storeIdentifier?: string,
  stores?: Array<{ name: string; code?: string }>
): string {
  if (!storeIdentifier) return 'ONL';
  const trimmed = storeIdentifier.trim();

  // 1. Direct match with registered store branch list
  if (stores && stores.length > 0) {
    const found = stores.find(
      s => (s.code && s.code.toUpperCase() === trimmed.toUpperCase()) ||
           (s.name && s.name.toLowerCase() === trimmed.toLowerCase())
    );
    if (found?.code) {
      return found.code.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
  }

  // 2. Exact code pattern: 2 to 5 alphanumeric characters (e.g., "GI", "23S", "PUR", "ONL")
  if (/^[A-Z0-9]{2,5}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  // 3. Exact official mapping dictionary matching the 40 official boutiques + HO + Online
  const cleanKey = trimmed.toLowerCase();
  const KNOWN_STORE_CODES: Record<string, string> = {
    '23 paskal bandung': '23PSC',
    '23 semarang': '23SMG',
    'aeon sentul': 'AMSC',
    'alianyang singkawang': 'ALIAN',
    'ambarukmo plaza jogja': 'AMB',
    'ayani pontianak': 'AYANI',
    'big mall samarinda': 'BIG',
    'bogor botani': 'BOS',
    'cibinong city mall': 'CCM',
    'ciputra semarang': 'CL',
    'dp mall semarang': 'DPM',
    'duta mall 1 banjarmasin': 'DTM1',
    'duta mall 2 banjarmasin': 'DTM2',
    'e-walk balikpapan': 'EWALK',
    'gaia pontianak': 'GAIA',
    'gorontalo': 'GTLO',
    'jayapura': 'JYP',
    'jogja city mall': 'JCM',
    'kendari': 'KDI',
    'kota kasablanka jakarta': 'KOKAS',
    'kota kasablanka': 'KOKAS',
    'level 21 bali': 'LVL21',
    'mall olympic garden 1 malang': 'MOG1',
    'mall olympic garden 2 malang': 'MOG2',
    'manado town square': 'MANTS',
    'megamall manado': 'MEGAM',
    'pakuwon mall yogya': 'PMJ',
    'pakuwon mall jogja': 'PMJ',
    'level 21 mall bali': 'LVL21',
    'trans studio mall bali': 'BALI',
    'e-walk mall balikpapan': 'EWALK',
    'pentacity shopping venue balikpapan': 'PENTA',
    'trans studio mall bandung': 'TSM',
    '23 paskal shopping center bandung': '23PSC',
    'trans studio mall cibubur': 'CBB',
    'trans studio mall makassar': 'FINE',
    'pollux mall paragon semarang': 'PRG',
    'mal ciputra semarang': 'CL',
    '23 semarang shopping center': '23SMG',
    'plaza ambarrukmo yogyakarta': 'AMB',
    'pakuwon mall solo baru': 'SOBAR',
    'mal panakkukang makassar': 'KUKA',
    'mal jayapura': 'JYP',
    'citimall gorontalo': 'GTLO',
    'the park kendari': 'KDI',
    'the park mall solo': 'PARK',
    'aeon mall sentul city bogor': 'AMSC',
    'botani square mall bogor': 'BOS',
    'puri indah mall jakarta': 'PIM',
    'gaia bumi raya city pontianak': 'GAIA',
    'palu': 'PALU',
    'panakukang': 'KUKA',
    'paragon semarang': 'PRG',
    'penta city balikpapan': 'PENTA',
    'puri jakarta': 'PIM',
    'singkawang grand mall': 'SGM',
    'solo baru': 'SOBAR',
    'solo square': 'SQ',
    'summarecon mall bandung': 'SMB',
    'the park sawangan depok': 'SWG',
    'the park solo': 'PARK',
    'tsm bali': 'BALI',
    'tsm bandung': 'TSM',
    'tsm cibubur': 'CBB',
    'tsm makassar': 'FINE',
    'head office': 'HO',
    'online': 'ONL'
  };

  if (KNOWN_STORE_CODES[cleanKey]) {
    return KNOWN_STORE_CODES[cleanKey];
  }

  // 4. Fallback: initials from multi-word names
  const words = cleanKey.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const acronym = words.map(w => w[0]).join('').toUpperCase().slice(0, 4);
    if (acronym.length >= 2) return acronym;
  }

  return cleanKey.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 4) || 'ONL';
}

/**
 * Deterministic Sequential Membership ID Generator
 * Uses an atomic Firestore transaction against store_counters/{storeCode}
 * to read and increment lastSequence.
 * 
 * Formats: {storeCode}{0001}
 * Examples:
 *   GI + sequence 1   -> GI0001
 *   23S + sequence 1  -> 23S0001
 *   PUR + sequence 12 -> PUR0012
 *   ONL + sequence 1  -> ONL0001
 * 
 * First registered member of any store is guaranteed 0001.
 */
export async function generateSequentialMembershipId(
  storeIdentifier?: string,
  stores?: Array<{ name: string; code?: string }>
): Promise<string> {
  const storeCode = resolveStoreCode(storeIdentifier, stores);
  const counterDocRef = doc(db, 'store_counters', storeCode);

  try {
    const nextSeq = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterDocRef);
      let seq = 1;
      if (snap.exists()) {
        const data = snap.data();
        const current = data?.lastSequence;
        seq = typeof current === 'number' && current >= 1 ? current + 1 : 1;
        transaction.update(counterDocRef, {
          lastSequence: seq,
          updatedAt: new Date().toISOString()
        });
      } else {
        seq = 1;
        transaction.set(counterDocRef, {
          storeCode,
          lastSequence: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      return seq;
    });

    const formattedId = `${storeCode}${String(nextSeq).padStart(4, '0')}`;
    return formattedId;
  } catch (err) {
    console.warn(`[SequentialID] Firestore transaction counter fallback for store ${storeCode}:`, err);

    // Resilient local sequence fallback to guarantee 0001 start and sequential increment
    let maxSeq = 0;
    try {
      const raw = localStorage.getItem('wtc_members');
      if (raw) {
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const m of list) {
            const mId = String(m.membershipId || '').toUpperCase().trim();
            if (mId.startsWith(storeCode)) {
              const numPart = parseInt(mId.slice(storeCode.length), 10);
              if (!isNaN(numPart) && numPart > maxSeq) {
                maxSeq = numPart;
              }
            }
          }
        }
      }
    } catch {}

    const nextSeq = maxSeq + 1;
    return `${storeCode}${String(nextSeq).padStart(4, '0')}`;
  }
}

