/**
 * Production Data Repair & Migration Script for Watch Club Loyalty
 * 
 * Safely normalizes member identities, backfills canonical linkedGoogleEmail,
 * standardizes phone numbers to E.164, and repairs historical transactions
 * with membershipId, memberPhoneNormalized, and canonical memberId.
 * 
 * SAFETY RULES:
 * 1. Default mode is DRY RUN (no writes occur unless --apply flag is provided).
 * 2. Absolutely non-destructive: NEVER deletes any document or field.
 * 3. Commits in chunks of max 400 operations (under Firestore's 500-op limit).
 * 4. Prints full audit summary.
 * 
 * Usage:
 *   npx tsx scripts/repair-member-data.ts           # Dry run simulation
 *   npx tsx scripts/repair-member-data.ts --apply   # Apply changes
 */

import fs from 'fs';
import path from 'path';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCvjoZ65IQDF1j8Dz6W9XLcM-at5ixc39k",
  authDomain: "watch-club-membership.firebaseapp.com",
  projectId: "watch-club-membership",
  storageBucket: "watch-club-membership.firebasestorage.app",
  messagingSenderId: "713398971541",
  appId: "1:713398971541:web:89abf18794ddbe4a9bff9c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function normalizePhone(raw: string | undefined | null): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return '+62' + digits;
}

function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

