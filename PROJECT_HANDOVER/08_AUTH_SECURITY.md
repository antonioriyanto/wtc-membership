# AUTHENTICATION, AUTHORIZATION & SECURITY AUDIT
**Document**: `PROJECT_HANDOVER/08_AUTH_SECURITY.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Authentication Mechanisms

The system supports 3 distinct authentication personas:

### A. Customer Member
* **Methods**:
  1. **Phone Number Instant Login**: Normalizes Indonesian phone numbers (`0819...`, `62819...`), verifies membership record in Firestore/local storage, and establishes session.
  2. **Google OAuth 2.0 Single Sign-On (SSO)**: Client-side popup (`signInWithPopup(auth, googleProvider)`), links Google UID with existing phone/membership record or creates fresh profile.
  3. **Security PIN**: 6-digit cryptographic PIN used for verifying point redemption.

### B. Cashier POS Staff
* **Method**: Store Code selection + Cashier Name + 4-to-6 digit Employee PIN.
* **Backend Validation**: `ALL /api/auth/employee-login` verifies credentials and mints custom Firebase token (`role: CASHIER`, `storeId: STORE_CODE`).
* **Session Storage**: `localStorage.getItem('wtc_cashier_auth') === 'true'`.

### C. Head Office (HO) Admin
* **Method**: Restricted Admin PIN wall.
* **Credentials**: Username `admin` or `ho`, Secret PIN `wtc26`.
* **Backend Validation**: `ALL /api/auth/employee-login` validates credentials and mints custom token with claim `{ role: 'HO_ADMIN' }`.
* **Session Storage**: `localStorage.getItem('wtc_admin_auth') === 'true'`.

---

## 2. Cryptographic Member PIN Security

* **Source File**: `src/lib/pinCrypto.ts`
* **Algorithm**: PBKDF2 with SHA-256 (10,000 iterations), salt length 16 bytes.
* **Brute-Force Lockout Policy**:
  * Max failed attempts: **5 attempts**.
  * Lockout duration: **15 minutes** (`lockedUntil` timestamp).
  * Auto-reset: Successful authentication resets `failedPinAttempts` to 0.

---

## 3. Security Findings & Recommendations

### [SECURITY NOTICE 01] Client-Side Fallback for Employee Login
* **Severity**: MEDIUM
* **Finding**: In `/server.ts`, if `FIREBASE_PRIVATE_KEY` is not supplied, the server falls back to evaluating credentials locally and client tokens operate in resilient mode.
* **Recommendation**: In production deployment, ensure `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` are provided in environment variables to enforce signed JWT verification across all endpoints.

### [SECURITY NOTICE 02] Admin Secret PIN in Source
* **Severity**: MEDIUM
* **Finding**: The default HO Admin PIN (`wtc26`) is hardcoded as fallback in `server.ts` line 528 and `LoginWall.tsx`.
* **Recommendation**: Move default admin credentials to environment variables (`HO_ADMIN_USERNAME` and `HO_ADMIN_PIN_HASH`).
