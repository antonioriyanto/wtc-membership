import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Member } from "../types";
import { cleanForFirestore, safeSetDoc, normalizePhoneNumber, isSamePhoneNumber } from "./syncFirestore";

export interface SyncReport {
  timestamp: string;
  localCount: number;
  firestoreCount: number;
  discrepanciesCount: number;
  resolvedCount: number;
  actions: string[];
}

export interface SyncWorkerOptions {
  getMembers?: () => Member[];
  setMembers?: (members: Member[]) => void;
  intervalMs?: number;
  immediate?: boolean;
  onSyncComplete?: (report: SyncReport) => void;
}

let syncIntervalTimer: any = null;
let isSyncInProgress = false;
let lastSyncReport: SyncReport | null = null;

/**
 * Compares the local members state with Firestore documents,
 * identifies inconsistencies (missing records, point discrepancies,
 * unlinked Google UIDs, or duplicate phone identities), and resolves them.
 */
export async function runMemberSyncPass(
  localMembers: Member[],
  setMembersCallback?: (members: Member[]) => void
): Promise<SyncReport> {
  const timestamp = new Date().toISOString();
  const actions: string[] = [];
  let discrepanciesCount = 0;
  let resolvedCount = 0;

  try {
    // 1. Fetch latest snapshot of all members from Firestore
    const firestoreSnap = await getDocs(collection(db, "members"));
    const firestoreMembers: Member[] = [];
    firestoreSnap.forEach((d) => {
      firestoreMembers.push({ id: d.id, ...(d.data() as any) });
    });

    // Working copy of local members
    let workingLocal = [...localMembers];
    const loggedInMemberId = typeof window !== 'undefined' ? localStorage.getItem('wtc_logged_in_member') : null;
    let updatedLoggedInId = loggedInMemberId;

    // 2. CHECK: Detect dual-identity duplicates in Firestore (e.g. same phone registered twice)
    const phoneGroups: { [phoneKey: string]: Member[] } = {};
    for (const fm of firestoreMembers) {
      const normPhone = normalizePhoneNumber(fm.phone || '');
      if (normPhone && normPhone.length >= 8) {
        if (!phoneGroups[normPhone]) {
          phoneGroups[normPhone] = [];
        }
        phoneGroups[normPhone].push(fm);
      }
    }

    // Resolve duplicate phone entries by merging into the most complete (POS or high-points) record
    for (const [normPhone, duplicates] of Object.entries(phoneGroups)) {
      if (duplicates.length > 1) {
        discrepanciesCount++;
        // Choose primary member (prefer member with highest points, non-empty membershipId, or POS id)
        const primary = [...duplicates].sort((a, b) => {
          const pointsA = Number(a.points || 0);
          const pointsB = Number(b.points || 0);
          if (pointsB !== pointsA) return pointsB - pointsA;
          const isPosA = a.id.startsWith('mem_') ? 1 : 0;
          const isPosB = b.id.startsWith('mem_') ? 1 : 0;
          return isPosB - isPosA;
        })[0];

        const secondaries = duplicates.filter((m) => m.id !== primary.id);
        let mergedPoints = Number(primary.points || 0);
        let mergedLifetime = Number(primary.lifetimePoints || primary.points || 0);
        let mergedSpend = Number(primary.totalSpend || (primary as any).totalSpent || 0);
        let googleUid = (primary as any).googleUid;
        let email = primary.email || '';

        for (const sec of secondaries) {
          mergedPoints = Math.max(mergedPoints, Number(sec.points || 0));
          mergedLifetime = Math.max(mergedLifetime, Number(sec.lifetimePoints || sec.points || 0));
          mergedSpend = Math.max(mergedSpend, Number(sec.totalSpend || (sec as any).totalSpent || 0));
          if (!googleUid && (sec as any).googleUid) {
            googleUid = (sec as any).googleUid;
          }
          if (!email && sec.email) {
            email = sec.email;
          }

          // If the customer was currently logged in with this secondary duplicate ID, migrate them to primary
          if (loggedInMemberId === sec.id) {
            updatedLoggedInId = primary.id;
          }

          // Clean up secondary duplicate document in Firestore
          try {
            await deleteDoc(doc(db, "members", sec.id));
            actions.push(`Removed duplicate Firestore doc ${sec.id} for phone ${normPhone}`);
          } catch (e) {
            console.warn(`Could not delete duplicate member ${sec.id}:`, e);
          }
        }

        // Update primary document in Firestore with consolidated details
        const consolidatedData: any = cleanForFirestore({
          ...primary,
          phone: normPhone,
          points: mergedPoints,
          lifetimePoints: mergedLifetime,
          totalSpend: mergedSpend,
          googleUid: googleUid || undefined,
          email: email,
          updatedAt: timestamp,
        });

        await safeSetDoc("members", primary.id, consolidatedData);
        resolvedCount++;
        actions.push(`Consolidated dual-identity for phone ${normPhone} into primary ${primary.id} (${mergedPoints} pts)`);

        // Update primary in firestore array
        const primaryIdx = firestoreMembers.findIndex((m) => m.id === primary.id);
        if (primaryIdx !== -1) {
          firestoreMembers[primaryIdx] = { ...primary, ...consolidatedData };
        }
        // Remove secondary from firestore array
        for (const sec of secondaries) {
          const sIdx = firestoreMembers.findIndex((m) => m.id === sec.id);
          if (sIdx !== -1) {
            firestoreMembers.splice(sIdx, 1);
          }
        }
      }
    }

    // 3. CHECK: Member exists in local state but is missing in Firestore
    for (const localMem of workingLocal) {
      const existsInFirestore = firestoreMembers.some(
        (fm) => fm.id === localMem.id || isSamePhoneNumber(fm.phone || '', localMem.phone || '')
      );
      if (!existsInFirestore) {
        discrepanciesCount++;
        // Upload missing local member to Firestore
        await safeSetDoc("members", localMem.id, localMem);
        firestoreMembers.push(localMem);
        resolvedCount++;
        actions.push(`Synced local member ${localMem.name} (${localMem.id}) to Firestore`);
      }
    }

    // 4. CHECK: Member exists in Firestore but missing or outdated in local state
    const reconciledLocalMap = new Map<string, Member>();
    for (const localMem of workingLocal) {
      reconciledLocalMap.set(localMem.id, localMem);
    }

    for (const fsMem of firestoreMembers) {
      let localMatch = reconciledLocalMap.get(fsMem.id);

      // Also try matching by phone number if ID differs
      if (!localMatch) {
        for (const [, lm] of reconciledLocalMap.entries()) {
          if (isSamePhoneNumber(lm.phone || '', fsMem.phone || '')) {
            localMatch = lm;
            break;
          }
        }
      }

      if (!localMatch) {
        // Missing in local state: add it
        discrepanciesCount++;
        reconciledLocalMap.set(fsMem.id, fsMem);
        resolvedCount++;
        actions.push(`Added Firestore member ${fsMem.name} (${fsMem.id}) to local state`);
      } else {
        // Check for attribute discrepancies (points, spend, tier, googleUid, store)
        const fsPoints = Number(fsMem.points || 0);
        const localPoints = Number(localMatch.points || 0);
        const fsSpend = Number(fsMem.totalSpend || (fsMem as any).totalSpent || 0);
        const localSpend = Number(localMatch.totalSpend || (localMatch as any).totalSpent || 0);
        const fsTier = fsMem.tier;
        const localTier = localMatch.tier;
        const fsGoogleUid = (fsMem as any).googleUid;
        const localGoogleUid = (localMatch as any).googleUid;

        const hasPointsDiff = fsPoints !== localPoints;
        const hasSpendDiff = fsSpend !== localSpend;
        const hasTierDiff = fsTier && localTier && fsTier !== localTier;
        const hasGoogleDiff = fsGoogleUid && !localGoogleUid;

        if (hasPointsDiff || hasSpendDiff || hasTierDiff || hasGoogleDiff) {
          discrepanciesCount++;
          // Firestore is authoritative for cashier transactions and web app synchronization
          const authoritativePoints = Math.max(fsPoints, localPoints);
          const authoritativeSpend = Math.max(fsSpend, localSpend);
          const authoritativeTier = fsTier || localTier;

          const updatedLocal: Member = {
            ...localMatch,
            ...fsMem,
            points: authoritativePoints,
            lifetimePoints: Math.max(Number(fsMem.lifetimePoints || 0), Number(localMatch.lifetimePoints || 0), authoritativePoints),
            totalSpend: authoritativeSpend,
            tier: authoritativeTier,
            googleUid: fsGoogleUid || localGoogleUid,
          } as any;

          reconciledLocalMap.set(localMatch.id, updatedLocal);

          // If local was higher than Firestore (e.g. offline POS transaction), push back to Firestore
          if (localPoints > fsPoints || localSpend > fsSpend) {
            await safeSetDoc("members", updatedLocal.id, updatedLocal);
            actions.push(`Pushed higher offline points/spend for ${updatedLocal.name} (${updatedLocal.id}) to Firestore`);
          }

          resolvedCount++;
          actions.push(
            `Synchronized member ${updatedLocal.name} (${updatedLocal.id}): points ${localPoints} -> ${authoritativePoints}, spend ${localSpend} -> ${authoritativeSpend}`
          );
        }
      }
    }

    // 5. Finalize reconciled list
    const finalMembersList = Array.from(reconciledLocalMap.values());

    // Update localStorage for instant offline durability
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem("wtc_members", JSON.stringify(finalMembersList));
        if (updatedLoggedInId && updatedLoggedInId !== loggedInMemberId) {
          localStorage.setItem("wtc_logged_in_member", updatedLoggedInId);
          actions.push(`Redirected customer session to canonical member ${updatedLoggedInId}`);
        }
      } catch (err) {
        console.warn("Could not write reconciled members to localStorage:", err);
      }
    }

    // Trigger state update callback if provided and changes occurred
    if (setMembersCallback && (discrepanciesCount > 0 || finalMembersList.length !== localMembers.length)) {
      setMembersCallback(finalMembersList);
    }

    // Dispatch global custom event for any listening UI components (Customer or Cashier)
    if (typeof window !== 'undefined' && discrepanciesCount > 0) {
      try {
        window.dispatchEvent(
          new CustomEvent("watchclub:sync-discrepancy-resolved", {
            detail: {
              timestamp,
              discrepanciesCount,
              resolvedCount,
              actions,
              members: finalMembersList,
            },
          })
        );
      } catch {}
    }

    const report: SyncReport = {
      timestamp,
      localCount: localMembers.length,
      firestoreCount: firestoreMembers.length,
      discrepanciesCount,
      resolvedCount,
      actions,
    };

    lastSyncReport = report;
    return report;
  } catch (err: any) {
    console.error("[SyncWorker] Error during sync pass:", err);
    return {
      timestamp,
      localCount: localMembers.length,
      firestoreCount: 0,
      discrepanciesCount,
      resolvedCount,
      actions: [`Sync error: ${err?.message || 'Unknown error'}`],
    };
  }
}

