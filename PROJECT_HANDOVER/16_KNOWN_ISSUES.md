# KNOWN ISSUES, TECHNICAL DEBT & ACTION ITEMS
**Document**: `PROJECT_HANDOVER/16_KNOWN_ISSUES.md`  
**Generated**: 2026-09-21T19:32:00-07:00

The following items are documented for the incoming engineering team / AI agent. They are classified by severity (`P0` to `P3`):

---

### [ISSUE-01] [SEVERITY: P1] Hardcoded Admin PIN in LoginWall and Server Fallback
* **Component**: `src/components/LoginWall.tsx` & `server.ts`
* **Description**: Default HO Admin username `admin` and PIN `wtc26` are embedded directly in code as a development convenience.
* **Impact**: Anyone with knowledge of the PIN can access the restricted HO Admin portal if no external OAuth/SSO is enforced.
* **Probable Cause**: Early development speed for testing role switching.
* **Recommended Fix**: Externalize into `HO_ADMIN_USERNAME` and `HO_ADMIN_PIN_HASH` environment variables.

---

### [ISSUE-02] [SEVERITY: P2] Firestore Public Write Rules in Non-Authenticated Mode
* **Component**: `firestore.rules`
* **Description**: To support prototype and offline kiosk terminals that do not pass Firebase Auth tokens, rules currently permit read/write on stores, members, and vouchers.
* **Impact**: If Firebase config keys are leaked without App Check, malicious users could modify member point balances directly via the Firestore REST API.
* **Probable Cause**: Permissive prototyping rules.
* **Recommended Fix**: Enforce token role checks (`isStaffOrAdmin()`) and transition all point mutations strictly to backend Express endpoints (`/api/loyalty/add-points`).

---

### [ISSUE-03] [SEVERITY: P2] Client-Side Upload Folder on Ephemeral Containers
* **Component**: `/public/uploads` in `server.ts`
* **Description**: Uploaded files (store photos, voucher images) are saved to the container's local disk `/public/uploads`.
* **Impact**: On Cloud Run or container restart/redeploy, uploaded files will be reset to image defaults unless persistent volume mounts or cloud bucket storage (Google Cloud Storage / Firebase Storage) is integrated.
* **Recommended Fix**: Connect `multer` to Google Cloud Storage or Firebase Storage bucket.

---

### [ISSUE-04] [SEVERITY: P3] Optional PostgreSQL Setup Not Connected by Default
* **Component**: `src/db/index.ts` & `src/db/schema.ts`
* **Description**: Drizzle ORM PostgreSQL schema is fully written and typed, but the runtime defaults to Firestore and local JSON files.
* **Impact**: None on existing functionality; SQL schema serves as a blueprint for organizations requiring relational backups.
* **Recommended Fix**: Run Drizzle migrations (`npm run db:push` or `drizzle-kit push`) once a PostgreSQL database URL is supplied.
