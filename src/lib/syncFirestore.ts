import { collection, onSnapshot, doc, setDoc, getDoc, getDocs, writeBatch, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { initialStores, initialMembers, initialVouchers, initialTransactions, initialSupportTickets, initialCampaigns, initialAuditLogs, initialLoyaltyConfig } from "../data/mockData";
import { StoreBranch } from "../types";

export function cleanForFirestore<T>(obj: T): T {
  if (obj === undefined) return '' as any;
  if (obj === null) return null as any;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore) as any;
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    } else {
      cleaned[key] = '';
    }
  }
  return cleaned as any;
}

/**
 * Ensures any store record (from Firestore, localStorage, or state)
 * is fully populated with official phone numbers, addresses, images, and coordinates.
 */
export function cleanAndEnrichStore(rawStore: any): StoreBranch {
  if (!rawStore) return initialStores[0];

  const rawCode = (rawStore.code || rawStore.id || '').toString().trim().toUpperCase();
  const rawName = (rawStore.name || '').toString().trim().toLowerCase();
  const rawMall = (rawStore.mallName || '').toString().trim().toLowerCase();

  // Match against official initialStores (all 42 Watch Club branches)
  const fallback = initialStores.find(is => {
    const isCode = (is.code || is.id || '').toUpperCase();
    const isName = (is.name || '').toLowerCase();
    const isMall = (is.mallName || '').toLowerCase();
    
    if (rawCode && isCode === rawCode) return true;
    if (rawName && isName === rawName) return true;
    if (rawMall && isMall === rawMall) return true;
    if (rawName && (isName.includes(rawName) || rawName.includes(isName))) return true;
    if (rawMall && (isMall.includes(rawMall) || rawMall.includes(isMall))) return true;
    return false;
  }) || initialStores.find(is => is.city?.toLowerCase() === rawStore.city?.toLowerCase()) || initialStores[0];

  const isValidPhone = (p: any): boolean => {
    if (!p || typeof p !== 'string') return false;
    const digits = p.replace(/[^0-9]/g, '');
    return digits.length >= 7 && p.trim() !== '-';
  };

  const isValidAddress = (a: any, storeTitle: string): boolean => {
    if (!a || typeof a !== 'string') return false;
    const t = a.trim();
    if (t === '-' || t.length <= 15) return false;
    if (t.toLowerCase() === storeTitle.toLowerCase()) return false;
    return true;
  };

  const isValidImage = (img: any): boolean => {
    return typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:image')) && img.length > 15;
  };

  // If this store belongs to the official 42 Watch Club branches, strictly enforce the master Nama Cabang and metadata!
  const isOfficialBranch = false; // ALLOW DB EDITS TO OVERRIDE MOCK DATA

  const name = isOfficialBranch ? fallback.name : (rawStore.name || fallback.name);
  const mallName = isOfficialBranch ? (fallback.mallName || fallback.name) : (rawStore.mallName || name);
  const city = isOfficialBranch ? fallback.city : (rawStore.city || fallback.city);
  const region = isOfficialBranch ? fallback.region : (rawStore.region || fallback.region);

  const phone = isOfficialBranch ? fallback.phone : (isValidPhone(rawStore.phone) 
    ? rawStore.phone 
    : (isValidPhone(rawStore.whatsapp) ? rawStore.whatsapp : fallback.phone));

  const whatsapp = isOfficialBranch ? fallback.whatsapp : (isValidPhone(rawStore.whatsapp) 
    ? rawStore.whatsapp 
    : (isValidPhone(rawStore.phone) ? rawStore.phone : fallback.whatsapp || fallback.phone));

  const rawDigits = (whatsapp || phone || fallback.phone || '').replace(/[^0-9]/g, '');
  const waNumber = isOfficialBranch && fallback.waNumber ? fallback.waNumber : (rawDigits.startsWith('0') ? '62' + rawDigits.slice(1) : (rawDigits.startsWith('62') ? rawDigits : '62' + rawDigits));

  const floorUnit = (rawStore.floorUnit && rawStore.floorUnit.trim() !== '-' && rawStore.floorUnit.trim().length > 1) 
    ? rawStore.floorUnit 
    : fallback.floorUnit;

  const address = isOfficialBranch ? fallback.address : (isValidAddress(rawStore.address, name) 
    ? rawStore.address 
    : fallback.address);

  const fullAddress = isOfficialBranch ? fallback.fullAddress : (isValidAddress(rawStore.fullAddress, name) 
    ? rawStore.fullAddress 
    : (fallback.fullAddress || `${mallName} ${floorUnit} ${address}`));

  const imageUrl = isValidImage(rawStore.imageUrl) 
    ? rawStore.imageUrl 
    : fallback.imageUrl;

  const email = isOfficialBranch && fallback.email ? fallback.email : (rawStore.email || fallback.email);

  const latitude = (isOfficialBranch && fallback.latitude !== undefined)
    ? fallback.latitude
    : ((rawStore.latitude !== undefined && rawStore.latitude !== null && !isNaN(Number(rawStore.latitude)))
      ? Number(rawStore.latitude)
      : fallback.latitude);

  const longitude = (isOfficialBranch && fallback.longitude !== undefined)
    ? fallback.longitude
    : ((rawStore.longitude !== undefined && rawStore.longitude !== null && !isNaN(Number(rawStore.longitude)))
      ? Number(rawStore.longitude)
      : fallback.longitude);

  return {
    ...fallback,
    ...rawStore,
    id: rawStore.id || fallback.id,
    code: fallback.code || rawStore.code,
    name,
    mallName,
    city,
    region,
    floorUnit,
    address,
    fullAddress,
    phone,
    whatsapp,
    waNumber,
    email,
    imageUrl,
    latitude,
    longitude,
    location: `${name}, ${city}`,
    type: fallback.type || rawStore.type || 'STORE',
    isActive: rawStore.isActive !== false,
  };
}