/**
 * Starts the background sync worker.
 * Runs every 30 seconds (default) to continuously audit and align
 * member state between Cashier POS and Customer Portal.
 */
export function startSyncWorker(options: SyncWorkerOptions = {}): () => void {
  const {
    getMembers = () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem("wtc_members");
          return saved ? JSON.parse(saved) : [];
        } catch {
          return [];
        }
      }
      return [];
    },
    setMembers,
    intervalMs = 30000,
    immediate = true,
    onSyncComplete,
  } = options;

  const executePass = async () => {
    if (isSyncInProgress) return;
    isSyncInProgress = true;
    try {
      const currentLocal = getMembers();
      const report = await runMemberSyncPass(currentLocal, setMembers);
      if (onSyncComplete) {
        onSyncComplete(report);
      }
      if (report.discrepanciesCount > 0) {
        console.info(`[SyncWorker] Automatically resolved ${report.resolvedCount} discrepancies:`, report.actions);
      }
    } catch (err) {
      console.warn("[SyncWorker] Periodic pass failed:", err);
    } finally {
      isSyncInProgress = false;
    }
  };

  // Stop any previous running timer
  if (syncIntervalTimer) {
    clearInterval(syncIntervalTimer);
    syncIntervalTimer = null;
  }

  // Run immediately on start if requested
  if (immediate) {
    setTimeout(executePass, 1000);
  }

  // Schedule background recurring job every 30 seconds
  syncIntervalTimer = setInterval(executePass, intervalMs);

  return () => {
    stopSyncWorker();
  };
}

/**
 * Stops the background sync worker.
 */
export function stopSyncWorker() {
  if (syncIntervalTimer) {
    clearInterval(syncIntervalTimer);
    syncIntervalTimer = null;
  }
  isSyncInProgress = false;
}

/**
 * Returns the status of the sync worker.
 */
export function getSyncWorkerStatus() {
  return {
    isRunning: syncIntervalTimer !== null,
    isSyncInProgress,
    lastSyncReport,
  };
}
