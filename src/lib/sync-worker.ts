import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { Member, MemberTier } from "../types";
import { cleanForFirestore, safeSetDoc, normalizePhoneNumber, isSamePhoneNumber } from "./syncFirestore";
import { calculateTier } from "./loyalty";

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
  onInitialReconciled?: (report: SyncReport) => void;
  maxInitialRetries?: number;
  initialRetryDelayMs?: number;
}

const DELETED_MEMBERS_STORAGE_KEY = 'wtc_deleted_member_ids';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
  return null;
}

/**
 * Returns set of member IDs that were explicitly deleted.
 * Used to avoid resurrecting deleted members from client-side caches.
 */
export function getDeletedMemberIds(): Set<string> {
  const storage = getStorage();
  if (!storage) return new Set();
  try {
    const raw = storage.getItem(DELETED_MEMBERS_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

/**
 * Records a deleted member ID into tombstone storage.
 */
export function recordDeletedMemberId(memberId: string): void {
  const storage = getStorage();
  if (!storage || !memberId) return;
  try {
    const current = getDeletedMemberIds();
    current.add(memberId);
    // Keep max 500 records to prevent unbounded growth
    const arr = Array.from(current).slice(-500);
    storage.setItem(DELETED_MEMBERS_STORAGE_KEY, JSON.stringify(arr));
  } catch (err) {
    console.warn('[SyncWorker] Could not record deleted member ID:', err);
  }
}

/**
 * Clears a member ID from tombstone storage (e.g. if re-registered).
 */
export function unrecordDeletedMemberId(memberId: string): void {
  const storage = getStorage();
  if (!storage || !memberId) return;
  try {
    const current = getDeletedMemberIds();
    current.delete(memberId);
    storage.setItem(DELETED_MEMBERS_STORAGE_KEY, JSON.stringify(Array.from(current)));
  } catch {}
}

/**
 * Identifies whether an error from Firebase is transient and safe to retry.
 */
export function isTransientFirebaseError(error: any): boolean {
  if (!error) return false;
  const code = (error.code || '').toLowerCase();
  const message = (error.message || '').toLowerCase();

  // Permanent failure codes: do not retry
  if (
    code === 'permission-denied' ||
    code === 'unauthenticated' ||
    code === 'invalid-argument' ||
    code === 'not-found' ||
    code === 'already-exists'
  ) {
    return false;
  }

  // Known transient Firebase codes
  if (
    code === 'unavailable' ||
    code === 'deadline-exceeded' ||
    code === 'resource-exhausted' ||
    code === 'internal' ||
    code === 'cancelled' ||
    code === 'aborted'
  ) {
    return true;
  }

  // Network and connectivity patterns
  if (
    message.includes('client is offline') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('backend') ||
    message.includes('unavailable')
  ) {
    return true;
  }

  return false;
}

/**
 * Retries an asynchronous operation using exponential backoff with jitter.
 */
export async function retryWithBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    isRetryable?: (err: any) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 350,
    maxDelayMs = 2500,
    backoffFactor = 2,
    isRetryable = isTransientFirebaseError,
  } = options;

  let attempt = 1;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation(attempt);
    } catch (err: any) {
      if (attempt >= maxAttempts || !isRetryable(err)) {
        throw err;
      }
      const jitter = delay * 0.25 * (Math.random() * 2 - 1);
      const actualDelay = Math.min(maxDelayMs, Math.max(100, delay + jitter));
      
      console.warn(
        `[SyncWorker] Transient Firebase failure on attempt ${attempt}/${maxAttempts}: ${err?.message || err}. Retrying in ${Math.round(actualDelay)}ms...`
      );
      
      await new Promise((resolve) => setTimeout(resolve, actualDelay));
      delay = Math.min(maxDelayMs, delay * backoffFactor);
      attempt++;
    }
  }
}

// Module-level single-flight / mutex lock to prevent concurrent overlapping executions
let activeSyncPromise: Promise<SyncReport> | null = null;
let hasQueuedPass = false;

let syncIntervalTimer: any = null;
let fastRetryTimer: any = null;
let isInitialReconciled = false;
let lastSyncReport: SyncReport | null = null;
let lastSyncTimestamp = 0;
let lastSyncError: string | null = null;
let consecutiveFailures = 0;

/**
 * Internal execution of member sync pass.
 */