/**
 * Synchronizes and updates all 42 official Watch Club store branches to Firestore
 * so that any legacy documents with outdated branch name, missing phone, broken image, or incomplete address
 * are updated to the official database.
 */
export async function syncOfficialStoresToFirestore(force = false) {
  try {
    const snap = await getDocs(collection(db, 'stores'));
    let needUpdate = force || snap.empty;

    if (!needUpdate) {
      for (const d of snap.docs) {
        const dat = d.data();
        const p = dat.phone || '';
        const digits = p.replace(/[^0-9]/g, '');
        const official = initialStores.find(s => s.id === d.id || s.code === dat.code);
        if (
          digits.length < 7 || 
          p.trim() === '-' || 
          !dat.imageUrl || 
          !dat.fullAddress ||
          (official && (dat.name !== official.name || dat.mallName !== official.mallName))
        ) {
          needUpdate = true;
          break;
        }
      }
    }

    if (needUpdate) {
      console.log('[Firestore] Syncing official 42 Watch Club branches to Firestore with canonical Nama Cabang...');
      const batch = writeBatch(db);
      initialStores.forEach(s => {
        batch.set(doc(db, 'stores', s.id), cleanForFirestore(s), { merge: true });
      });
      await batch.commit();
      console.log('[Firestore] Successfully updated official 42 stores.');
    }
  } catch (err: any) {
    console.warn('[Firestore] Store sync check:', err?.message || err);
  }
}

export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';
  let digits = rawPhone.replace(/[^0-9]/g, '');
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (!digits.startsWith('0') && digits.length >= 8) {
    digits = '0' + digits;
  }
  return digits;
}

