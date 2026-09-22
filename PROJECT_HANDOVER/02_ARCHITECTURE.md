# SYSTEM ARCHITECTURE & DATA FLOW
**Document**: `PROJECT_HANDOVER/02_ARCHITECTURE.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. High-Level Architecture Topology

The application follows an **Omnichannel Hybrid Client-Server Architecture** designed for high resilience across 42 physical retail boutiques where internet connectivity may fluctuate.

```mermaid
graph TD
    subgraph Client Portals
        PWA[Customer Web PWA\nMobile Browser / Installed PWA]
        POS[Cashier POS Terminal\nDesktop / Tablet in 42 Stores]
        HO[Head Office Admin Portal\nRestricted Desktop Web]
    end

    subgraph Reverse Proxy & App Server
        Proxy[Cloud Run Nginx Reverse Proxy\nPort 3000]
        Express[Node.js Express 5 Backend\nserver.ts]
        ViteSPA[Vite Dev/Production Static Assets]
    end

    subgraph Realtime Cloud Services
        Firestore[(Google Cloud Firestore\nwatch-club-membership)]
        FirebaseAuth[Firebase Auth & Google SSO]
    end

    subgraph Persistent Local Fallback
        DataJSON[(Server Disk JSON\nmembers.json / stores.json)]
        LocalQueue[(Browser LocalStorage\nOffline Queue & Tombstones)]
    end

    subgraph Relational DB
        Postgres[(PostgreSQL via Drizzle ORM\nOptional / Configured in schema.ts)]
    end

    PWA -->|HTTPS / WSS| Proxy
    POS -->|HTTPS / WSS| Proxy
    HO -->|HTTPS / WSS| Proxy

    Proxy --> Express
    Express --> ViteSPA

    PWA -.->|Real-time onSnapshot| Firestore
    POS -.->|Real-time onSnapshot| Firestore
    HO -.->|Real-time onSnapshot| Firestore

    POS -->|POST /api/loyalty/add-points| Express
    POS -->|POST /api/upload| Express
    HO -->|PUT /api/stores/:id| Express
    HO -->|DELETE /api/members/:id| Express
    Express -->|Atomic Transaction| Firestore
    Express -->|Fallback Persistence| DataJSON
    Express -.->|Drizzle Pool| Postgres

    PWA <--> LocalQueue
    POS <--> LocalQueue
```

---

## 2. Request Lifecycle & Dual-Sync Synchronization Flow

### A. Point Issuance Flow (Cashier Terminal)
```mermaid
sequenceDiagram
    autonumber
    actor Cashier as Cashier at Store
    participant POS as Cashier POS Terminal (UI)
    participant API as Express API (/api/loyalty/add-points)
    participant FS as Google Firestore (db.runTransaction)
    participant Disk as Local JSON Persistence (data/)
    participant Member as Customer PWA (Live Snapshot)

    Cashier->>POS: Scans Member QR & Inputs Receipt No + Spending (IDR)
    POS->>API: POST /api/loyalty/add-points (memberId, amount, receiptNo, storeId)
    API->>API: Check Duplicate Receipt Number
    alt Duplicate Receipt Detected
        API-->>POS: 400 Bad Request ("Nomor struk ini sudah pernah ditukarkan")
    else Valid Receipt
        API->>FS: Start Firestore Atomic Transaction
        FS->>FS: Read Member Tier & Multiplier Config
        FS->>FS: Calculate Points (Spend / 10,000 * Tier Multiplier)
        FS->>FS: Write Transaction Document (/transactions/tx_...)
        FS->>FS: Write Audit Log Document (/audit/AL_...)
        FS->>FS: Update Member Balance, Lifetime Points & Total Spend
        FS-->>API: Transaction Committed
        API->>Disk: Backup updated member state
        API-->>POS: 200 OK (calculatedPoints, newPoints, newTier)
        POS->>Cashier: Plays success audio & displays receipt confirmation
        FS-->>Member: Realtime onSnapshot triggers -> Points & Tier update immediately on phone screen
    end
```

### B. Member Deletion & Tombstone Flow
```mermaid
sequenceDiagram
    autonumber
    actor Admin as HO Executive
    participant UI as Head Office MembersTab
    participant API as Express API (DELETE /api/members/:id)
    participant FS as Firestore (members collection)
    participant Disk as deleted_members.json (Tombstone)
    participant PWA as Customer Phone (Active Session)

    Admin->>UI: Clicks "Hapus Member" & Confirms Deletion
    UI->>FS: deleteDoc(doc(db, 'members', memberId))
    UI->>API: DELETE /api/members/:id
    API->>FS: db.collection('members').doc(memberId).delete()
    API->>Disk: Append ID to deleted_members.json
    API-->>UI: 200 OK (deletedId)
    UI->>UI: Record tombstone in localStorage ('wtc_deleted_member_ids')
    FS-->>PWA: onSnapshot triggers -> Document doesn't exist
    PWA->>PWA: Remove session ('wtc_logged_in_member')
    PWA->>Admin: Alerts user "Akun telah dihapus oleh Admin HO" & redirects to Login
```

---

## 3. Deployment Topology & Container Boundaries
* **Runtime**: Google Cloud Run Linux container.
* **Network**: Single external ingress port `3000` via internal reverse proxy.
* **Server Binding**: Must listen on `0.0.0.0:3000`.
* **Stateful Mounts**:
  * Static file uploads at `/public/uploads` (served directly via `/uploads/*`).
  * File storage at `/data/*.json` provides hot data resilience across container restarts.
