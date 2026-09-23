/**
 * Production Data Repair & Audit Script for Watch Club Loyalty
 * 
 * Built strictly using Firebase Admin SDK.
 * 
 * SAFETY PRINCIPLES:
 * 1. Default mode is DRY RUN (no writes occur unless --apply flag is explicitly provided).
 * 2. Does NOT read or write local files.
 * 3. Never deletes any documents or data.
 * 4. Duplicate phone numbers / identities are detected, SKIPPED, and reported (NO last-wins).
 * 5. Commits in chunks under Firestore's 500-op limit (400 per batch).
 * 
 * Usage:
 *   npx tsx scripts/repair-member-data.ts           # Dry run simulation (Safe)
 *   npx tsx scripts/repair-member-data.ts --apply   # Apply repairs
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'watch-club-membership',
    });
  }
}

const db = getFirestore();

export function normalizePhone(raw: string | undefined | null): string {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return '+62' + digits;
}

export function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export interface RepairAuditReport {
  isDryRun: boolean;
  totalMembers: number;
  duplicatePhonesCount: number;
  skippedDuplicateMembers: string[];
  membersToRepairCount: number;
  transactionsToRepairCount: number;
}

export async function runRepair(): Promise<RepairAuditReport> {
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply;

  console.log('='.repeat(75));
  console.log(`WATCH CLUB LOYALTY - PRODUCTION DATA REPAIR & AUDIT`);
  console.log(`SDK: Firebase Admin SDK (Server Authoritative)`);
  console.log(`Mode: ${isDryRun ? '🔍 DRY RUN (Simulasi, data Firestore tidak disentuh)' : '⚡ LIVE APPLY (Menerapkan perbaikan ke Firestore)'}`);
  console.log('='.repeat(75));

  // 1. Load Members
  console.log('\n[1/3] Mengambil data Member dari Firestore...');
  const membersSnap = await db.collection('members').get();
  const allMembers = membersSnap.docs.map(d => ({ id: d.id, data: d.data() }));
  console.log(`Total dokumen member ditemukan: ${allMembers.length}`);

  // 2. Identify Duplicate Phones (NO LAST-WINS: MUST SKIP AND REPORT)
  const phoneToMemberDocs = new Map<string, string[]>();
  for (const m of allMembers) {
    const norm = normalizePhone(m.data.phone || m.data.phoneNumber);
    if (norm) {
      const list = phoneToMemberDocs.get(norm) || [];
      list.push(m.id);
      phoneToMemberDocs.set(norm, list);
    }
  }

  const duplicatePhones = new Set<string>();
  const duplicateMemberDocIds = new Set<string>();
  for (const [phone, docIds] of phoneToMemberDocs.entries()) {
    if (docIds.length > 1) {
      duplicatePhones.add(phone);
      docIds.forEach(id => duplicateMemberDocIds.add(id));
      console.warn(`⚠️ KONFLIK DUPLIKAT TERDETEKSI: Nomor ${phone} digunakan oleh ${docIds.length} dokumen: [${docIds.join(', ')}]. DITANGGUHKAN (SKIP) demi keamanan.`);
    }
  }

  const memberUpdates: Array<{ id: string; patch: Record<string, any>; reason: string }> = [];
  const uniqueMemberByPhone = new Map<string, { id: string; membershipId: string; name: string }>();
  const memberById = new Map<string, { id: string; membershipId: string; name: string }>();

  let membersSkippedValid = 0;

  for (const item of allMembers) {
    const docId = item.id;
    const data = item.data;

    // Skip if part of duplicate conflict
    if (duplicateMemberDocIds.has(docId)) {
      continue;
    }

    const normPhone = normalizePhone(data.phone || data.phoneNumber);
    const membershipId = data.membershipId || docId;

    if (normPhone) {
      uniqueMemberByPhone.set(normPhone, {
        id: docId,
        membershipId,
        name: data.name || ''
      });
    }

    memberById.set(docId, {
      id: docId,
      membershipId,
      name: data.name || ''
    });

    const patch: Record<string, any> = {};
    const reasons: string[] = [];

    // A. Backfill linkedGoogleEmail from recoveryEmail or email
    if (!data.linkedGoogleEmail) {
      if (isValidEmail(data.recoveryEmail)) {
        patch.linkedGoogleEmail = data.recoveryEmail.trim();
        reasons.push(`Backfill linkedGoogleEmail dari recoveryEmail (${data.recoveryEmail})`);
      } else if (data.googleUid && isValidEmail(data.email)) {
        patch.linkedGoogleEmail = data.email.trim();
        reasons.push(`Backfill linkedGoogleEmail dari email Google (${data.email})`);
      }
    }

    // B. Standardize phone to E.164
    if (data.phone && normPhone && data.phone !== normPhone) {
      patch.phone = normPhone;
      reasons.push(`Standarisasi phone ke E.164: ${data.phone} -> ${normPhone}`);
    }

    // C. Standardize membershipId
    if (!data.membershipId) {
      patch.membershipId = docId;
      reasons.push(`Isi membershipId default: ${docId}`);
    }

    if (Object.keys(patch).length > 0) {
      memberUpdates.push({ id: docId, patch, reason: reasons.join('; ') });
    } else {
      membersSkippedValid++;
    }
  }

  console.log(`- Member valid / tidak memerlukan perubahan: ${membersSkippedValid}`);
  console.log(`- Member konflik duplikat (ditangguhkan / tidak diubah): ${duplicateMemberDocIds.size}`);
  console.log(`- Member yang memerlukan perbaikan format: ${memberUpdates.length}`);

  // 3. Load Transactions
  console.log('\n[2/3] Mengambil data Transaksi dari Firestore...');
  const trxSnap = await db.collection('transactions').get();
  const allTrx = trxSnap.docs.map(d => ({ id: d.id, data: d.data() }));
  console.log(`Total dokumen transaksi ditemukan: ${allTrx.length}`);

  const trxUpdates: Array<{ id: string; patch: Record<string, any>; reason: string }> = [];
  let trxSkippedValid = 0;

  for (const item of allTrx) {
    const docId = item.id;
    const data = item.data;
    const patch: Record<string, any> = {};
    const reasons: string[] = [];

    const rawPhone = data.memberPhone || data.customerPhone || '';
    const normPhone = normalizePhone(rawPhone);

    // Link canonical memberId if missing or mismatched, provided phone is unique
    let canonical = data.memberId ? memberById.get(data.memberId) : undefined;
    if (!canonical && normPhone && uniqueMemberByPhone.has(normPhone)) {
      canonical = uniqueMemberByPhone.get(normPhone);
      if (canonical) {
        patch.memberId = canonical.id;
        reasons.push(`Tautkan memberId ke canonical ${canonical.id} (${canonical.name})`);
      }
    }

    // Normalize memberPhoneNormalized
    if (normPhone && data.memberPhoneNormalized !== normPhone) {
      patch.memberPhoneNormalized = normPhone;
      reasons.push(`Standarisasi memberPhoneNormalized -> ${normPhone}`);
    }

    // Standardize membershipId
    const targetMembershipId = canonical?.membershipId || data.membershipId;
    if (!data.membershipId && targetMembershipId) {
      patch.membershipId = targetMembershipId;
      reasons.push(`Set membershipId -> ${targetMembershipId}`);
    }

    if (Object.keys(patch).length > 0) {
      trxUpdates.push({ id: docId, patch, reason: reasons.join('; ') });
    } else {
      trxSkippedValid++;
    }
  }

  console.log(`- Transaksi valid (tidak memerlukan perbaikan): ${trxSkippedValid}`);
  console.log(`- Transaksi yang memerlukan perbaikan tautan/format: ${trxUpdates.length}`);

  // 4. Audit Summary & Execution
  console.log('\n[3/3] Rangkuman Audit & Rencana Aksi:');
  if (memberUpdates.length > 0) {
    console.log('\nContoh perbaikan member:');
    memberUpdates.slice(0, 5).forEach((u, i) => console.log(`  ${i + 1}. [Member ${u.id}] ${u.reason}`));
  }

  if (trxUpdates.length > 0) {
    console.log('\nContoh perbaikan transaksi:');
    trxUpdates.slice(0, 5).forEach((u, i) => console.log(`  ${i + 1}. [TRX ${u.id}] ${u.reason}`));
  }

  if (isDryRun) {
    console.log('\n' + '='.repeat(75));
    console.log('✅ DRY RUN SELESAI. Tidak ada data yang disentuh atau diubah di Firestore.');
    console.log(`Rencana perbaikan: ${memberUpdates.length} member, ${trxUpdates.length} transaksi.`);
    console.log(`Total konflik duplikat diabaikan dengan aman: ${duplicateMemberDocIds.size} member.`);
    console.log('Untuk menerapkan perbaikan ke Firestore, jalankan dengan: --apply');
    console.log('='.repeat(75));
    return {
      isDryRun: true,
      totalMembers: allMembers.length,
      duplicatePhonesCount: duplicatePhones.size,
      skippedDuplicateMembers: Array.from(duplicateMemberDocIds),
      membersToRepairCount: memberUpdates.length,
      transactionsToRepairCount: trxUpdates.length
    };
  }

  // Live Apply in Batches of 400
  console.log('\n⚡ Menerapkan pembaruan atomik ke Firestore...');
  const allOps: Array<{ collection: string; id: string; patch: Record<string, any> }> = [
    ...memberUpdates.map(u => ({ collection: 'members', id: u.id, patch: u.patch })),
    ...trxUpdates.map(u => ({ collection: 'transactions', id: u.id, patch: u.patch }))
  ];

  const BATCH_SIZE = 400;
  let committed = 0;
  for (let i = 0; i < allOps.length; i += BATCH_SIZE) {
    const chunk = allOps.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    const nowIso = new Date().toISOString();

    for (const op of chunk) {
      const docRef = db.collection(op.collection).doc(op.id);
      batch.update(docRef, {
        ...op.patch,
        repairedAt: nowIso
      });
    }

    await batch.commit();
    committed += chunk.length;
    console.log(`  -> Berhasil menerapkan ${committed}/${allOps.length} perubahan...`);
  }

  console.log('\n' + '='.repeat(75));
  console.log(`🎉 LIVE APPLY SELESAI! Seluruh ${committed} pembaruan berhasil diterapkan.`);
  console.log('='.repeat(75));

  return {
    isDryRun: false,
    totalMembers: allMembers.length,
    duplicatePhonesCount: duplicatePhones.size,
    skippedDuplicateMembers: Array.from(duplicateMemberDocIds),
    membersToRepairCount: memberUpdates.length,
    transactionsToRepairCount: trxUpdates.length
  };
}

// Auto-run if executed directly via CLI
if (process.argv[1] && process.argv[1].includes('repair-member-data')) {
  runRepair().catch(err => {
    console.error('❌ Terjadi kesalahan fatal:', err);
    process.exit(1);
  });
}
