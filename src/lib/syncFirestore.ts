import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs, writeBatch, query, where } from "firebase/firestore";
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

  // Match against official initialStores (all 42 Watch Club branches)
  const officialMatch = initialStores.find(is => 
    (rawStore.id && is.id === rawStore.id) || 
    (rawCode && (is.code || is.id || '').toUpperCase() === rawCode) ||
    (rawName && is.name.trim().toLowerCase() === rawName)
  );

  const fallback = officialMatch || {
    id: rawStore.id || 'store_' + Date.now(),
    code: rawStore.code || 'WTC-CUSTOM',
    name: rawStore.name || 'Cabang Baru',
    mallName: rawStore.mallName || rawStore.name || 'Pusat Belanja',
    city: rawStore.city || 'Jakarta',
    region: rawStore.region || 'Jabodetabek',
    floorUnit: rawStore.floorUnit || '-',
    address: rawStore.address || '',
    fullAddress: rawStore.fullAddress || rawStore.address || '',
    phone: rawStore.phone || '',
    whatsapp: rawStore.whatsapp || rawStore.phone || '',
    waNumber: '',
    email: rawStore.email || 'contact@watchclub.co.id',
    imageUrl: rawStore.imageUrl || 'https://images.unsplash.com/photo-1547996160-71dfa63582b8?auto=format&fit=crop&q=80&w=800',
    latitude: undefined,
    longitude: undefined,
    location: '',
    type: 'STORE',
    isActive: true
  };

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
    if (!img || typeof img !== 'string') return false;
    const trimmed = img.trim();
    return (
      trimmed.startsWith('http://') || 
      trimmed.startsWith('https://') || 
      trimmed.startsWith('/uploads/') || 
      trimmed.startsWith('./uploads/') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('blob:')
    ) && trimmed.length >= 5;
  };

  // ENRICHMENT PRINCIPLE: User/database inputs take absolute priority.
  // Enrichment ONLY fills in undefined, null, or empty fields.
  const name = rawStore.name && rawStore.name.trim().length > 0 ? rawStore.name.trim() : fallback.name;
  const mallName = rawStore.mallName && rawStore.mallName.trim().length > 0 ? rawStore.mallName.trim() : (fallback.mallName || name);
  const city = rawStore.city && rawStore.city.trim().length > 0 ? rawStore.city.trim() : fallback.city;
  const region = rawStore.region && rawStore.region.trim().length > 0 ? rawStore.region.trim() : fallback.region;
  const code = rawStore.code && rawStore.code.trim().length > 0 ? rawStore.code.trim() : fallback.code;

  const phone = isValidPhone(rawStore.phone) 
    ? rawStore.phone.trim() 
    : (isValidPhone(rawStore.whatsapp) ? rawStore.whatsapp.trim() : fallback.phone);

  const whatsapp = isValidPhone(rawStore.whatsapp) 
    ? rawStore.whatsapp.trim() 
    : (isValidPhone(rawStore.phone) ? rawStore.phone.trim() : fallback.whatsapp || fallback.phone);

  const rawDigits = (whatsapp || phone || fallback.phone || '').replace(/[^0-9]/g, '');
  const waNumber = rawStore.waNumber || (rawDigits.startsWith('0') ? '62' + rawDigits.slice(1) : (rawDigits.startsWith('62') ? rawDigits : '62' + rawDigits));

  const floorUnit = (rawStore.floorUnit && rawStore.floorUnit.trim() !== '-' && rawStore.floorUnit.trim().length > 0) 
    ? rawStore.floorUnit.trim() 
    : fallback.floorUnit;

  const address = rawStore.address && rawStore.address.trim().length > 0 
    ? rawStore.address.trim() 
    : fallback.address;

  const fullAddress = rawStore.fullAddress && rawStore.fullAddress.trim().length > 0 
    ? rawStore.fullAddress.trim() 
    : (fallback.fullAddress || `${mallName} ${floorUnit} ${address}`.trim());

  const candidateImg = rawStore.imageUrl || (rawStore as any).image;
  const imageUrl = isValidImage(candidateImg) 
    ? candidateImg.trim() 
    : fallback.imageUrl;

  const email = rawStore.email && rawStore.email.trim().length > 0 ? rawStore.email.trim() : fallback.email;

  // Preserve custom GPS coordinates if entered or stored in database
  const latitude = (rawStore.latitude !== undefined && rawStore.latitude !== null && !isNaN(Number(rawStore.latitude)))
    ? Number(rawStore.latitude)
    : (fallback.latitude !== undefined && fallback.latitude !== null && !isNaN(Number(fallback.latitude)) ? Number(fallback.latitude) : undefined);

  const longitude = (rawStore.longitude !== undefined && rawStore.longitude !== null && !isNaN(Number(rawStore.longitude)))
    ? Number(rawStore.longitude)
    : (fallback.longitude !== undefined && fallback.longitude !== null && !isNaN(Number(fallback.longitude)) ? Number(fallback.longitude) : undefined);

  return {
    ...fallback,
    ...rawStore,
    id: rawStore.id || fallback.id,
    code,
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
    type: rawStore.type || fallback.type || 'STORE',
    isActive: rawStore.isActive !== false,
  };
}

