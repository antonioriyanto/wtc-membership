import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { Server } from 'http';
import { createApp } from '../../server';
import { getApiBaseUrl, isBackendConfigured } from './apiClient';

describe('Watch Club API & Deployment Regression Tests', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    const app = await createApp();
    await new Promise<void>((resolve) => {
      // Listen on ephemeral port (0) for parallel-safe testing
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (address && typeof address === 'object') {
          baseUrl = `http://127.0.0.1:${address.port}`;
        }
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // ==========================================
  // SUITE 1: API Client Base URL & Config
  // ==========================================
  describe('API Client Base URL & Environment Handling', () => {
    it('returns empty string when VITE_API_BASE_URL is not set', () => {
      delete process.env.VITE_API_BASE_URL;
      delete (import.meta as any).env?.VITE_API_BASE_URL;

      expect(getApiBaseUrl()).toBe('');
    });

    it('sanitizes trailing slashes and accidental /api suffix', () => {
      process.env.VITE_API_BASE_URL = 'https://watchclub-api.run.app/';
      expect(getApiBaseUrl()).toBe('https://watchclub-api.run.app');

      process.env.VITE_API_BASE_URL = 'https://watchclub-api.run.app/api';
      expect(getApiBaseUrl()).toBe('https://watchclub-api.run.app');

      process.env.VITE_API_BASE_URL = 'https://watchclub-api.run.app/api/';
      expect(getApiBaseUrl()).toBe('https://watchclub-api.run.app');

      delete process.env.VITE_API_BASE_URL;
    });

    it('isBackendConfigured returns true in test/local dev environment', () => {
      expect(isBackendConfigured()).toBe(true);
    });
  });

  // ==========================================
  // SUITE 2: Cashier /api/loyalty/add-points
  // ==========================================
  describe('Cashier API: /api/loyalty/add-points', () => {
    it('rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: 'mem_kokas_0001',
          amount: 5000000,
          receiptNo: 'INV-TEST-UNAUTH-01'
        })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Autentikasi diperlukan');
    });

    it('rejects request with invalid or malformed bearer token with 401', async () => {
      const res = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer INVALID_MALFORMED_TOKEN'
        },
        body: JSON.stringify({
          memberId: 'mem_kokas_0001',
          amount: 5000000,
          receiptNo: 'INV-TEST-MALFORMED-01'
        })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('rejects non-cashier role (e.g. CUSTOMER) with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TEST_TOKEN_CUSTOMER'
        },
        body: JSON.stringify({
          memberId: 'mem_kokas_0001',
          amount: 5000000,
          receiptNo: 'INV-TEST-CUSTOMER-ROLE-01'
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Akses ditolak');
    });

    it('rejects missing required fields (memberId, amount, receiptNo) with 400', async () => {
      const res = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TEST_TOKEN_CASHIER_PUR'
        },
        body: JSON.stringify({
          memberId: '',
          receiptNo: 'INV-TEST-MISSING'
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('wajib diisi');
    });

    it('rejects zero or negative amount with 400', async () => {
      const res = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TEST_TOKEN_CASHIER_PUR'
        },
        body: JSON.stringify({
          memberId: 'mem_kokas_0001',
          amount: -50000,
          receiptNo: 'INV-TEST-NEG-01'
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('lebih besar dari 0');
    });

    it('rejects nonexistent member ID with 404 Not Found', async () => {
      const res = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TEST_TOKEN_CASHIER_PUR'
        },
        body: JSON.stringify({
          memberId: 'NONEXISTENT_MEMBER_99999999',
          amount: 1500000,
          receiptNo: `INV-NONEXIST-${Date.now()}`
        })
      });

      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('tidak ditemukan');
    });

    it('successfully processes transaction and prevents store impersonation', async () => {
      // First ensure a test member exists via /api/members
      const testMemberPhone = '08129990001';
      const createMemberRes = await fetch(`${baseUrl}/api/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Budi Test Case',
          phone: testMemberPhone,
          tier: 'GOLD',
          registeredStore: 'Mall Puri Indah'
        })
      });
      const memberCreated = await createMemberRes.json();
      const testMemberId = memberCreated.member?.id || 'mem_kokas_0001';

      const uniqueReceipt = `INV-AUTH-TEST-${Date.now()}`;

      // Cashier authenticates as Store PUR, but body attempts storeId="BALI"
      const res = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TEST_TOKEN_CASHIER_PUR'
        },
        body: JSON.stringify({
          memberId: testMemberId,
          amount: 10000000, // Rp 10.000.000
          receiptNo: uniqueReceipt,
          storeId: 'BALI', // Attempted impersonation
          storeName: 'Puri Jakarta',
          cashierName: 'Siti Kasir'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.transactionData.receiptNo).toBe(uniqueReceipt);
      // Enforced storeId from token claims (PUR), preventing store impersonation
      expect(data.data.transactionData.storeId).toBe('PUR');
      // Points calculation: 10.000.000 / 10.000 = 1000 pts * GOLD multiplier (1.25x) = 1250 pts
      expect(data.data.calculatedPoints).toBeGreaterThanOrEqual(1000);

      // RETRY WITH SAME RECEIPT: Must reject duplicate receipt with 400 Bad Request
      const duplicateRes = await fetch(`${baseUrl}/api/loyalty/add-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer TEST_TOKEN_CASHIER_PUR'
        },
        body: JSON.stringify({
          memberId: testMemberId,
          amount: 10000000,
          receiptNo: uniqueReceipt
        })
      });

      expect(duplicateRes.status).toBe(400);
      const dupData = await duplicateRes.json();
      expect(dupData.success).toBe(false);
      expect(dupData.error).toContain('sudah pernah didaftarkan');
    });
  });

  // ==========================================
  // SUITE 3: Member /v1/auth/member/precheck
  // ==========================================
  describe('Member Verification API: /v1/auth/member/precheck', () => {
    it('rejects invalid or too short phone numbers with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/v1/auth/member/precheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '123' })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('minimal 8 digit');
    });

    it('returns exists: false for unknown member without leaking data', async () => {
      const res = await fetch(`${baseUrl}/v1/auth/member/precheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '089999999999' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.exists).toBe(false);
      expect(data.isPinSet).toBe(false);
      expect(data.isLocked).toBe(false);
      // Cryptographic secrets must never be exposed
      expect(data.pinHash).toBeUndefined();
      expect(data.pinSalt).toBeUndefined();
    });

    it('correctly returns exists: true and PIN status for registered member', async () => {
      const knownPhone = '08129990001';
      const res = await fetch(`${baseUrl}/v1/auth/member/precheck`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: knownPhone })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.exists).toBe(true);
      expect(data.membershipId).toBeDefined();
      expect(data.pinHash).toBeUndefined();
      expect(data.pinSalt).toBeUndefined();
    });
  });

  // ==========================================
  // SUITE 4: Unhandled Route Fail-Safe 404
  // ==========================================
  describe('Unhandled Routes 404 Handling', () => {
    it('returns consistent JSON 404 for unhandled /api or /v1 routes', async () => {
      const res = await fetch(`${baseUrl}/api/nonexistent-route-xyz`);
      expect(res.status).toBe(404);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('tidak ditemukan pada server (404 Not Found)');
    });
  });

  // ==========================================
  // SUITE 5: Member Precheck Client Error Propagation
  // ==========================================
  describe('Member Precheck Client Error Handling', () => {
    it('propagates actual server error message without masking as generic network connection failure', async () => {
      process.env.VITE_API_BASE_URL = baseUrl;
      const { precheckCustomer } = await import('./memberAuthClient');

      // Calling with invalid phone format returns descriptive error
      await expect(precheckCustomer('123')).resolves.toEqual({
        exists: false,
        isPinSet: false,
        isLocked: false,
        remainingLockoutSeconds: 0
      });

      // Calling against non-existent route should propagate real error
      const originalFetch = global.fetch;
      try {
        global.fetch = async () => new Response('404 Not Found', { status: 404, statusText: 'Not Found' });
        await expect(precheckCustomer('081234567890')).rejects.toThrow(/404 Not Found/);
      } finally {
        global.fetch = originalFetch;
        delete process.env.VITE_API_BASE_URL;
      }
    });
  });
});
