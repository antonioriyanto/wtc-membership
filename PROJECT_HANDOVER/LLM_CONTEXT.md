# MASTER LLM CONTEXT & SYSTEM OVERVIEW
**Document**: `PROJECT_HANDOVER/LLM_CONTEXT.md`  
**Generated**: 2026-09-21T19:32:00-07:00

> **INSTRUCTION FOR INCOMING LLM / CODING AGENT**:  
> Read this file first. It provides an immediate, authoritative mental model of the Watch Club Omnichannel Loyalty & POS System. Do not guess or assume functionality; everything here is verified from actual source code.

---

## 1. Executive Summary
* **Project**: Watch Club Indonesia — Omnichannel Loyalty & POS System.
* **Scope**: 42 physical luxury boutiques across Indonesia + Head Office management + Customer PWA.
* **Architecture**: Full-Stack Single-Page App (React 19 + Express 5 + Vite 6 + Firebase Firestore + Drizzle ORM).
* **Port / Network**: Runs on Linux container port `3000` via Nginx reverse proxy.
* **Authoritative Codebase**:
  * Server entry point: `/server.ts`
  * Frontend entry point: `/src/App.tsx`
  * Security rules: `/firestore.rules`
  * Data fallback: `/data/members.json` & `/data/stores.json`

---

## 2. The Three Portals

### 1. Customer Loyalty PWA (`/member` or `/`)
* **Target**: Luxury watch retail customers.
* **Key Capabilities**:
  * Metallic digital membership card (`BLUE`, `SILVER`, `GOLD`, `PLATINUM`).
  * Dynamic refreshable QR code token for cashier scanning.
  * Real-time point balance updates via Firestore `onSnapshot`.
  * Voucher wallet with terms and "Pakai di Kasir" barcode.
  * 42-Store locator sorted by GPS proximity with WhatsApp boutique concierge chat.
  * Profile photo upload (HTML5 canvas 320x320 center-crop compression) & controlled address input.
  * Customer support ticketing desk.

### 2. Cashier POS Terminal (`/cashier`, `/pos`, `/kasir`)
* **Target**: Store staff and managers at 42 branches.
* **Key Capabilities**:
  * Web camera QR scanning (`html5-qrcode`) and USB barcode gun support.
  * Real-time member search by phone number or membership ID.
  * Receipt invoice point issuance with duplicate receipt protection (`/api/loyalty/add-points`).
  * Instant voucher redemption.
  * Member PIN recovery modal.

### 3. Head Office (HO) Admin Portal (`/admin`, `/ho`)
* **Target**: Executive directors, CRM managers, loyalty administrators.
* **Key Capabilities**:
  * Executive analytics dashboard with Recharts revenue, tier breakdowns, and store performance.
  * Member directory with CSV/Excel export, manual point adjustments, and destructive tombstone deletion.
  * Store manager for all 42 branches with photo banner upload and WhatsApp coordinate settings.
  * Loyalty program rule editor (spending ratio, multiplier rates, birthday bonus).
  * Voucher campaign manager (usage limits, date windows, discount percentages).
  * Immutable system audit trail.

---

## 3. Core Technical Invariants & Rules
1. **Never mutate historic transactions or audit logs**: Ledger entries are append-only.
2. **Never violate tier multipliers**: `PLATINUM` (1.75x), `GOLD` (1.25x), `SILVER`/`BLUE` (1.0x).
3. **Never allow duplicate receipt usage**: Each invoice number can only be claimed once nationally.
4. **Never reintroduce the ghost login bug**: Do not use `|| members[0]` as a session fallback; if a member document is missing/deleted, log the user out cleanly.
5. **Always preserve the local fallback layer**: `/data/*.json` ensures the retail stores can operate offline.

---

## 4. How to Run & Build
* Development dev server: `npm run dev` (starts `tsx server.ts` on port 3000).
* Type check & lint: `npm run lint` (runs `tsc --noEmit`).
* Production build: `npm run build` (runs `vite build` + `esbuild server.ts`).
* Production launch: `npm run start` (runs `node dist/server.cjs`).
