# BACKEND ARCHITECTURE & SERVER LIFECYCLE
**Document**: `PROJECT_HANDOVER/04_BACKEND.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Server Entry Point & Initialization

* **File**: `/server.ts`
* **Port & Host**: Bindings strictly configured to `PORT = 3000` and host `0.0.0.0`.
* **Execution Flow**:
```text
server.ts starts
  ├── Load environment via dotenv.config()
  ├── Ensure /public/uploads directory exists
  ├── Configure Multer storage engine (15MB limit)
  ├── Attempt Firebase Admin SDK initialization
  │     ├── IF FIREBASE_PROJECT_ID & FIREBASE_PRIVATE_KEY set -> Authenticate Admin
  │     └── ELSE -> Log notice and run in resilient fallback mode
  ├── Register Express Middleware
  │     ├── express.json({ limit: '20mb' })
  │     ├── express.urlencoded({ extended: true, limit: '20mb' })
  │     └── express.static(/uploads & /public)
  ├── Register API Endpoints (/api/*)
  │     ├── GET /api/health
  │     ├── POST /api/upload (Multer disk storage)
  │     ├── GET/PUT/POST /api/stores (Stores persistence engine)
  │     ├── GET/POST/PUT/DELETE /api/members (Member lifecycle & tombstone)
  │     ├── ALL /api/auth/employee-login (Custom token minting)
  │     └── ALL /api/loyalty/add-points (Atomic point issuance & receipt deduplication)
  ├── Register Vite Middleware / Production Static Fallback
  │     ├── IF NODE_ENV !== 'production' -> Mount Vite dev middleware (SPA mode)
  │     └── ELSE -> Serve dist/ directory and SPA fallback to dist/index.html
  └── app.listen(3000, '0.0.0.0')
```

---

## 2. Server-Side Persistence Engine (Resilient Disk Layer)

To protect physical retail branches from losing data if Firestore credentials expire or cloud networks drop, `/server.ts` maintains a parallel JSON persistence layer in the `/data` directory:

1. **`data/stores.json`**:
   * Initialized with 42 official Watch Club store branches.
   * Updated immediately when an admin edits store managers, phone numbers, or uploads boutique photos.
2. **`data/members.json`**:
   * Persists registered members across container reboots.
   * Normalized phone lookup handles Indonesian dialing prefixes (`628...`, `08...`, `+628...`).
3. **`data/deleted_members.json`**:
   * Stores tombstone records of member IDs deleted by Head Office.
   * Exposed via `GET /api/members/deleted-ids` to prevent local browser caches from resurrecting deleted members.

---

## 3. Production Compilation Pipeline

The production build compiles both client and server into a standalone containerized artifact:

```bash
npm run build
```
1. **Frontend**: `vite build` outputs compiled static bundle to `/dist`.
2. **Backend**: `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
   * Resolves all relative imports at build-time.
   * Outputs CommonJS (`.cjs`), bypassing Node runtime ESM relative import quirks.
   * Keeps npm packages external via `--packages=external`.
   * Generates runtime sourcemaps for production debugging.
3. **Execution**: `npm run start` executes `node dist/server.cjs`.
