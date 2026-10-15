import { describe, it, expect, beforeAll } from 'vitest';
import handler from '../../api/index.ts';

describe('Vercel Serverless & Express API Regression Tests (Isolated)', () => {
  // Helper to dispatch mock requests through the Vercel handler
  async function dispatchVercelRequest(options: {
    method: string;
    url?: string;
    matchedPath?: string;
    body?: any;
    headers?: Record<string, string>;
  }): Promise<{ status: number; body: any; headers: Record<string, string> }> {
    return new Promise(async (resolve, reject) => {
      let statusCode = 200;
      let responseBody: any = null;
      const responseHeaders: Record<string, string> = {};

      const mockReq: any = {
        method: options.method,
        url: options.url || '/api', // Vercel rewrite destination
        headers: {
          'content-type': 'application/json',
          ...(options.matchedPath ? { 'x-matched-path': options.matchedPath } : {}),
          ...(options.headers || {})
        },
        body: options.body
      };

      const mockRes: any = {
        headersSent: false,
        statusCode: 200,
        setHeader(k: string, v: string) {
          responseHeaders[k.toLowerCase()] = v;
        },
        header(k: string, v: string) {
          responseHeaders[k.toLowerCase()] = v;
        },
        status(code: number) {
          this.statusCode = code;
          statusCode = code;
          return this;
        },
        json(data: any) {
          this.headersSent = true;
          responseBody = data;
          mockRes.emit('finish');
          return this;
        },
        send(data: any) {
          this.headersSent = true;
          try {
            responseBody = typeof data === 'string' ? JSON.parse(data) : data;
          } catch {
            responseBody = data;
          }
          mockRes.emit('finish');
          return this;
        },
        end(data: any) {
          this.headersSent = true;
          if (data && !responseBody) {
            try {
              responseBody = typeof data === 'string' ? JSON.parse(data) : data;
            } catch {
              responseBody = data;
            }
          }
          mockRes.emit('finish');
        },
        listeners: {} as Record<string, Array<() => void>>,
        on(event: string, fn: () => void) {
          if (!this.listeners[event]) this.listeners[event] = [];
          this.listeners[event].push(fn);
        },
        emit(event: string) {
          this.listeners[event]?.forEach((fn) => fn());
        }
      };

      try {
        await handler(mockReq, mockRes);
        resolve({ status: statusCode, body: responseBody, headers: responseHeaders });
      } catch (err) {
        reject(err);
      }
    });
  }

  it('1. GET /api/health should return 200 OK with timestamp when rewritten to /api', async () => {
    const res = await dispatchVercelRequest({
      method: 'GET',
      matchedPath: '/api/health'
    });
    expect(res.status).toBe(200);
    expect(res.body?.status).toBe('ok');
    expect(res.body?.timestamp).toBeDefined();
  });

  it('2. GET /healthz should return 200 OK when rewritten to /api', async () => {
    const res = await dispatchVercelRequest({
      method: 'GET',
      matchedPath: '/healthz'
    });
    expect(res.status).toBe(200);
    expect(res.body?.status).toBe('ok');
  });

  it('3. GET /api/nonexistent-route should return 404 JSON (not HTML)', async () => {
    const res = await dispatchVercelRequest({
      method: 'GET',
      matchedPath: '/api/nonexistent-route'
    });
    expect(res.status).toBe(404);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error).toContain('tidak ditemukan');
  });

  it('4. POST /v1/auth/member/precheck with invalid request body (missing phone) should return 400', async () => {
    const res = await dispatchVercelRequest({
      method: 'POST',
      matchedPath: '/v1/auth/member/precheck',
      body: {}
    });
    expect(res.status).toBe(400);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error).toContain('Nomor telepon wajib diisi');
  });

  it('5. POST /v1/auth/member/precheck with dummy unregistered phone should return exists: false with status 200', async () => {
    const res = await dispatchVercelRequest({
      method: 'POST',
      matchedPath: '/v1/auth/member/precheck',
      body: { phone: '089999999999' }
    });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.exists).toBe(false);
  });

  it('6. POST /v1/auth/member/precheck with seeded dummy member phone should return exists: true with name', async () => {
    const res = await dispatchVercelRequest({
      method: 'POST',
      matchedPath: '/v1/auth/member/precheck',
      body: { phone: '081903987051' }
    });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.exists).toBe(true);
    expect(res.body?.name).toBe('Aan');
    expect(res.body?.membershipId).toBe('KOKAS0001');
  });

  it('7. POST /api/v1/auth/member/precheck alias should return same response as /v1', async () => {
    const res = await dispatchVercelRequest({
      method: 'POST',
      matchedPath: '/api/v1/auth/member/precheck',
      body: { phone: '081903987051' }
    });
    expect(res.status).toBe(200);
    expect(res.body?.success).toBe(true);
    expect(res.body?.exists).toBe(true);
  });

  it('8. POST /api/auth/employee-login with invalid credentials should return 401', async () => {
    const res = await dispatchVercelRequest({
      method: 'POST',
      matchedPath: '/api/auth/employee-login',
      body: { username: 'INVALID_USER', pin: 'WRONG_PIN', type: 'CASHIER' }
    });
    expect(res.status).toBe(401);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error).toContain('tidak sesuai');
  });

  it('9. POST /api/loyalty/add-points with missing parameters should return 400', async () => {
    const res = await dispatchVercelRequest({
      method: 'POST',
      matchedPath: '/api/loyalty/add-points',
      body: { memberId: 'mem_kokas_0001' } // Missing amount & receiptNo
    });
    expect(res.status).toBe(400);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error).toContain('wajib diisi');
  });

  it('10. POST /api/loyalty/add-points with non-positive amount should return 400', async () => {
    const res = await dispatchVercelRequest({
      method: 'POST',
      matchedPath: '/api/loyalty/add-points',
      body: { memberId: 'mem_kokas_0001', amount: -5000, receiptNo: 'TEST-REC-INVALID-AMT' }
    });
    expect(res.status).toBe(400);
    expect(res.body?.success).toBe(false);
    expect(res.body?.error).toContain('lebih besar dari 0');
  });
});
