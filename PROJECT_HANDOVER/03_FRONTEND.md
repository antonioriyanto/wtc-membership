# FRONTEND ARCHITECTURE & DESIGN SYSTEM
**Document**: `PROJECT_HANDOVER/03_FRONTEND.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Application Routing & Portals

The application implements a multi-portal architecture managed by `react-router-dom` in `/src/App.tsx`.

| Path Route | Portal Name | Access Requirement | Primary Component | Responsibility |
|---|---|---|---|---|
| `/` | Portal Gateway / Member | Public / Auto-Redirect | `CustomerMemberView` or `MemberLogin` | Direct customer loyalty entry |
| `/member` | Customer Loyalty PWA | Member Phone / Google SSO | `CustomerMemberView` | Digital card, QR barcode, points, vouchers, stores |
| `/cashier` | Cashier POS Terminal | Cashier PIN (`wtc_cashier_auth`) | `CashierTerminalView` | POS register, scan member, issue points, voucher redeem |
| `/pos` / `/kasir` | Cashier Aliases | Cashier PIN | `CashierTerminalView` | Friendly localized route aliases |
| `/admin` / `/ho` | Head Office Portal | HO Admin Secret PIN (`wtc_admin_auth`)| `OverviewTab` / HO Layout | Master CRM, store settings, rules, analytics, audit |

---

## 2. Core Portals Detailed Breakdown

### Portal 1: Customer Member PWA (`src/components/CustomerMemberView.tsx`)
* **State & Subscriptions**:
  * Real-time listener: `useMemberLiveProfile(initialMember.id)` listening directly to `doc(db, 'members', memberId)`.
  * Auto-logout on tombstone: if document does not exist, triggers `localStorage.removeItem('wtc_logged_in_member')` and notifies user.
* **Key Features**:
  1. **Luxury Tier Card**: Animated `MembershipCard` with tier-reactive metallic finish (Blue, Silver, Gold, Platinum) and flip-to-show-details.
  2. **Dynamic QR Token**: Generates member QR code via `qrcode.react` with refresh timer for POS cashier scanning.
  3. **Voucher Wallet**: Lists available promotions, claimed vouchers, terms modal, and "Pakai di Kasir" barcode trigger.
  4. **Official Store Locator**:
     * Live GPS geolocation with two-tier fallback (`enableHighAccuracy: true` -> standard fallback).
     * Haversine formula calculation for distance sorting (e.g., "1.4 km dari lokasi Anda").
     * Region filter chips (`Semua Cabang`, `Jakarta`, `BODETABEK`, `Jawa Barat`, `Jateng & DIY`, `Jawa Timur`, `Luar Jawa & Bali`).
     * Direct WhatsApp boutique chat button (`https://wa.me/62...`) and Google Maps directions link.
  5. **Profile Self-Service**:
     * Profile photo upload with client-side HTML5 canvas center-crop to 320x320 JPEG.
     * Controlled input for Delivery Address & Email synced directly to Firestore and `PUT /api/members/:id`.
  6. **Support Ticket Desk**: Submit customer inquiries and missing-point claims directly to HO.

### Portal 2: Cashier POS Terminal (`src/components/CashierTerminalView.tsx`)
* **Key Features**:
  1. **Barcode / QR Hardware Scanner**: Supports camera scanning via `html5-qrcode` and direct input keystrokes from USB barcode guns (`useBarcodeScanner`).
  2. **Fast Member Lookup**: Real-time telephone or membership ID search with fuzzy match and 62/0 normalization.
  3. **Instant Point Issuance**: Keypad receipt number input, amount in Rupiah, dynamic tier calculation preview, and duplicate receipt protection.
  4. **Voucher Redemption**: Validates voucher expiration, store applicability, and single-use constraints.
  5. **PIN Recovery**: Cashier can initiate a PIN reset for members who forgot their security PIN.

### Portal 3: Head Office Admin Portal (`src/components/Sidebar.tsx` + Tabs)
* **Tabs**:
  1. `OverviewTab`: Executive KPI cards, sales charts, point distribution, member acquisition graphs via `recharts`.
  2. `MembersTab`: Full member database table, CSV export, tier badge filters, edit member modal, manual point adjustment, delete member modal.
  3. `StoresSettingsTab`: Comprehensive manager for all 42 Watch Club stores, edit address, phone, manager name, and store photo banner upload.
  4. `NationalTransactionsTab`: Nationwide immutable transaction ledger with cashier and receipt filters.
  5. `LoyaltyRulesTab`: Dynamic configuration of Rupiah-to-point ratios, tier spending thresholds, and multiplier factors.
  6. `VouchersTab`: Voucher management engine (create, edit, limit quotas, upload banner, set date range).
  7. `CampaignsTab`: Push and pop-up announcement banner manager.
  8. `SupportTicketsTab`: Customer care ticketing resolution desk.
  9. `AuditTrailTab`: Immutable security event logs with actor, IP, module, and timestamp.

---

## 3. UI/UX Design System & Tokens

* **Typography**: Clean modern sans-serif typography system with strict step-ratio scaling.
* **Palette**:
  * Luxury Neutral: `neutral-900` (#171717) and `neutral-950` (#0a0a0a) dark accents.
  * Gold/Warm Accent: Amber accents (`amber-500` / `amber-600`) representing luxury timepiece aesthetics.
  * Tiers:
    * `BLUE`: Cool Slate / Cyan metallic.
    * `SILVER`: Polished Chrome / Platinum-Silver.
    * `GOLD`: Warm Polished Gold / Amber.
    * `PLATINUM`: Dark Obsidian / Titanium with holographic border.
* **Accessible Dialogs**: Built via `CustomDialogProvider.tsx` (`showAlert`, `showConfirm`, `showPrompt`) eliminating blocking native browser dialogs like `window.alert` in iFrame environments.