async function runRepair() {
  const isApply = process.argv.includes('--apply') || process.env.DRY_RUN === 'false';
  const isDryRun = !isApply;

  console.log('='.repeat(70));
  console.log(`WATCH CLUB LOYALTY - DATA REPAIR & AUDIT`);
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (Simulasi, data tidak disentuh)' : '⚡ LIVE APPLY (Menerapkan perubahan)'}`);
  console.log('='.repeat(70));

  let firestoreMembers: Array<{ id: string; data: Record<string, any> }> = [];
  let firestoreTransactions: Array<{ id: string; data: Record<string, any> }> = [];
  let isFirestoreAccessible = false;

  try {
    const mSnap = await getDocs(collection(db, 'members'));
    firestoreMembers = mSnap.docs.map(d => ({ id: d.id, data: d.data() }));
    const tSnap = await getDocs(collection(db, 'transactions'));
    firestoreTransactions = tSnap.docs.map(d => ({ id: d.id, data: d.data() }));
    isFirestoreAccessible = true;
  } catch {
    console.log('ℹ️ Firestore direct unauthenticated read restricted. Checking server data store...');
  }

  // Also read server persistence store (data/members.json)
  const localMembersPath = path.join(process.cwd(), 'data', 'members.json');
  let localMembers: any[] = [];
  if (fs.existsSync(localMembersPath)) {
    try {
      const raw = fs.readFileSync(localMembersPath, 'utf-8');
      localMembers = JSON.parse(raw);
    } catch {}
  }

  // Combine datasets for comprehensive audit
  const membersToAudit = isFirestoreAccessible && firestoreMembers.length > 0 
    ? firestoreMembers 
    : localMembers.map(m => ({ id: m.id || m.membershipId, data: m }));

  console.log(`\n[1/3] Memeriksa data Member (Total Dokumen: ${membersToAudit.length})...`);

  const memberUpdates: Array<{ id: string; patch: Record<string, any>; reason: string; source: 'firestore' | 'file' }> = [];
  const memberByPhone = new Map<string, { id: string; membershipId: string; phone: string; name: string }>();
  const memberById = new Map<string, { id: string; membershipId: string; phone: string; name: string }>();

  let membersSkipped = 0;

  for (const item of membersToAudit) {
    const data = item.data;
    const docId = item.id;
    const patch: Record<string, any> = {};
    const reasons: string[] = [];

    const normPhone = normalizePhone(data.phone || data.phoneNumber);
    const membershipId = data.membershipId || docId;

    if (normPhone) {
      memberByPhone.set(normPhone, {
        id: docId,
        membershipId,
        phone: normPhone,
        name: data.name || ''
      });
    }
    memberById.set(docId, {
      id: docId,
      membershipId,
      phone: normPhone,
      name: data.name || ''
    });

    // A. Backfill linkedGoogleEmail from recoveryEmail or email
    if (!data.linkedGoogleEmail) {
      if (isValidEmail(data.recoveryEmail)) {
        patch.linkedGoogleEmail = data.recoveryEmail.trim();
        reasons.push(`Backfill linkedGoogleEmail dari recoveryEmail (${data.recoveryEmail})`);
      } else if (data.googleUid && isValidEmail(data.email)) {
        patch.linkedGoogleEmail = data.email.trim();
        reasons.push(`Backfill linkedGoogleEmail dari email terhubung googleUid (${data.email})`);
      }
    }

    // B. Normalisasi phone
    if (data.phone && normPhone && data.phone !== normPhone) {
      patch.phone = normPhone;
      reasons.push(`Normalisasi phone: ${data.phone} -> ${normPhone}`);
    }

    // C. Pastikan membershipId terisi
    if (!data.membershipId) {
      patch.membershipId = docId;
      reasons.push(`Isi membershipId default: ${docId}`);
    }

    if (Object.keys(patch).length > 0) {
      memberUpdates.push({
        id: docId,
        patch,
        reason: reasons.join('; '),
        source: isFirestoreAccessible ? 'firestore' : 'file'
      });
    } else {
      membersSkipped++;
    }
  }

  console.log(`- Member valid / siap (skip): ${membersSkipped}`);
  console.log(`- Member membutuhkan perbaikan: ${memberUpdates.length}`);

  // 2. Fetch and check transactions
  console.log(`\n[2/3] Memeriksa data Transaksi (Total Dokumen: ${firestoreTransactions.length})...`);
  const trxUpdates: Array<{ id: string; patch: Record<string, any>; reason: string }> = [];
  let trxSkipped = 0;

  for (const item of firestoreTransactions) {
    const data = item.data;
    const docId = item.id;
    const patch: Record<string, any> = {};
    const reasons: string[] = [];

    const rawPhone = data.memberPhone || data.customerPhone || '';
    const normPhone = normalizePhone(rawPhone);

    // Find matching canonical member
    let canonical = data.memberId ? memberById.get(data.memberId) : undefined;
    if (!canonical && normPhone) {
      canonical = memberByPhone.get(normPhone);
      if (canonical) {
        patch.memberId = canonical.id;
        reasons.push(`Pasangkan memberId yang kosong/salah ke ${canonical.id} (${canonical.name})`);
      }
    }

    // Standardize memberPhoneNormalized
    if (!data.memberPhoneNormalized && normPhone) {
      patch.memberPhoneNormalized = normPhone;
      reasons.push(`Set memberPhoneNormalized = ${normPhone}`);
    } else if (data.memberPhoneNormalized && normPhone && data.memberPhoneNormalized !== normPhone) {
      patch.memberPhoneNormalized = normPhone;
      reasons.push(`Koreksi memberPhoneNormalized: ${data.memberPhoneNormalized} -> ${normPhone}`);
    }

    // Standardize membershipId
    const targetMembershipId = canonical?.membershipId || data.membershipId;
    if (!data.membershipId && targetMembershipId) {
      patch.membershipId = targetMembershipId;
      reasons.push(`Set membershipId = ${targetMembershipId}`);
    }

    if (Object.keys(patch).length > 0) {
      trxUpdates.push({
        id: docId,
        patch,
        reason: reasons.join('; ')
      });
    } else {
      trxSkipped++;
    }
  }

  console.log(`- Transaksi valid / terindeks baik (skip): ${trxSkipped}`);
  console.log(`- Transaksi membutuhkan perbaikan: ${trxUpdates.length}`);

  // 3. Execution / Dry Run Summary
  console.log('\n[3/3] Detail Rencana Perbaikan:');

  if (memberUpdates.length > 0) {
    console.log(`\nSample Member Updates:`);
    memberUpdates.slice(0, 5).forEach((u, i) => {
      console.log(`  ${i + 1}. Member ${u.id}: ${u.reason}`);
    });
  }

  if (trxUpdates.length > 0) {
    console.log(`\nSample Transaction Updates:`);
    trxUpdates.slice(0, 5).forEach((u, i) => {
      console.log(`  ${i + 1}. TRX ${u.id}: ${u.reason}`);
    });
  }

  if (isDryRun) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ DRY RUN SELESAI. Tidak ada data yang diubah.');
    console.log(`Total perbaikan teridentifikasi: ${memberUpdates.length} member, ${trxUpdates.length} transaksi.`);
    console.log('Jalankan dengan flag "--apply" untuk mengeksekusi perbaikan.');
    console.log('Contoh: npx tsx scripts/repair-member-data.ts --apply');
    console.log('='.repeat(70));
    process.exit(0);
  }

  // Live Apply
  console.log('\n⚡ Menerapkan pembaruan data...');

  if (isFirestoreAccessible) {
    const allUpdates = [
      ...memberUpdates.filter(u => u.source === 'firestore').map(u => ({ collection: 'members', id: u.id, patch: u.patch })),
      ...trxUpdates.map(u => ({ collection: 'transactions', id: u.id, patch: u.patch }))
    ];

    const CHUNK_SIZE = 400;
    let committedCount = 0;

    for (let i = 0; i < allUpdates.length; i += CHUNK_SIZE) {
      const chunk = allUpdates.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      for (const item of chunk) {
        const ref = doc(db, item.collection, item.id);
        batch.update(ref, {
          ...item.patch,
          repairedAt: new Date().toISOString()
        });
      }

      await batch.commit();
      committedCount += chunk.length;
      console.log(`  -> Berhasil commit ${committedCount}/${allUpdates.length} pembaruan ke Firestore...`);
    }
  }

  // Update local file store if applicable
  if (localMembers.length > 0) {
    let fileUpdated = false;
    const nextMembers = localMembers.map(m => {
      const update = memberUpdates.find(u => u.id === m.id || u.id === m.membershipId);
      if (update) {
        fileUpdated = true;
        return { ...m, ...update.patch };
      }
      return m;
    });

    if (fileUpdated) {
      fs.writeFileSync(localMembersPath, JSON.stringify(nextMembers, null, 2), 'utf-8');
      console.log(`  -> Berhasil memperbarui file lokal: ${localMembersPath}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`🎉 SUKSES! Perbaikan data selesai diaplikasikan.`);
  console.log(`- Member diperbaiki: ${memberUpdates.length}`);
  console.log(`- Transaksi diperbaiki: ${trxUpdates.length}`);
  console.log('='.repeat(70));
  process.exit(0);
}

runRepair().catch((err) => {
  console.error('\n❌ Terjadi kesalahan saat menjalankan skrip perbaikan:', err);
  process.exit(1);
});
