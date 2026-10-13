/**
 * Centralized API Client for Watch Club Loyalty
 * Communicates strictly with the trusted Express backend on Cloud Run.
 * Enforces fail-closed security, token authentication, and blocks any fallback to local mocks.
 */

import { auth } from './firebase';

export function getApiBaseUrl(): string {
  const envUrl =
    (typeof process !== 'undefined' && process.env?.VITE_API_BASE_URL) ||
    (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    let clean = envUrl.trim().replace(/\/+$/, '');
    // If user mistakenly configured URL ending with '/api', strip it
    // because API client endpoints already include '/api/...' or '/v1/...'
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4).replace(/\/+$/, '');
    }
    return clean;
  }
  return '';
}

export function isBackendConfigured(): boolean {
  const baseUrl = getApiBaseUrl();
  if (baseUrl) return true;
  // In development, empty VITE_API_BASE_URL uses Vite dev proxy / relative routes.
  // In hosted environments (e.g. Vercel deployment), empty VITE_API_BASE_URL means backend is not connected.
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '0.0.0.0') {
      return false;
    }
  }
  return true;
}

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
  timeoutMs?: number;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  if (!isBackendConfigured()) {
    throw new Error(
      'Server backend belum terhubung: Variabel VITE_API_BASE_URL belum dikonfigurasi di environment Vercel. Pastikan VITE_API_BASE_URL telah diatur pada Vercel Project Settings dan mengarah ke URL backend Cloud Run yang aktif.'
    );
  }

  const baseUrl = getApiBaseUrl();
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const fullUrl = `${baseUrl}${normalizedEndpoint}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Attach Firebase ID Token automatically if available and not skipped
  if (!options.skipAuth && !headers.has('Authorization')) {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const idToken = await currentUser.getIdToken();
        if (idToken) {
          headers.set('Authorization', `Bearer ${idToken}`);
        }
      }
    } catch (err) {
      console.warn('[apiClient] Could not retrieve Firebase ID token:', err);
    }
  }

  // Sinyal Lemah / Ghost Fetching Safeguard: 25-second client-side timeout with AbortController
  const timeoutMs = options.timeoutMs ?? 25000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      signal: options.signal || controller.signal,
      headers,
    });
  } catch (netErr: any) {
    if (netErr?.name === 'AbortError') {
      console.error('[apiClient] Request aborted due to timeout:', fullUrl);
      throw new Error(
        'Koneksi internet lambat / timeout (sinyal lemah). Transaksi belum dapat dipastikan tersimpan. Harap periksa jaringan kasir sebelum mencoba kembali.'
      );
    }
    console.error('[apiClient] Network request failed:', netErr);
    throw new Error(
      'Koneksi ke backend server gagal atau backend tidak tersedia. Operasi dibatalkan demi keamanan data.'
    );
  } finally {
    clearTimeout(timeoutId);
  }

  // Detect HTML response (e.g. Vercel SPA rewrite fallback returning index.html)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(
      'Backend API tidak dapat dijangkau (menerima respons HTML). Pastikan VITE_API_BASE_URL mengarah ke Cloud Run API yang aktif.'
    );
  }

  let data: any = null;
  const rawText = await response.text();
  if (rawText && rawText.trim()) {
    try {
      data = JSON.parse(rawText);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      data?.error ||
      data?.message ||
      (response.status === 404
        ? `Layanan server API '${normalizedEndpoint}' tidak ditemukan (404 Not Found). Pastikan endpoint tersedia dan konfigurasi VITE_API_BASE_URL mengarah ke backend yang tepat.`
        : `Server returned error ${response.status}${response.statusText ? ': ' + response.statusText : ''}`);
    throw new Error(errorMsg);
  }

  if (data === null) {
    throw new Error('Respons dari server tidak berformat JSON yang valid.');
  }

  return data as T;
}
