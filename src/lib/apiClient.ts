/**
 * Centralized API Client for Watch Club Loyalty
 * Communicates strictly with the trusted Express backend on Cloud Run.
 * Enforces fail-closed security, token authentication, and blocks any fallback to local mocks.
 */

import { auth } from './firebase';

export function getApiBaseUrl(): string {
  const envUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return '';
}

export function isBackendConfigured(): boolean {
  // In development, empty VITE_API_BASE_URL uses Vite proxy / relative routes.
  // In production outside local dev, VITE_API_BASE_URL points to Cloud Run.
  return true;
}

export interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
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

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error('[apiClient] Network request failed:', netErr);
    throw new Error(
      'Koneksi ke backend server gagal atau backend tidak tersedia. Operasi dibatalkan demi keamanan data.'
    );
  }

  // Detect HTML response (e.g. Vercel SPA rewrite fallback returning index.html)
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/html')) {
    throw new Error(
      'Backend API tidak dapat dijangkau (menerima respons HTML). Pastikan VITE_API_BASE_URL mengarah ke Cloud Run API yang aktif.'
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (jsonErr) {
    if (!response.ok) {
      throw new Error(`Server returned error ${response.status}: ${response.statusText}`);
    }
    throw new Error('Respons dari server tidak berformat JSON yang valid.');
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Permintaan gagal dengan status ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}
