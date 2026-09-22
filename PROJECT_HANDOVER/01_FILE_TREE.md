# COMPLETE FILE TREE & DIRECTORY ARCHITECTURE
**Document**: `PROJECT_HANDOVER/01_FILE_TREE.md`  
**Generated**: 2026-09-21T19:32:00-07:00

```text
watch-club-loyalty/
├── .env.example                     # Environment declaration template
├── AGENTS.md                        # Platform instructions for autonomous AI agents
├── firestore.rules                  # Firestore security rules (roles, immutability, credentials)
├── index.html                       # Single-page HTML entry point (PWA meta, viewport, font tags)
├── metadata.json                    # AI Studio app metadata, capabilities & permissions
├── package.json                     # Dependency manifests, scripts (dev, build, start, lint)
├── tsconfig.json                    # TypeScript compiler options (ESNext, React JSX, Bundler resolution)
├── vite.config.ts                   # Vite configuration (React, Tailwind v4, PWA plugins)
├── server.ts                        # Master backend server (Express 5, Firebase Admin, Multer, Vite SPA)
│
├── data/                            # Persistent server-side storage fallback
│   ├── members.json                 # Serialized member profiles (atomic disk write)
│   ├── stores.json                  # Serialized store branches (42 Watch Club stores)
│   └── deleted_members.json         # Tombstone list of permanently deleted member IDs
│
├── public/                          # Static public assets
│   ├── apple-touch-icon.png         # iOS PWA home screen icon
│   ├── favicon-16x16.png            # Browser tab favicon (16px)
│   ├── favicon-32x32.png            # Browser tab favicon (32px)
│   ├── pwa-192x192.png              # Android PWA icon (192px)
│   ├── pwa-512x512.png              # Android PWA icon (512px)
│   ├── watch-club-icon.svg          # Official Watch Club vector badge
│   └── uploads/                     # Upload directory for uploaded store & voucher photos
│
├── src/                             # Frontend source code (React 19 + TypeScript)
│   ├── main.tsx                     # React root DOM mounting (`<StrictMode>`, router context)
│   ├── App.tsx                      # Primary router orchestrator, sync bootstrap, auth walls
│   ├── ErrorBoundary.tsx            # Global UI exception boundary
│   ├── index.css                    # Global Tailwind CSS entry (@import "tailwindcss")
│   ├── types.ts                     # Central TypeScript definitions (Member, Store, Voucher, etc.)
│   │
│   ├── components/                  # Modular React UI components
│   │   ├── AuditTrailTab.tsx        # HO Tab: Immutable security and transaction audit logs
│   │   ├── CampaignsTab.tsx         # HO Tab: Marketing broadcasts & popup banners
│   │   ├── CashierHeader.tsx        # POS Header: Store indicator, cashier name, quick actions
│   │   ├── CashierMembersTab.tsx    # POS: Member lookup, quick register, PIN reset modal
│   │   ├── CashierPinResetModal.tsx # POS Modal: Authorized cashier PIN recovery
│   │   ├── CashierSettingsTab.tsx   # POS: Branch terminal profile, receipt printer simulation
│   │   ├── CashierSidebar.tsx       # POS: Navigation sidebar for cashier terminal
│   │   ├── CashierSupportTicketsTab.tsx # POS: Store-level support ticket dispatcher
│   │   ├── CashierTab.tsx           # POS: QR scanning, point issuance, receipt entry, voucher checkout
│   │   ├── CashierTerminalView.tsx  # Master Cashier POS Container View
│   │   ├── CashierTransactionsTab.tsx # POS: Daily branch transaction history
│   │   ├── CreateMemberModal.tsx    # Modal: Fast member creation with auto-generated membership ID
│   │   ├── CreateVoucherModal.tsx   # Modal: HO discount voucher & campaign voucher generator
│   │   ├── CustomDialogProvider.tsx # Accessible modal dialog & toast replacement (no window.alert)
│   │   ├── CustomerMemberView.tsx   # Master Customer PWA View (Wallet, QR, Stores, Profile, Tickets)
│   │   ├── CustomerPinPromptModal.tsx # Modal: Cryptographic PIN verification for point redemption
│   │   ├── DeleteMemberModal.tsx    # Modal: Destructive member deletion with tombstone propagation
│   │   ├── EditMemberModal.tsx      # Modal: Update member tier, phone, address, and email
│   │   ├── Header.tsx               # HO Header: User profile, notifications, search bar
│   │   ├── LoginWall.tsx            # Auth views: AdminLogin & MemberLogin (Phone / Google SSO)
│   │   ├── LoyaltyRulesTab.tsx      # HO Tab: Configure spending thresholds, point multipliers, expiry
│   │   ├── ManualPointAdjustmentModal.tsx # Modal: HO administrative point credit/debit with audit note
│   │   ├── MemberDetailsModal.tsx   # Modal: Comprehensive member 360-view & transaction timeline
│   │   ├── MemberLogin.tsx          # Dedicated Member Login component
│   │   ├── MemberPreviewModal.tsx   # Modal: Instant preview of customer digital membership card
│   │   ├── MembershipCard.tsx       # Luxury animated card component (Blue, Silver, Gold, Platinum)
│   │   ├── MembersTab.tsx           # HO Tab: Master member directory with filtering & export
│   │   ├── NationalActivityNotifications.tsx # Real-time floating toaster of nationwide POS transactions
│   │   ├── NationalTransactionsTab.tsx # HO Tab: Consolidated nationwide transaction ledger
│   │   ├── OverviewTab.tsx          # HO Tab: Executive KPI dashboard, Recharts revenue & tier breakdown
│   │   ├── PortalSwitcher.tsx       # Dev/Demo Portal Switcher (HO Admin <-> Cashier POS <-> Customer PWA)
│   │   ├── ProfileUploader.tsx      # Avatar uploader with HTML5 canvas square compression
│   │   ├── PwaInstallPrompt.tsx     # PWA 'Add to Home Screen' install prompt banner
│   │   ├── QuickStoreSwitchModal.tsx# POS Modal: Instant branch switching for multi-store supervisors
│   │   ├── ReceiptInput.tsx         # Numeric keypad & receipt scanner helper
│   │   ├── Sidebar.tsx              # HO Sidebar: Navigation for Head Office Admin portal
│   │   ├── StoreCard.tsx            # Interactive store card with GPS distance, WA chat, Maps link
│   │   ├── StoresSettingsTab.tsx    # HO Tab: Manage 42 stores, upload store banner, edit managers
│   │   ├── StoreTransactionsModal.tsx # Modal: Store-specific ledger view
│   │   ├── SupportTicketsTab.tsx    # HO Tab: Omnichannel customer care ticketing desk
│   │   ├── TierBenefitsList.tsx     # Visual breakdown of Silver/Gold/Platinum perks
│   │   ├── VouchersTab.tsx          # HO Tab: Master voucher manager, usage quotas, discount rules
│   │   ├── VoucherTermsModal.tsx    # Modal: Terms & conditions viewer for promotional vouchers
│   │   ├── WatchClubLogo.tsx        # Vector SVG Watch Club branding
│   │   └── WhatsAppLogo.tsx         # Vector SVG WhatsApp direct chat link icon
│   │
│   ├── data/
│   │   ├── mockData.ts              # Canonical initial dataset: 42 official stores, tiers, rules
│   │   └── tierBenefitsData.ts      # Tier benefit matrix (discounts, birthday gifts, valet, watch polishing)
│   │
│   ├── db/                          # Optional PostgreSQL relational database layer
│   │   ├── drizzle.config.ts        # Drizzle ORM config
│   │   ├── index.ts                 # Postgres connection pool builder
│   │   └── schema.ts                # Drizzle schema definitions (members, stores, transactions, vouchers)
│   │
│   ├── hooks/
│   │   ├── useBarcodeScanner.ts     # Hook: Hardware and camera barcode/QR event listener
│   │   └── useMemberLiveProfile.ts  # Hook: Real-time Firestore snapshot listener for member balance
│   │
│   ├── lib/                         # Core utilities, security & synchronization engines
│   │   ├── authHelper.ts            # Client-side session and role token utilities
│   │   ├── canonicalMember.ts       # Sequential membership ID generator (`KOKAS0001`, `PURI0001`)
│   │   ├── firebase.ts              # Firebase Client SDK initialization (Auth, Firestore, Google Provider)
│   │   ├── image-compressor.ts      # Canvas-based client-side image compression
│   │   ├── logger.ts                # Structured Pino logger
│   │   ├── loyalty.ts               # Core tier calculation engine & multiplier algorithm
│   │   ├── memberAuthClient.ts      # Cryptographic client helper for PIN authentication
│   │   ├── pinCrypto.ts             # PBKDF2/SHA-256 PIN hashing with salt and lock-out protection
│   │   ├── storeMapping.ts          # Store code mapping and GPS coordinates normalization
│   │   ├── syncFirestore.ts         # Bi-directional Firestore sync engine and sanitizers
│   │   └── sync-worker.ts           # Background offline queue and tombstone sync worker
│   │
│   └── utils/
│       ├── exportCsv.ts             # CSV generator with UTF-8 BOM encoding for Excel compatibility
│       ├── imageCompression.ts      # Image resizing and WebP/JPEG compression
│       └── tierBadge.tsx            # Styled visual badge for Blue, Silver, Gold, Platinum tiers
│
└── PROJECT_HANDOVER/                # Master Handover Documentation Package
```