/**
 * Synchronizes official Watch Club store branches to Firestore
 * while strictly PRESERVING any custom store branches created by the user/admin.
 */
export async function syncOfficialStoresToFirestore(force = false) {
  try {
    const snap = await getDocs(collection(db, 'stores'));
    const existingDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    let needUpdate = force || snap.empty;

    if (!needUpdate) {
      for (const d of snap.docs) {
        const dat = d.data();
        const official = initialStores.find(s => s.id === d.id || s.code === dat.code);
        if (official && (!dat.imageUrl || !dat.fullAddress)) {
          needUpdate = true;
          break;
        }
      }
    }

    if (needUpdate) {
      console.log('[Firestore] Syncing official 42 Watch Club branches to Firestore while preserving custom branches...');
      const batch = writeBatch(db);

      // 1. Update official 42 stores
      initialStores.forEach(s => {
        let storeToSync = { ...s };
        // Preserve any custom image or edits already made to this official store
        const existingDoc = existingDocs.find(d => d.id === s.id || d.code === s.code);
        if (existingDoc) {
          if (existingDoc.imageUrl && existingDoc.imageUrl !== s.imageUrl) {
            storeToSync.imageUrl = existingDoc.imageUrl;
          }
          if (existingDoc.latitude !== undefined && existingDoc.latitude !== null) {
            storeToSync.latitude = existingDoc.latitude;
          }
          if (existingDoc.longitude !== undefined && existingDoc.longitude !== null) {
            storeToSync.longitude = existingDoc.longitude;
          }
        }
        batch.set(doc(db, 'stores', s.id), cleanForFirestore(cleanAndEnrichStore(storeToSync)), { merge: true });
      });

      // 2. DO NOT delete custom stores! Re-commit existing custom branches to guarantee they remain
      existingDocs.forEach(d => {
        const isOfficial = initialStores.some(s => s.id === d.id || s.code === d.code);
        if (!isOfficial && d.id) {
          batch.set(doc(db, 'stores', d.id), cleanForFirestore(cleanAndEnrichStore(d)), { merge: true });
        }
      });

      await batch.commit();
      console.log('[Firestore] Successfully updated official 42 stores without wiping custom branches.');
    }
  } catch (err: any) {
    console.error('[Firestore] Store sync error:', err?.message || err);
    throw err;
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

  // 0. Primary check: Query persistent Server API (works across ALL devices, incognito, new phones)
  try {
    const res = await fetch(`/api/members/by-phone/${encodeURIComponent(normalized)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.exists && json.member) {
        // Cache to localStorage for instant offline access
        try {
          const saved = localStorage.getItem('wtc_members');
          const parsed = saved ? JSON.parse(saved) : [];
          if (Array.isArray(parsed)) {
            const exists = parsed.some((m: any) => m.id === json.member.id);
            const next = exists ? parsed.map((m: any) => m.id === json.member.id ? json.member : m) : [json.member, ...parsed];
            localStorage.setItem('wtc_members', JSON.stringify(next));
          }
        } catch {}
        return json.member;
      }
    }
  } catch (apiErr) {
    // Gracefully continue to Firestore & fallbacks
  }

  // 0b. Also check all members from Server API if by-phone lookup missed format variations
  try {
    const allRes = await fetch('/api/members');
    if (allRes.ok) {
      const allJson = await allRes.json();
      if (allJson.success && Array.isArray(allJson.members)) {
        const match = allJson.members.find((m: any) => m && m.phone && isSamePhoneNumber(m.phone, normalized));
        if (match) {
          try {
            const saved = localStorage.getItem('wtc_members');
            const parsed = saved ? JSON.parse(saved) : [];
            if (Array.isArray(parsed)) {
              const exists = parsed.some((m: any) => m.id === match.id);
              const next = exists ? parsed.map((m: any) => m.id === match.id ? match : m) : [match, ...parsed];
              localStorage.setItem('wtc_members', JSON.stringify(next));
            }
          } catch {}
          return match;
        }
      }
    }
  } catch {}

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

  // 4. Fallback to initial base members
  try {
    const foundInitial = initialMembers.find((m: any) => m.phone && isSamePhoneNumber(m.phone, normalized));
    if (foundInitial) return foundInitial;
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
    console.warn("Notice querying member by googleUid in Firestore:", err);
  }

  // Fallback to local storage members
  try {
    const saved = localStorage.getItem('wtc_members');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const found = parsed.find((m: any) => m.googleUid === uid || (Array.isArray(m.linkedAuthUids) && m.linkedAuthUids.includes(uid)));
        if (found) return found;
      }
    }
  } catch {}

  return null;
}

export async function safeSetDoc(collectionName: string, docId: string, data: any) {
  const sanitized = cleanForFirestore(data);

  let firestoreFailed = false;
  let firestoreError: any = null;

  // 1. Primary write to Firestore
  try {
    await setDoc(doc(db, collectionName, String(docId)), sanitized, { merge: true });
  } catch (firestoreErr: any) {
    firestoreFailed = true;
    firestoreError = firestoreErr;
    console.warn(`[safeSetDoc] Direct Firestore write failed for ${collectionName}/${docId}:`, firestoreErr?.message);
  }

  // 2. Server API sync for server-backed persistence
  let serverSyncSucceeded = false;
  try {
    if (collectionName === 'members') {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) serverSyncSucceeded = true;
    } else if (collectionName === 'stores') {
      const res = await fetch(`/api/stores/${encodeURIComponent(docId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) serverSyncSucceeded = true;
    } else if (collectionName === 'vouchers') {
      const res = await fetch(`/api/vouchers/${encodeURIComponent(docId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) serverSyncSucceeded = true;
    } else if (collectionName === 'campaigns') {
      const res = await fetch(`/api/campaigns/${encodeURIComponent(docId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      });
      if (res.ok) serverSyncSucceeded = true;
    }
  } catch (serverErr) {
    console.warn('[Server Sync] Notice syncing document to server API:', serverErr);
  }

  // 3. Update local backup cache
  try {
    const storageKey = collectionName === 'stores' ? 'wtc_stores' 
      : collectionName === 'members' ? 'wtc_members' 
      : collectionName === 'vouchers' ? 'wtc_vouchers' 
      : collectionName === 'transactions' ? 'wtc_transactions' 
      : collectionName === 'campaigns' ? 'wtc_campaigns' 
      : collectionName === 'audit' || collectionName === 'audit_logs' ? 'wtc_audit_logs'
      : null;

    if (storageKey) {
      const existing = localStorage.getItem(storageKey);
      let list: any[] = existing ? JSON.parse(existing) : [];
      if (!Array.isArray(list)) list = [];
      const idx = list.findIndex(item => item && (item.id === docId || (sanitized.id && item.id === sanitized.id) || (sanitized.code && item.code === sanitized.code)));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...sanitized };
      } else {
        list = [sanitized, ...list];
      }
      localStorage.setItem(storageKey, JSON.stringify(list));
    }
  } catch (localErr) {
    console.warn("safeSetDoc local sync notice:", localErr);
  }

  // If both Firestore AND server failed, throw so UI can notify user
  if (firestoreFailed && !serverSyncSucceeded && collectionName !== 'stores' && collectionName !== 'vouchers' && collectionName !== 'campaigns') {
    throw firestoreError;
  }

  return sanitized;
}

export async function safeDeleteDoc(collectionName: string, docId: string): Promise<void> {
  let firestoreFailed = false;
  let firestoreError: any = null;

  // 1. Primary delete from Firebase Firestore
  try {
    await deleteDoc(doc(db, collectionName, String(docId)));
  } catch (err: any) {
    firestoreFailed = true;
    firestoreError = err;
    console.warn(`[safeDeleteDoc] Direct Firestore delete failed for ${collectionName}/${docId}:`, err?.message);
  }

  // 2. Server API sync for server-backed persistence
  let serverSyncSucceeded = false;
  try {
    const res = await fetch(`/api/${collectionName}/${encodeURIComponent(docId)}`, {
      method: 'DELETE'
    });
    if (res.ok) serverSyncSucceeded = true;
  } catch (serverErr) {
    console.warn(`[safeDeleteDoc] Server API delete notice for ${collectionName}/${docId}:`, serverErr);
  }

  // 3. Update local backup cache
  try {
    const storageKey = collectionName === 'stores' ? 'wtc_stores' 
      : collectionName === 'members' ? 'wtc_members' 
      : collectionName === 'vouchers' ? 'wtc_vouchers' 
      : collectionName === 'transactions' ? 'wtc_transactions' 
      : collectionName === 'campaigns' ? 'wtc_campaigns' 
      : collectionName === 'audit' || collectionName === 'audit_logs' ? 'wtc_audit_logs'
      : null;

    if (storageKey) {
      const existing = localStorage.getItem(storageKey);
      if (existing) {
        let list = JSON.parse(existing);
        if (Array.isArray(list)) {
          list = list.filter((item: any) => item && item.id !== docId);
          localStorage.setItem(storageKey, JSON.stringify(list));
        }
      }
    }
  } catch (localErr) {
    console.warn("safeDeleteDoc local sync notice:", localErr);
  }

  if (firestoreFailed && !serverSyncSucceeded && collectionName !== 'campaigns') {
    throw firestoreError;
  }
}

export function setupFirestoreListeners(callbacks: any) {
  const unsubscribes: any[] = [];

  // Proactively fetch persistent members from Server API (guarantees availability on new devices and incognito)
  fetch('/api/members')
    .then(r => r.json())
    .then(json => {
      if (json.success && Array.isArray(json.members) && json.members.length > 0) {
        callbacks.setMembers?.(json.members);
        try {
          localStorage.setItem('wtc_members', JSON.stringify(json.members));
        } catch {}

        // Also check if local storage had any extra offline members, and sync them to server
        try {
          const raw = localStorage.getItem('wtc_members');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed) && parsed.length > json.members.length) {
              fetch('/api/members/sync-all', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members: parsed })
              }).catch(() => {});
            }
          }
        } catch {}
      }
    })
    .catch(err => console.warn('[Server Members] Initial fetch notice:', err));

  // Proactively fetch persistent vouchers from Server API
  fetch('/api/vouchers')
    .then(r => r.json())
    .then(json => {
      if (json.success && Array.isArray(json.vouchers) && json.vouchers.length > 0) {
        callbacks.setVouchers?.(json.vouchers);
        try {
          localStorage.setItem('wtc_vouchers', JSON.stringify(json.vouchers));
        } catch {}
      }
    })
    .catch(err => console.warn('[Server Vouchers] Initial fetch notice:', err));

  // Proactively fetch persistent stores from Server API
  fetch('/api/stores')
    .then(r => r.json())
    .then(json => {
      if (json.success && Array.isArray(json.stores) && json.stores.length > 0) {
        const storeMap = new Map();
        initialStores.forEach(s => storeMap.set(s.id, cleanAndEnrichStore(s)));
        json.stores.forEach((s: any) => {
          const enriched = cleanAndEnrichStore(s);
          storeMap.set(enriched.id, enriched);
        });
        const combined = Array.from(storeMap.values()).sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
        callbacks.setStores?.(combined);
        try {
          localStorage.setItem('wtc_stores', JSON.stringify(combined));
        } catch {}
      }
    })
    .catch(err => console.warn('[Server Stores] Initial fetch notice:', err));

  // Proactively fetch persistent campaigns from Server API (guarantees cross-device & cloud persistence)
  fetch('/api/campaigns')
    .then(r => r.json())
    .then(json => {
      if (json.success && Array.isArray(json.campaigns)) {
        callbacks.setCampaigns?.(json.campaigns);
        try {
          localStorage.setItem('wtc_campaigns', JSON.stringify(json.campaigns));
        } catch {}
      }
    })
    .catch(err => console.warn('[Server Campaigns] Initial fetch notice:', err));

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
      } else if (name === 'campaigns' || name === 'support') {
        // When collection is deleted down to 0 in Firestore, accurately reflect empty array to all clients
        set([]);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify([]));
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
      const data = docSnap.data();
      callbacks.setLoyaltyConfig(data);
      try {
        localStorage.setItem('wtc_loyalty_config', JSON.stringify(data));
        window.dispatchEvent(new CustomEvent('wtc_loyalty_config_updated', { detail: data }));
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

  // No auto-sync or auto-seed on mount to protect production Firestore from overwrite
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

export async function seedFirestoreIfEmpty() {
  // Disabled by default to protect production data from accidental overwrite
  return;
}
