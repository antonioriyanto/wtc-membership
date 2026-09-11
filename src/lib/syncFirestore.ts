import { collection, onSnapshot, doc, setDoc, getDoc, getDocs, writeBatch, query, where } from "firebase/firestore";
import { db } from "./firebase";
import { initialStores, initialMembers, initialVouchers, initialTransactions, initialSupportTickets, initialCampaigns, initialAuditLogs, initialLoyaltyConfig } from "../data/mockData";

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
      const q = query(collection(db, 'members'), where('phone', '==', cand));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() };
      }
    }

    // 2. Comprehensive fallback scan over members collection to ensure no phone format escapes
    const allSnap = await getDocs(collection(db, 'members'));
    for (const d of allSnap.docs) {
      const data = d.data();
      if (data.phone && isSamePhoneNumber(data.phone, normalized)) {
        return { id: d.id, ...data };
      }
    }
  } catch (err) {
    console.error("Error querying member by phone in Firestore:", err);
  }

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
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) {
        set(data);
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(data));
          } catch {}
        }
      }
    }, (error) => {
      console.error(`Error fetching ${name}:`, error);
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
  });
  unsubscribes.push(unsubConfig);

  // Sync any offline/locally stored members to Firestore so they are never lost
  setTimeout(async () => {
    try {
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
  }, 2000);

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

export async function seedFirestoreIfEmpty() {
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
  }
}
