# CRITICAL INVARIANTS & DO-NOT-BREAK DIRECTIVES
**Document**: `PROJECT_HANDOVER/22_CRITICAL_INVARIANTS.md`  
**Generated**: 2026-09-21T19:32:00-07:00

These invariants **MUST NEVER BE VIOLATED OR MUTATED** by incoming engineers or AI coding agents during refactoring:

---

### [INV-001] Ledger Immutability
* **Invariant**: Transaction records (`/transactions/*`) and Audit logs (`/audit/*`) must remain strictly append-only.
* **Reason**: Indonesian retail tax and financial compliance prohibits editing or deleting historic sales receipts and point transactions. In `firestore.rules`, updates and deletions are locked.

---

### [INV-002] Multiplier Tier Authority
* **Invariant**: Point calculation must adhere to the tier ratio multiplier (`PLATINUM` = 1.75x, `GOLD` = 1.25x, `SILVER`/`BLUE` = 1.0x).
* **Reason**: Cashiers cannot manually edit point totals without an HO-approved override audit trail.

---

### [INV-003] Duplicate Receipt Rejection
* **Invariant**: A single physical store receipt number (`receiptNo`) can only be used once across the entire national database.
* **Reason**: Prevents staff or customers from claiming multiple rewards for the same store invoice.

---

### [INV-004] Resilient Persistence Guarantee
* **Invariant**: The application must remain operable even if Firestore or Google Cloud network connectivity is disrupted.
* **Reason**: Physical retail boutiques in shopping malls frequently experience network dropouts. The fallback layer in `/data/*.json` and `localStorage` prevents sales disruption.

---

### [INV-005] Tombstone Preservation for Deleted Members
* **Invariant**: Any member deleted by HO Admin must be permanently recorded in `data/deleted_members.json` and client `localStorage` tombstone arrays.
* **Reason**: Eliminates the "ghost login" defect where stale client sessions could resurrect deleted profiles.
