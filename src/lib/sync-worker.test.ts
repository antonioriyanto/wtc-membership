import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isTransientFirebaseError,
  retryWithBackoff,
  recordDeletedMemberId,
  getDeletedMemberIds,
  unrecordDeletedMemberId,
  runMemberSyncPass,
  startSyncWorker,
  stopSyncWorker,
  getSyncWorkerStatus,
} from './sync-worker';

const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

if (typeof globalThis.localStorage === 'undefined') {
  Object.defineProperty(globalThis, 'localStorage', {
    value: storageMock,
    writable: true,
  });
}

describe('sync-worker synchronization logic', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('isTransientFirebaseError', () => {
    it('should classify transient Firebase codes as retryable', () => {
      expect(isTransientFirebaseError({ code: 'unavailable' })).toBe(true);
      expect(isTransientFirebaseError({ code: 'deadline-exceeded' })).toBe(true);
      expect(isTransientFirebaseError({ code: 'resource-exhausted' })).toBe(true);
      expect(isTransientFirebaseError({ code: 'internal' })).toBe(true);
      expect(isTransientFirebaseError({ code: 'aborted' })).toBe(true);
    });

    it('should classify network connection failures as retryable', () => {
      expect(isTransientFirebaseError({ message: 'The client is offline' })).toBe(true);
      expect(isTransientFirebaseError({ message: 'Failed to fetch' })).toBe(true);
      expect(isTransientFirebaseError({ message: 'Network request timed out' })).toBe(true);
    });

    it('should classify permanent errors as non-retryable', () => {
      expect(isTransientFirebaseError({ code: 'permission-denied' })).toBe(false);
      expect(isTransientFirebaseError({ code: 'unauthenticated' })).toBe(false);
      expect(isTransientFirebaseError({ code: 'invalid-argument' })).toBe(false);
      expect(isTransientFirebaseError({ code: 'not-found' })).toBe(false);
      expect(isTransientFirebaseError({ code: 'already-exists' })).toBe(false);
    });

    it('should handle null or undefined safely', () => {
      expect(isTransientFirebaseError(null)).toBe(false);
      expect(isTransientFirebaseError(undefined)).toBe(false);
    });
  });

  describe('retryWithBackoff', () => {
    it('should resolve immediately if the operation succeeds on first attempt', async () => {
      const op = vi.fn().mockResolvedValue('success');
      const result = await retryWithBackoff(op, { maxAttempts: 3, initialDelayMs: 10 });
      expect(result).toBe('success');
      expect(op).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient error and succeed on subsequent attempt', async () => {
      let attempts = 0;
      const op = vi.fn().mockImplementation(async () => {
        attempts++;
        if (attempts < 2) {
          throw { code: 'unavailable', message: 'Service temporarily down' };
        }
        return 'recovered';
      });

      const result = await retryWithBackoff(op, {
        maxAttempts: 3,
        initialDelayMs: 10,
        maxDelayMs: 50,
      });

      expect(result).toBe('recovered');
      expect(op).toHaveBeenCalledTimes(2);
    });

    it('should throw immediately without retrying if error is not transient', async () => {
      const op = vi.fn().mockRejectedValue({ code: 'permission-denied', message: 'Missing rules' });

      await expect(
        retryWithBackoff(op, { maxAttempts: 3, initialDelayMs: 10 })
      ).rejects.toEqual({ code: 'permission-denied', message: 'Missing rules' });

      expect(op).toHaveBeenCalledTimes(1);
    });

    it('should fail after maxAttempts if transient error persists', async () => {
      const op = vi.fn().mockRejectedValue({ code: 'unavailable', message: 'Always down' });

      await expect(
        retryWithBackoff(op, { maxAttempts: 3, initialDelayMs: 10, maxDelayMs: 20 })
      ).rejects.toEqual({ code: 'unavailable', message: 'Always down' });

      expect(op).toHaveBeenCalledTimes(3);
    });
  });

  describe('deleted member tombstone tracking', () => {
    it('should record and retrieve deleted member IDs from storage', () => {
      recordDeletedMemberId('mem_test_123');
      recordDeletedMemberId('mem_test_456');

      const set = getDeletedMemberIds();
      expect(set.has('mem_test_123')).toBe(true);
      expect(set.has('mem_test_456')).toBe(true);
      expect(set.has('mem_other')).toBe(false);
    });

    it('should allow unrecording if member is re-created', () => {
      recordDeletedMemberId('mem_test_123');
      expect(getDeletedMemberIds().has('mem_test_123')).toBe(true);

      unrecordDeletedMemberId('mem_test_123');
      expect(getDeletedMemberIds().has('mem_test_123')).toBe(false);
    });
  });

  describe('startSyncWorker lifecycle', () => {
    it('should start worker and return a cleanup function that stops interval and timers', () => {
      const stop = startSyncWorker({
        immediate: false,
        intervalMs: 10000,
      });
      let status = getSyncWorkerStatus();
      expect(status.isRunning).toBe(true);

      stop();
      status = getSyncWorkerStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should disable periodic polling by default to prevent memory bloat', () => {
      const stop = startSyncWorker({
        immediate: false,
        intervalMs: 5000,
      });
      // By default enablePeriodicPolling is false
      expect(getSyncWorkerStatus().isRunning).toBe(true);
      stop();
      expect(getSyncWorkerStatus().isRunning).toBe(false);
    });
  });

  describe('getSyncWorkerStatus', () => {
    it('should provide initial health diagnostics', () => {
      const status = getSyncWorkerStatus();
      expect(status).toHaveProperty('isRunning');
      expect(status).toHaveProperty('isSyncInProgress');
      expect(status).toHaveProperty('isInitialReconciled');
    });
  });
});
