# FEATURE INVENTORY & COMPLIANCE MATRIX
**Document**: `PROJECT_HANDOVER/15_FEATURE_MATRIX.md`  
**Generated**: 2026-09-21T19:32:00-07:00

| Module / Feature | Frontend | Backend | Database | Status | Primary Component / File |
|---|---|---|---|---|---|
| **Customer Digital Tier Card** | Yes | Yes | Firestore | WORKING | `src/components/MembershipCard.tsx` |
| **Customer Dynamic QR Token** | Yes | No | Local | WORKING | `src/components/CustomerMemberView.tsx` |
| **Boutique Store Locator (GPS)** | Yes | Yes | Firestore / Disk | WORKING | `src/components/StoreCard.tsx` |
| **Region Filter Chips for Stores**| Yes | No | Local State | WORKING | `src/components/CustomerMemberView.tsx` |
| **WhatsApp Boutique Chat Link** | Yes | No | Store Meta | WORKING | `src/components/StoreCard.tsx` |
| **Customer Profile Image Upload** | Yes | Yes | Firestore / Disk | WORKING | `src/components/CustomerMemberView.tsx` |
| **Delivery Address Self-Service** | Yes | Yes | Firestore / Disk | WORKING | `src/components/CustomerMemberView.tsx` |
| **Customer Care Ticket Desk** | Yes | Yes | Firestore | WORKING | `src/components/CustomerMemberView.tsx` |
| **POS Barcode / QR Scanner** | Yes | No | Hardware / Cam | WORKING | `src/components/CashierTab.tsx` |
| **POS Member Fast Lookup** | Yes | Yes | Firestore / Disk | WORKING | `src/components/CashierTab.tsx` |
| **POS Point Issuance Engine** | Yes | Yes | Firestore / Disk | WORKING | `server.ts` (`/api/loyalty/add-points`) |
| **Duplicate Receipt Protection** | Yes | Yes | Firestore | WORKING | `server.ts` (`where('receiptNo', '==')`) |
| **POS Voucher Redemption** | Yes | Yes | Firestore | WORKING | `src/components/CashierTab.tsx` |
| **Cashier Member PIN Reset** | Yes | Yes | Firestore | WORKING | `src/components/CashierPinResetModal.tsx`|
| **HO Executive KPI Dashboard** | Yes | Yes | Firestore | WORKING | `src/components/OverviewTab.tsx` |
| **HO Member Directory & Export**| Yes | Yes | Firestore / Disk | WORKING | `src/components/MembersTab.tsx` |
| **HO Member Tombstone Deletion** | Yes | Yes | Firestore / Disk | WORKING | `server.ts` (`/api/members/:id`) |
| **HO Store Manager & Photo** | Yes | Yes | Firestore / Disk | WORKING | `src/components/StoresSettingsTab.tsx` |
| **HO Loyalty Rules Configuration**| Yes | Yes | Firestore | WORKING | `src/components/LoyaltyRulesTab.tsx` |
| **HO Voucher Lifecycle Manager** | Yes | Yes | Firestore | WORKING | `src/components/VouchersTab.tsx` |
| **HO Campaigns & Popup Banners** | Yes | Yes | Firestore | WORKING | `src/components/CampaignsTab.tsx` |
| **HO Immutable Audit Trail** | Yes | Yes | Firestore | WORKING | `src/components/AuditTrailTab.tsx` |
| **National Live POS Toaster** | Yes | Yes | Firestore | WORKING | `src/components/NationalActivityNotifications.tsx`|
