# PROJECT INVENTORY
**Project**: Watch Club Indonesia — Omnichannel Loyalty & POS Enterprise System  
**Document**: `PROJECT_HANDOVER/00_PROJECT_INVENTORY.md`  
**Audit Timestamp**: 2026-09-21T19:32:00-07:00  
**Verification Level**: VERIFIED (Direct Workspace Code Inspection)

---

## 1. Project Identity

* **Project Name**: Watch Club - Head Office Admin Portal & Omnichannel Loyalty System
* **Primary Objective**: Provide an end-to-end omnichannel loyalty ecosystem for Watch Club Indonesia (network of 42+ luxury boutique retail stores across Indonesia), unifying:
  1. Head Office (HO) Executive CRM, Analytics & Inventory/Settings Administration.
  2. Cashier POS Terminal (real-time QR member lookup, point issuance, voucher redemption, transaction receipts).
  3. Customer Progressive Web App (PWA) (digital membership card, QR token, point balance, voucher wallet, store locator with GPS/region filter, profile self-service, support ticket desk).
* **Application Archetype**: Full-Stack Monorepo Single-Page Application (React 19 + Express 5 + Vite 6 + Firebase Firestore real-time sync + optional PostgreSQL via Drizzle ORM).
* **Target Users**:
  1. *Head Office Executives & CRM Administrators* (`HO_ADMIN` / `ADMIN`).
  2. *Boutique Store Cashiers & Store Managers* (`CASHIER` / `STORE_CASHIER` across 42 store branches).
  3. *Retail Watch Buyers & Loyalty Members* (Customer tier: `BLUE`, `SILVER`, `GOLD`, `PLATINUM`).
* **Production Status**: Production-Ready / Live Pilot with resilient local fallback mode.
* **Environments Detected**:
  * Development / Preview: Google Cloud Run container (`port 3000`).
  * Backend API: Node.js (Express 5.2.1) mounted with Vite middleware.
  * Realtime Database: Google Cloud Firestore (project: `watch-club-membership`).
  * Local Storage Engine: Server-side JSON persistence (`/data/members.json`, `/data/stores.json`, `/data/deleted_members.json`) + browser `localStorage` cached state.

---

## 2. Technology Stack & Exact Versions

### Frontend
* **Framework**: React 19 (`react` 19.0.1, `react-dom` 19.0.1)
* **Language**: TypeScript (`typescript` ~5.8.2, `strict: true` in tsconfig)
* **Build Tool & Dev Server**: Vite (`vite` ^6.2.3, `@vitejs/plugin-react` ^5.0.4)
* **Routing**: React Router (`react-router-dom` ^7.18.2)
* **CSS & Utility Framework**: Tailwind CSS v4 (`@tailwindcss/vite` ^4.1.14, `tailwindcss` ^4.1.14)
* **Motion & Animation**: Motion (`motion` ^12.23.24) & Canvas Confetti (`canvas-confetti` ^1.9.4)
* **Icons**: Lucide React (`lucide-react` ^0.546.0)
* **Charts & Analytics**: Recharts (`recharts` ^3.10.1)
* **QR & Barcode**: HTML5 QR Code (`html5-qrcode` ^2.3.8) & QR Code React (`qrcode.react` ^4.2.0)
* **Data Fetching / Realtime**: Firebase Client SDK (`firebase` ^12.18.0) + SWR (`swr` ^2.5.1)
* **Export Utilities**: SheetJS (`xlsx` ^0.18.5) + Native CSV Generator

### Backend
* **Runtime**: Node.js (ESM / TypeScript executed via `tsx` ^4.23.13)
* **Web Framework**: Express v5 (`express` ^5.2.1)
* **File Uploads**: Multer (`multer` ^2.2.0) writing to `/public/uploads`
* **Rate Limiting**: Express Rate Limit (`express-rate-limit` ^8.7.0)
* **Admin SDK**: Firebase Admin (`firebase-admin` ^14.3.0) with resilient fallback
* **AI Engine**: Google GenAI SDK (`@google/genai` ^2.4.0) configured on server
* **Production Bundler**: esbuild (`esbuild` ^0.28.2) compiling to CommonJS `dist/server.cjs`

### Database
* **Primary / Realtime**: Google Cloud Firestore (`firebase/firestore`, real-time listeners `onSnapshot`, transactions `runTransaction`)
* **Relational / SQL Layer**: PostgreSQL via Drizzle ORM (`drizzle-orm` ^0.45.2, `drizzle-kit` ^0.31.10, `pg` ^8.23.0, `postgres` ^3.4.9)
* **File Persistence Layer**: Local JSON files in `/data/` (`members.json`, `stores.json`, `deleted_members.json`) ensuring zero data loss if external DB is disconnected.

---

## 3. Dependency Inventory & Status Classification

| Package Name | Declared Version | Category | Status | Role in Application |
|---|---|---|---|---|
| `react` / `react-dom` | `^19.0.1` | Core Framework | ACTIVE | Frontend virtual DOM & state handling |
| `react-router-dom` | `^7.18.2` | Routing | ACTIVE | Client-side routing (`/`, `/admin`, `/cashier`, `/member`) |
| `express` | `^5.2.1` | Backend Server | ACTIVE | API routes, static asset serving, Vite middleware |
| `firebase` | `^12.18.0` | Client DB / Auth | ACTIVE | Realtime Firestore subscriptions, client Google OAuth |
| `firebase-admin` | `^14.3.0` | Admin DB / Auth | ACTIVE | Atomic server transactions, custom token minting |
| `@tailwindcss/vite` | `^4.1.14` | Styling Engine | ACTIVE | Tailwind CSS v4 compiler integration |
| `recharts` | `^3.10.1` | Visualization | ACTIVE | HO Admin interactive sales, point, and membership charts |
| `html5-qrcode` | `^2.3.8` | Hardware IO | ACTIVE | Web camera QR scanner in Cashier Terminal |
| `qrcode.react` | `^4.2.0` | Generator | ACTIVE | Dynamic QR token renderer in Customer PWA |
| `lucide-react` | `^0.546.0` | Iconography | ACTIVE | Standardized vector icons throughout portals |
| `motion` | `^12.23.24` | Animation | ACTIVE | Smooth transitions between tabs & modal dialogs |
| `canvas-confetti` | `^1.9.4` | Gamification | ACTIVE | Confetti burst upon tier upgrade or voucher claim |
| `multer` | `^2.2.0` | File I/O | ACTIVE | Multipart form upload handler for store images & vouchers |
| `@google/genai` | `^2.4.0` | AI Logic | ACTIVE | Gemini API capability declared for server-side automation |
| `drizzle-orm` / `pg` | `^0.45.2` / `^8.23.0`| Relational DB | ACTIVE (Optional) | PostgreSQL schema defined in `src/db/schema.ts` |
| `xlsx` | `^0.18.5` | Export | ACTIVE | Excel/CSV report generator for HO Admin data tables |
| `swr` | `^2.5.1` | Data Fetching | POSSIBLY UNUSED | Declared in package.json; app primarily uses Firestore `onSnapshot` |
| `vitest` | `^5.0.0` | Testing | ACTIVE (Dev) | Test runner for loyalty calculations and sync worker |
