import type { IncomingMessage, ServerResponse } from 'http';
import { createApp } from '../server.ts';

let cachedApp: any = null;

/**
 * Vercel Serverless Function entry point for Watch Club Loyalty API.
 * Handles all /api/*, /v1/*, and /healthz requests directly on Vercel
 * when VITE_API_BASE_URL is not set or points to the Vercel origin.
 */
export default async function handler(req: any, res: any): Promise<void> {
  if (!cachedApp) {
    cachedApp = await createApp();
  }

  // Restore rewritten path from Vercel proxy headers
  const matchedPath =
    (req.headers?.['x-matched-path'] as string) ||
    (req.headers?.['x-forwarded-uri'] as string) ||
    (req.headers?.['x-now-route-matches'] ? decodeURIComponent(req.headers['x-now-route-matches'] as string) : '');

  if (matchedPath && matchedPath !== '/api' && matchedPath !== '/' && matchedPath !== '/api/') {
    const currentUrl = req.url || '';
    const queryPart = currentUrl.includes('?') ? currentUrl.slice(currentUrl.indexOf('?')) : '';
    req.url = matchedPath.includes('?') ? matchedPath : matchedPath + queryPart;
  }

  // Ensure req.socket exists for Express middleware compatibility
  if (!req.socket) {
    req.socket = { remoteAddress: '127.0.0.1' };
  }

  // Ensure Vercel Serverless Function lifecycle waits for Express response to finish
  return new Promise<void>((resolve, reject) => {
    res.on('finish', () => resolve());
    res.on('close', () => resolve());
    res.on('error', (err: any) => {
      console.error('[Vercel Serverless] Response stream error:', err);
      reject(err);
    });

    try {
      cachedApp(req, res, (err: any) => {
        if (err) {
          console.error('[Vercel Serverless] Express unhandled error:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: err?.message || 'Internal Server Error' }));
          }
          resolve();
        } else {
          if (!res.headersSent) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, error: `Layanan API '${req.url}' tidak ditemukan pada server (404 Not Found).` }));
          }
          resolve();
        }
      });
    } catch (syncErr: any) {
      console.error('[Vercel Serverless] Express invocation error:', syncErr);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, error: syncErr?.message || 'Internal Server Error' }));
      }
      resolve();
    }
  });
}