async function executeMemberSyncPassInternal(
  localMembers: Member[],
  setMembersCallback?: (members: Member[]) => void,
  getMembersLatest?: () => Member[]
): Promise<SyncReport> {
  const timestamp = new Date().toISOString();
  const actions: string[] = [];
  let discrepanciesCount = 0;
  let resolvedCount = 0;

  try {
    const deletedIds = getDeletedMemberIds();

    // Query backend for centrally deleted IDs
    try {
      const delRes = await fetch('/api/members/deleted-ids');
      if (delRes.ok) {
        const delJson = await delRes.json();
        if (Array.isArray(delJson.deletedIds)) {
          delJson.deletedIds.forEach((id: string) => {
            deletedIds.add(id);
            recordDeletedMemberId(id);
          });
        }
      }
    } catch {}

    // Working copy of local members
    let workingLocal = [...localMembers];
    const storage = getStorage();
    const loggedInMemberId = storage ? storage.getItem('wtc_logged_in_member') : null;
    let updatedLoggedInId = loggedInMemberId;

    // 1. Fetch latest snapshot of all members from Firestore with transient retry
    let firestoreMembers: Member[] = [];
    const firestoreSnap = await retryWithBackoff(
      async () => {
        return await getDocs(collection(db, "members"));
      },
      {
        maxAttempts: 3,
        initialDelayMs: 350,
        maxDelayMs: 2500,
        backoffFactor: 2,
      }
    );

    firestoreSnap.forEach((d) => {
      if (deletedIds.has(d.id)) return;
      const data = d.data() as any;
      let tier = data.tier;
      if (tier === 'DIAMOND' || tier === 'BLACK') tier = 'PLATINUM';
      firestoreMembers.push({ id: d.id, ...data, tier });
    });

    // Handle race condition with initial seeding:
    // If Firestore returned 0 members but we have local members, wait briefly and re-check once
    if (firestoreMembers.length === 0 && localMembers.length > 0) {
      await new Promise((r) => setTimeout(r, 400));
      try {
        const secondSnap = await getDocs(collection(db, "members"));
        if (!secondSnap.empty) {
          secondSnap.forEach((d) => {
            if (deletedIds.has(d.id)) return;
            const data = d.data() as any;
            let tier = data.tier;
            if (tier === 'DIAMOND' || tier === 'BLACK') tier = 'PLATINUM';
            firestoreMembers.push({ id: d.id, ...data, tier });
          });
          actions.push("Detected members populated during concurrent initialization");
        }
      } catch {}
    }

    firestoreMembers = firestoreMembers.filter(fm => !deletedIds.has(fm.id));

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

    // Resolve duplicate phone entries by merging into primary (highest points or cashier terminal ID)
    for (const [normPhone, duplicates] of Object.entries(phoneGroups)) {
      if (duplicates.length > 1) {
        discrepanciesCount++;
        const primary = [...duplicates].sort((a, b) => {
          const pointsA = Number(a.points || 0);
          const pointsB = Number(b.points || 0);
          if (pointsB !== pointsA) return pointsB - pointsA;
          const isCashierA = a.id.startsWith('mem_') ? 1 : 0;
          const isCashierB = b.id.startsWith('mem_') ? 1 : 0;
          return isCashierB - isCashierA;
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

          if (loggedInMemberId === sec.id) {
            updatedLoggedInId = primary.id;
          }

          // Clean up secondary duplicate document in Firestore with transient retry
          try {
            await retryWithBackoff(() => deleteDoc(doc(db, "members", sec.id)), { maxAttempts: 2, initialDelayMs: 250 });
            actions.push(`Removed duplicate Firestore doc ${sec.id} for phone ${normPhone}`);
          } catch (e) {
            console.warn(`Could not delete duplicate member ${sec.id}:`, e);
          }
        }

        const calculatedTier = calculateTier(mergedPoints);
        let consolidatedTier: MemberTier = primary.tier || calculatedTier;
        if ((consolidatedTier as any) === 'DIAMOND' || (consolidatedTier as any) === 'BLACK') {
          consolidatedTier = 'PLATINUM';
        }
        const consolidatedData: any = cleanForFirestore({
          ...primary,
          phone: normPhone,
          points: mergedPoints,
          lifetimePoints: mergedLifetime,
          totalSpend: mergedSpend,
          tier: consolidatedTier,
          googleUid: googleUid || undefined,
          email: email,
          updatedAt: timestamp,
        });

        try {
          await retryWithBackoff(() => safeSetDoc("members", primary.id, consolidatedData), { maxAttempts: 2, initialDelayMs: 250 });
          resolvedCount++;
          actions.push(`Consolidated dual-identity for phone ${normPhone} into primary ${primary.id} (${mergedPoints} pts)`);
        } catch (e) {
          console.warn(`Could not update consolidated primary ${primary.id}:`, e);
        }

        // Update in-memory firestore array
        const primaryIdx = firestoreMembers.findIndex((m) => m.id === primary.id);
        if (primaryIdx !== -1) {
          firestoreMembers[primaryIdx] = { ...primary, ...consolidatedData };
        }
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
      if (!localMem || !localMem.id) continue;

      // Skip members that were explicitly deleted by admin to avoid zombie resurrection
      if (deletedIds.has(localMem.id)) {
        actions.push(`Skipped resurrecting explicitly deleted member ${localMem.name || localMem.id}`);
        continue;
      }

      const existsInFirestore = firestoreMembers.some(
        (fm) => fm.id === localMem.id || isSamePhoneNumber(fm.phone || '', localMem.phone || '')
      );
      if (!existsInFirestore) {
        if ((localMem as any).isPendingSync) {
          discrepanciesCount++;
          try {
            await retryWithBackoff(() => safeSetDoc("members", localMem.id, localMem), { maxAttempts: 2, initialDelayMs: 250 });
            firestoreMembers.push(localMem);
            resolvedCount++;
            actions.push(`Synced new offline member ${localMem.name} (${localMem.id}) to Firestore`);
          } catch (err: any) {
            console.warn(`[SyncWorker] Could not sync local member ${localMem.id} to Firestore:`, err);
          }
        } else if (firestoreMembers.length > 0) {
          // If Firestore is populated and member is missing, it was deleted in HO database!
          // Mark as deleted so it is completely purged from local state and cannot be resurrected
          deletedIds.add(localMem.id);
          recordDeletedMemberId(localMem.id);
          actions.push(`Pruned unverified local member ${localMem.name || localMem.id} from local cache`);
        }
      }
    }

    // 4. CHECK: Member exists in Firestore but missing or outdated in local state
    const reconciledLocalMap = new Map<string, Member>();
    // When Firestore has authoritative data, we only keep members that exist in Firestore or are pending sync
    if (firestoreMembers.length > 0) {
      for (const localMem of workingLocal) {
        if (localMem && localMem.id && (localMem as any).isPendingSync && !deletedIds.has(localMem.id)) {
          reconciledLocalMap.set(localMem.id, localMem);
        }
      }
    } else {
      for (const localMem of workingLocal) {
        if (localMem && localMem.id && !deletedIds.has(localMem.id)) {
          reconciledLocalMap.set(localMem.id, localMem);
        }
      }
    }

    for (const fsMem of firestoreMembers) {
      let localMatch = reconciledLocalMap.get(fsMem.id);

      // Match by phone number if document ID differs
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

        const authoritativePoints = Math.max(fsPoints, localPoints);
        const authoritativeSpend = Math.max(fsSpend, localSpend);
        const calculatedTier = calculateTier(authoritativePoints);
        let authoritativeTier: MemberTier = fsTier || calculatedTier || localTier;
        if ((authoritativeTier as any) === 'DIAMOND' || (authoritativeTier as any) === 'BLACK') {
          authoritativeTier = 'PLATINUM';
        }

        const updatedLocal: Member = {
          ...localMatch,
          ...fsMem,
          id: fsMem.id, // Strictly canonicalize to Firestore doc ID
          points: authoritativePoints,
          lifetimePoints: Math.max(Number(fsMem.lifetimePoints || 0), Number(localMatch.lifetimePoints || 0), authoritativePoints),
          totalSpend: authoritativeSpend,
          tier: authoritativeTier,
          googleUid: fsGoogleUid || localGoogleUid,
        } as any;

        // Clean up stale local ID from map if canonical Firestore doc ID differs
        if (localMatch.id !== fsMem.id) {
          reconciledLocalMap.delete(localMatch.id);
          if (loggedInMemberId === localMatch.id) {
            updatedLoggedInId = fsMem.id;
          }
          discrepanciesCount++;
          resolvedCount++;
          actions.push(`Canonicalized local ID ${localMatch.id} -> ${fsMem.id} for ${updatedLocal.name}`);
        }

        reconciledLocalMap.set(fsMem.id, updatedLocal);

        if (hasPointsDiff || hasSpendDiff || hasTierDiff || hasGoogleDiff) {
          discrepanciesCount++;
          // If local has higher points/spend (e.g. offline Cashier transaction), push back to Firestore with retry
          if (localPoints > fsPoints || localSpend > fsSpend) {
            try {
              await retryWithBackoff(() => safeSetDoc("members", updatedLocal.id, updatedLocal), { maxAttempts: 2, initialDelayMs: 250 });
              actions.push(`Pushed higher offline points/spend for ${updatedLocal.name} (${updatedLocal.id}) to Firestore`);
            } catch (e) {
              console.warn(`Could not sync updated points back to Firestore for ${updatedLocal.id}:`, e);
            }
          }

          resolvedCount++;
          actions.push(
            `Synchronized member ${updatedLocal.name} (${updatedLocal.id}): points ${localPoints} -> ${authoritativePoints}, spend ${localSpend} -> ${authoritativeSpend}`
          );
        }
      }
    }

    // 5. Finalize reconciled list and protect against in-flight state mutations
    let finalMembersList = Array.from(reconciledLocalMap.values());

    if (getMembersLatest) {
      try {
        const freshestLocal = getMembersLatest();
        if (Array.isArray(freshestLocal) && freshestLocal.length > 0) {
          const finalMap = new Map(finalMembersList.map((m) => [m.id, m]));
          for (const freshMem of freshestLocal) {
            if (!freshMem || !freshMem.id || deletedIds.has(freshMem.id)) continue;
            const existing = finalMap.get(freshMem.id);
            if (!existing) {
              finalMap.set(freshMem.id, freshMem);
            } else {
              // Preserve any points/spend added concurrently during this async pass
              if (Number(freshMem.points || 0) > Number(existing.points || 0)) {
                existing.points = freshMem.points;
              }
              if (Number(freshMem.totalSpend || 0) > Number(existing.totalSpend || 0)) {
                existing.totalSpend = freshMem.totalSpend;
              }
            }
          }
          finalMembersList = Array.from(finalMap.values());
        }
      } catch {}
    }

    // Persist to localStorage for instant offline durability
    if (storage) {
      try {
        storage.setItem("wtc_members", JSON.stringify(finalMembersList));
        if (updatedLoggedInId && updatedLoggedInId !== loggedInMemberId) {
          storage.setItem("wtc_logged_in_member", updatedLoggedInId);
          actions.push(`Redirected customer session to canonical member ${updatedLoggedInId}`);
        }
      } catch (err) {
        console.warn("Could not write reconciled members to localStorage:", err);
      }
    }

    // Validate customer session against authoritative database:
    // If logged-in member was deleted from database, purge session immediately
    if (loggedInMemberId) {
      const activeId = updatedLoggedInId || loggedInMemberId;
      const sessionStillValid = finalMembersList.some(m => m.id === activeId);
      if (!sessionStillValid && firestoreMembers.length > 0) {
        console.warn(`[SyncWorker] Customer session ${activeId} was deleted from database. Purging session.`);
        if (storage) {
          storage.removeItem('wtc_logged_in_member');
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('wtc_auth_session_invalidated'));
        }
      }
    }

    // Trigger state update callback
    if (setMembersCallback && (discrepanciesCount > 0 || finalMembersList.length !== localMembers.length || !isInitialReconciled)) {
      setMembersCallback(finalMembersList);
    }

    // Dispatch global custom event for reactive UI components
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
    if (err?.code === 'permission-denied') {
      console.warn("[SyncWorker] Firestore read restricted by current security rules. Operating in local mode.");
    } else {
      console.error("[SyncWorker] Error during sync pass:", err);
    }

    const failureReport: SyncReport = {
      timestamp,
      localCount: localMembers.length,
      firestoreCount: 0,
      discrepanciesCount,
      resolvedCount,
      actions: [`Sync notice: ${err?.message || 'Permission restricted or connection error'}`],
    };
    lastSyncReport = failureReport;
    throw err;
  }
}

