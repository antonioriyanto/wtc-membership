import { collection, onSnapshot, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import { initialStores, initialMembers, initialVouchers, initialTransactions, initialSupportTickets, initialCampaigns, initialAuditLogs, initialLoyaltyConfig } from "../data/mockData";

export function setupFirestoreListeners(callbacks: any) {
  const unsubscribes: any[] = [];

  const collections = [
    { name: 'stores', set: callbacks.setStores },
    { name: 'members', set: callbacks.setMembers },
    { name: 'vouchers', set: callbacks.setVouchers },
    { name: 'transactions', set: callbacks.setTransactions },
    { name: 'support', set: callbacks.setSupportTickets },
    { name: 'campaigns', set: callbacks.setCampaigns },
    { name: 'audit', set: callbacks.setAuditLogs },
  ];

  collections.forEach(({ name, set }) => {
    const unsub = onSnapshot(collection(db, name), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (data.length > 0) {
        set(data);
      }
    }, (error) => {
      console.error(`Error fetching ${name}:`, error);
    });
    unsubscribes.push(unsub);
  });

  const unsubConfig = onSnapshot(doc(db, 'config', 'loyalty'), (docSnap) => {
    if (docSnap.exists()) {
      callbacks.setLoyaltyConfig(docSnap.data());
    }
  });
  unsubscribes.push(unsubConfig);

  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

export async function seedFirestoreIfEmpty() {
  const storesSnap = await getDocs(collection(db, 'stores'));
  if (storesSnap.empty) {
    const batch = writeBatch(db);
    initialStores.forEach(s => batch.set(doc(db, 'stores', s.id), s));
    initialMembers.forEach(m => batch.set(doc(db, 'members', String(m.id)), m));
    initialVouchers.forEach(v => batch.set(doc(db, 'vouchers', String(v.id)), v));
    initialTransactions.forEach(t => batch.set(doc(db, 'transactions', String(t.id)), t));
    initialSupportTickets.forEach(t => batch.set(doc(db, 'support', String(t.id)), t));
    initialCampaigns.forEach(c => batch.set(doc(db, 'campaigns', String(c.id)), c));
    initialAuditLogs.forEach(a => batch.set(doc(db, 'audit', String(a.id)), a));
    batch.set(doc(db, 'config', 'loyalty'), initialLoyaltyConfig);
    await batch.commit();
    console.log('Seeded Firestore with initial data');
  }
}
