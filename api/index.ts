import { createApp } from '../server.ts';

let cachedApp: any = null;

/**
 * Vercel Serverless Function entry point for Watch Club Loyalty API.
 * Handles all /api/*, /v1/*, and /healthz requests directly on Vercel
 * when VITE_API_BASE_URL is not set or points to the Vercel origin.
 */
export default async function handler(req: Request, res: Response) {
  if (!cachedApp) {
    cachedApp = await createApp();
  }

  // When Vercel rewrites /api/(.*) to /api, restore the full path if stripped
  if (!req.url.startsWith('/api') && !req.url.startsWith('/v1') && !req.url.startsWith('/healthz')) {
    const matchedPath =
      (req.headers['x-matched-path'] as string) ||
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-now-route-matches'] ? decodeURIComponent(req.headers['x-now-route-matches'] as string) : '');

    if (matchedPath && (matchedPath.startsWith('/api') || matchedPath.startsWith('/v1') || matchedPath.startsWith('/healthz'))) {
      (req as any).url = matchedPath;
    }
  }

  return cachedApp(req, res);
}