/**
 * Compares the local members state with Firestore documents,
 * identifies inconsistencies (missing records, point discrepancies,
 * unlinked Google UIDs, or duplicate phone identities), and resolves them.
 * Protected by a single-flight mutex to avoid concurrent race conditions.
 */
export async function runMemberSyncPass(
  localMembers: Member[],
  setMembersCallback?: (members: Member[]) => void,
  getMembersLatest?: () => Member[]
): Promise<SyncReport> {
  // If an active pass is already running, await it rather than launching a conflicting parallel query
  if (activeSyncPromise) {
    hasQueuedPass = true;
    console.info("[SyncWorker] A sync pass is already active. Awaiting current pass completion.");
    return activeSyncPromise;
  }

  activeSyncPromise = (async () => {
    try {
      const report = await executeMemberSyncPassInternal(localMembers, setMembersCallback, getMembersLatest);
      return report;
    } finally {
      activeSyncPromise = null;
      if (hasQueuedPass) {
        hasQueuedPass = false;
        // Run coalesced pass with latest state
        setTimeout(() => {
          const fresh = getMembersLatest ? getMembersLatest() : localMembers;
          runMemberSyncPass(fresh, setMembersCallback, getMembersLatest).catch(() => {});
        }, 150);
      }
    }
  })();

  return activeSyncPromise;
}