export function isSamePhoneNumber(phoneA: string, phoneB: string): boolean {
  const normA = normalizePhoneNumber(phoneA);
  const normB = normalizePhoneNumber(phoneB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;
  if (normA.length >= 8 && normB.length >= 8) {
    // Compare subscriber portion (last 8-9 digits)
    return normA.slice(-8) === normB.slice(-8);
  }
  return false;
}

export async function findMemberByPhoneInFirestore(phone: string): Promise<any | null> {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized || normalized.length < 8) return null;

  try {
    // 1. Direct indexed queries for common phone formats
    const candidates = Array.from(new Set([
      phone.trim(),
      normalized,
      '62' + normalized.slice(1),
      '+62' + normalized.slice(1),
      '+62 ' + normalized.slice(1, 4) + '-' + normalized.slice(4, 8) + '-' + normalized.slice(8)
    ])).filter(Boolean);

    for (const cand of candidates) {
      try {
        const q = query(collection(db, 'members'), where('phone', '==', cand));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const d = snap.docs[0];
          return { id: d.id, ...d.data() };
        }
      } catch (innerErr) {
        // Ignore individual query index/permission error
      }
    }

    // 2. Comprehensive fallback scan over members collection
    try {
      const allSnap = await getDocs(collection(db, 'members'));
      for (const d of allSnap.docs) {
        const data = d.data();
        if (data.phone && isSamePhoneNumber(data.phone, normalized)) {
          return { id: d.id, ...data };
        }
      }
    } catch (scanErr) {
      // Ignore scan error
    }
  } catch (err) {
    // Gracefully handle any Firestore permission or network error
  }

  // 3. Fallback to local storage members
  try {
    const saved = localStorage.getItem('wtc_members');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const found = parsed.find((m: any) => m.phone && isSamePhoneNumber(m.phone, normalized));
        if (found) return found;
      }
    }
  } catch {}

  return null;
}

export async function findMemberByGoogleUidInFirestore(uid: string): Promise<any | null> {
  if (!uid) return null;
  try {
    const docSnap = await getDoc(doc(db, 'members', uid));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    const q = query(collection(db, 'members'), where('googleUid', '==', uid));
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() };
    }
  } catch (err) {
    console.error("Error querying member by googleUid in Firestore:", err);
  }
  return null;
}

export async function safeSetDoc(collectionName: string, docId: string, data: any) {
  const sanitized = cleanForFirestore(data);
  await setDoc(doc(db, collectionName, String(docId)), sanitized);
  return sanitized;
}

