# DATABASE DOCUMENTATION & SCHEMAS
**Document**: `PROJECT_HANDOVER/06_DATABASE.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Database Architecture & Double-Stack Model

The system utilizes a **dual-database design**:
1. **Google Cloud Firestore (Operational Realtime DB)**: Used directly by client PWA, POS, and HO Admin dashboards for instant reactive UI updates (`onSnapshot`).
2. **PostgreSQL via Drizzle ORM (Relational / Analytical DB)**: Schema defined in `src/db/schema.ts` for enterprise SQL reporting and transactional integrity.
3. **Flat-File JSON Storage (`data/`)**: Local filesystem persistence layer providing offline-first capability.

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    STORES ||--o{ TRANSACTIONS : hosts
    STORES ||--o{ MEMBERS : registers
    MEMBERS ||--o{ TRANSACTIONS : conducts
    MEMBERS ||--o{ SUPPORT_TICKETS : opens
    VOUCHERS ||--o{ TRANSACTIONS : redeems
    HO_ADMIN ||--o{ AUDIT_LOGS : records
    CASHIER ||--o{ AUDIT_LOGS : records

    MEMBERS {
        string id PK
        string membershipId UK "e.g. KOKAS0001"
        string name
        string phone UK
        string email
        string tier "BLUE, SILVER, GOLD, PLATINUM"
        int points
        int lifetimePoints
        int totalSpend
        timestamp joinDate
        string registeredStore
        string lastStoreVisited
        timestamp lastVisitDate
        string gender
        string birthDate
        string address
        string avatarUrl
        string pinHash
        string pinSalt
        int failedPinAttempts
        timestamp lockedUntil
        string status "ACTIVE, SUSPENDED"
    }

    STORES {
        string id PK "e.g. PUR, KOKAS"
        string code UK
        string name
        string mallName
        string city
        string region
        string address
        string phone
        string whatsapp
        string waNumber
        string managerName
        float latitude
        float longitude
        string imageUrl
        string status "ONLINE, OFFLINE"
    }

    TRANSACTIONS {
        string id PK "tx_..."
        string receiptNo UK "Invoice No"
        string memberId FK
        string memberName
        string storeId FK
        string cashierName
        string type "EARN, REDEEM, ADJUSTMENT"
        int amount "IDR"
        int pointsDelta
        timestamp timestamp
        string notes
    }

    VOUCHERS {
        string id PK
        string code UK
        string title
        string discountType "PERCENTAGE, NOMINAL"
        int discountValue
        int minPurchase
        timestamp validFrom
        timestamp validUntil
        string scope "ALL_STORES, SELECTED_STORES"
        int totalClaimed
        int totalUsed
        int maxUsageLimit
        string status "ACTIVE, EXPIRED, DISABLED"
    }

    AUDIT_LOGS {
        string id PK "AL-..."
        timestamp timestamp
        string actorName
        string actorRole "HO_ADMIN, CASHIER, SYSTEM"
        string action
        string details
        string module "LOYALTY, MEMBERS, VOUCHERS, STORES"
    }

    SUPPORT_TICKETS {
        string id PK
        string memberId FK
        string memberName
        string subject
        string category "MISSING_POINTS, VOUCHER, CORRECTION"
        string status "OPEN, IN_PROGRESS, RESOLVED, CLOSED"
        string priority "LOW, MEDIUM, HIGH, CRITICAL"
        timestamp createdAt
        json messages
    }
```

---

## 3. Firestore Security Rules & Access Control

* **Rule File**: `/firestore.rules`
* **Version**: Rules Version 2
* **Key Constraints**:
  1. `match /transactions/{transactionId}`: `allow update, delete: if false;` (**Immutable Ledger**).
  2. `match /audit/{auditId}`: `allow update, delete: if false;` (**Immutable Audit Trail**).
  3. `match /members/{memberId}`:
     * Deletions strictly restricted (`allow delete: if isStaffOrAdmin();`).
     * Direct client mutations to `pinHash`, `pinSalt`, `failedPinAttempts`, and `lockedUntil` are blocked via rule helper `noCredentialMutation()`.