/**
 * Starts the background sync worker with transient error fast-retries on initial mount.
 */
export function startSyncWorker(options: SyncWorkerOptions = {}): () => void {
  const {
    getMembers = () => {
      const storage = getStorage();
      if (storage) {
        try {
          const saved = storage.getItem("wtc_members");
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
    onInitialReconciled,
    maxInitialRetries = 3,
    initialRetryDelayMs = 2000,
  } = options;

  let initialRetryCount = 0;
  let onlineListener: (() => void) | null = null;
  let visibilityListener: (() => void) | null = null;

  const executePass = async (isInitial = false) => {
    try {
      const currentLocal = getMembers();
      const report = await runMemberSyncPass(currentLocal, setMembers, getMembers);

      lastSyncTimestamp = Date.now();
      lastSyncError = null;
      consecutiveFailures = 0;

      if (!isInitialReconciled) {
        isInitialReconciled = true;
        if (onInitialReconciled) {
          onInitialReconciled(report);
        }
      }

      if (onSyncComplete) {
        onSyncComplete(report);
      }

      if (report.discrepanciesCount > 0) {
        console.info(`[SyncWorker] Reconciled ${report.resolvedCount} discrepancies:`, report.actions);
      }
    } catch (err: any) {
      lastSyncError = err?.message || String(err);
      consecutiveFailures++;

      // If initial mount pass failed with a transient error, schedule a fast retry
      // rather than leaving the app unreconciled for 30 seconds
      if (!isInitialReconciled && initialRetryCount < maxInitialRetries && isTransientFirebaseError(err)) {
        initialRetryCount++;
        const nextDelay = initialRetryDelayMs * initialRetryCount;
        console.warn(`[SyncWorker] Initial mount sync encountered transient error. Scheduling fast retry ${initialRetryCount}/${maxInitialRetries} in ${nextDelay}ms...`);
        if (fastRetryTimer) clearTimeout(fastRetryTimer);
        fastRetryTimer = setTimeout(() => executePass(true), nextDelay);
      } else {
        console.warn("[SyncWorker] Periodic sync pass completed with notice:", err?.message || err);
      }
    }
  };

  // Stop any previous running timer or listeners
  stopSyncWorker();

  // Setup online network recovery listener
  if (typeof window !== 'undefined') {
    onlineListener = () => {
      console.info("[SyncWorker] Browser is online. Triggering synchronization pass.");
      executePass(false);
    };
    window.addEventListener('online', onlineListener);

    visibilityListener = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastSyncTimestamp;
        if (elapsed > 15000) {
          executePass(false);
        }
      }
    };
    document.addEventListener('visibilitychange', visibilityListener);
  }

  // Run immediate pass on mount
  if (immediate) {
    fastRetryTimer = setTimeout(() => executePass(true), 250);
  }

  // Recurring background interval
  syncIntervalTimer = setInterval(() => executePass(false), intervalMs);

  return () => {
    if (fastRetryTimer) {
      clearTimeout(fastRetryTimer);
      fastRetryTimer = null;
    }
    if (onlineListener && typeof window !== 'undefined') {
      window.removeEventListener('online', onlineListener);
    }
    if (visibilityListener && typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', visibilityListener);
    }
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
  if (fastRetryTimer) {
    clearTimeout(fastRetryTimer);
    fastRetryTimer = null;
  }
}

/**
 * Manually triggers an immediate synchronization pass using the mutex.
 */
export async function triggerImmediateSync(
  getMembers?: () => Member[],
  setMembers?: (members: Member[]) => void
): Promise<SyncReport> {
  const storage = getStorage();
  const members = getMembers ? getMembers() : (storage ? JSON.parse(storage.getItem('wtc_members') || '[]') : []);
  return await runMemberSyncPass(members, setMembers, getMembers);
}

/**
 * Returns the current health and status of the sync worker.
 */
export function getSyncWorkerStatus() {
  return {
    isRunning: syncIntervalTimer !== null,
    isSyncInProgress: activeSyncPromise !== null,
    isInitialReconciled,
    lastSyncReport,
    lastSyncTimestamp,
    lastSyncError,
    consecutiveFailures,
  };
}