export function setupFirestoreListeners(callbacks: any) {
  const unsubscribes: any[] = [];

  const collections = [
    { name: 'stores', set: callbacks.setStores, storageKey: 'wtc_stores' },
    { name: 'members', set: callbacks.setMembers, storageKey: 'wtc_members' },
    { name: 'vouchers', set: callbacks.setVouchers, storageKey: 'wtc_vouchers' },
    { name: 'transactions', set: callbacks.setTransactions, storageKey: 'wtc_transactions' },
    { name: 'support', set: callbacks.setSupportTickets, storageKey: 'wtc_tickets' },
    { name: 'campaigns', set: callbacks.setCampaigns, storageKey: 'wtc_campaigns' },
    { name: 'audit', set: callbacks.setAuditLogs, storageKey: 'wtc_audit_logs' },
  ];

  collections.forEach(({ name, set, storageKey }) => {
    const unsub = onSnapshot(collection(db, name), (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (name === 'stores') {
        // Guarantee all official 42 stores are present and enriched with full metadata
        const storeMap = new Map();
        initialStores.forEach(s => storeMap.set(s.id, cleanAndEnrichStore(s)));
        data.forEach(s => {
          const enriched = cleanAndEnrichStore(s);
          storeMap.set(enriched.id, enriched);
        });
        data = Array.from(storeMap.values()).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
      }

      if (data.length > 0) {
        if (name === 'transactions') {
          const seenIds = new Set<string>();
          const seenReceipts = new Set<string>();
          data = data.sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
            .filter((t: any) => {
              if (!t || !t.id || seenIds.has(t.id)) return false;
              
              // Deduplicate by receipt number and member to clean up past glitches
              if (t.receiptNo && t.type === 'EARN') {
                const rKey = `${t.receiptNo.trim().toUpperCase()}_${t.memberId}`;
                if (seenReceipts.has(rKey)) return false;
                seenReceipts.add(rKey);
              }
              
              seenIds.add(t.id);
              return true;
            });
        }
        set(data);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(data));
          } catch {}
        }
      }
    }, (error) => {
      if (error?.code === 'permission-denied') {
        console.warn(`[Firestore] Permission denied reading '${name}'. Using local cache.`);
      } else {
        console.error(`Error fetching ${name}:`, error);
      }
    });
    unsubscribes.push(unsub);
  });

  const unsubConfig = onSnapshot(doc(db, 'config', 'loyalty'), (docSnap) => {
    if (docSnap.exists()) {
      callbacks.setLoyaltyConfig(docSnap.data());
      try {
        localStorage.setItem('wtc_loyalty_config', JSON.stringify(docSnap.data()));
      } catch {}
    }
  }, (error) => {
    if (error?.code === 'permission-denied') {
      console.warn('[Firestore] Permission denied reading loyalty config. Using local cache.');
    } else {
      console.error('Error fetching loyalty config:', error);
    }
  });
  unsubscribes.push(unsubConfig);

  // Sync any offline/locally stored members to Firestore so they are never lost
  // and guarantee 42 official stores in Firestore have valid phone and address
  setTimeout(async () => {
    try {
      await syncOfficialStoresToFirestore();

      const localMembersRaw = localStorage.getItem('wtc_members');
      if (localMembersRaw) {
        const localMembers = JSON.parse(localMembersRaw);
        if (Array.isArray(localMembers) && localMembers.length > 0) {
          const remoteSnap = await getDocs(collection(db, 'members'));
          const remoteIds = new Set(remoteSnap.docs.map(d => d.id));
          const remotePhones = new Set(remoteSnap.docs.map(d => (d.data().phone || '').replace(/[^0-9]/g, '')));

          for (const m of localMembers) {
            const cleanPhone = (m.phone || '').replace(/[^0-9]/g, '');
            if (m.id && !remoteIds.has(m.id) && (!cleanPhone || !remotePhones.has(cleanPhone))) {
              await safeSetDoc('members', m.id, m);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Local-to-cloud sync check completed with note:', e);
    }
  }, 1500);

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

export async function seedFirestoreIfEmpty() {
  try {
    const storesSnap = await getDocs(collection(db, 'stores'));
    if (storesSnap.empty) {
      const batch = writeBatch(db);
      initialStores.forEach(s => batch.set(doc(db, 'stores', s.id), s));
      initialMembers.forEach(m => batch.set(doc(db, 'members', String(m.id)), cleanForFirestore(m)));
      initialVouchers.forEach(v => batch.set(doc(db, 'vouchers', String(v.id)), cleanForFirestore(v)));
      initialTransactions.forEach(t => batch.set(doc(db, 'transactions', String(t.id)), cleanForFirestore(t)));
      initialSupportTickets.forEach(t => batch.set(doc(db, 'support', String(t.id)), cleanForFirestore(t)));
      initialCampaigns.forEach(c => batch.set(doc(db, 'campaigns', String(c.id)), cleanForFirestore(c)));
      initialAuditLogs.forEach(a => batch.set(doc(db, 'audit', String(a.id)), cleanForFirestore(a)));
      batch.set(doc(db, 'config', 'loyalty'), cleanForFirestore(initialLoyaltyConfig));
      await batch.commit();
      console.log('Seeded Firestore with initial data');
    } else {
      // Ensure official stores have full phones & addresses
      await syncOfficialStoresToFirestore();
    }
  } catch (err: any) {
    console.warn('[Firestore] Seed check skipped or restricted by security rules:', err?.message || err);
  }
}
