# API REFERENCE & SPECIFICATION
**Document**: `PROJECT_HANDOVER/05_API_REFERENCE.md`  
**Generated**: 2026-09-21T19:32:00-07:00

All endpoints are hosted on the unified application server (`http://localhost:3000/api/*`).

---

### 1. System Health
* **Endpoint**: `GET /api/health`
* **Auth**: None
* **Response**:
```json
{
  "status": "ok",
  "message": "Watch Club Omnichannel Backend is running!"
}
```

---

### 2. File & Photo Upload
* **Endpoint**: `POST /api/upload`
* **Auth**: None / Authenticated Cashier or Admin
* **Content-Type**: `multipart/form-data`
* **Payload**: Form field `image` (max 15MB)
* **Response**:
```json
{
  "success": true,
  "url": "/uploads/1789712964465-797987828.jpg",
  "filename": "1789712964465-797987828.jpg",
  "size": 245102
}
```

---

### 3. Store Directory Management

#### `GET /api/stores`
* **Auth**: Public / Internal
* **Response**:
```json
{
  "success": true,
  "stores": [
    {
      "id": "PUR",
      "code": "PUR",
      "name": "Watch Club Mall Puri Indah",
      "mallName": "Mall Puri Indah Jakarta Barat",
      "city": "Jakarta Barat",
      "region": "DKI Jakarta",
      "address": "Mall Puri Indah Lt. 1 No. 102...",
      "phone": "021-5822650",
      "whatsapp": "081299887711",
      "waNumber": "6281299887711",
      "latitude": -6.1882,
      "longitude": 106.7385,
      "imageUrl": "/uploads/store_puri.jpg"
    }
  ]
}
```

#### `PUT /api/stores/:id`
* **Auth**: HO Admin / Staff
* **Body**: JSON object with updated store fields (`phone`, `managerName`, `imageUrl`, etc.).
* **Side Effect**: Updates `data/stores.json` and syncs with Firestore collection `stores`.

---

### 4. Member Management & Tombstones

#### `GET /api/members`
* **Auth**: Staff / Cashier / Admin
* **Response**: `{ "success": true, "members": [...] }`

#### `GET /api/members/by-phone/:phone`
* **Auth**: Staff / Cashier
* **Params**: `:phone` (e.g. `081903987051` or `6281903987051`)
* **Response**: `{ "success": true, "exists": true, "member": { ... } }`

#### `POST /api/members`
* **Auth**: Cashier or HO Admin
* **Body**:
```json
{
  "name": "Budi Santoso",
  "phone": "081234567890",
  "tier": "SILVER",
  "registeredStore": "Kota Kasablanka Jakarta",
  "email": "budi@example.com"
}
```
* **Response**: `{ "success": true, "member": { "id": "mem_...", "membershipId": "KOKAS0003", ... } }`

#### `PUT /api/members/:id`
* **Auth**: Cashier, HO Admin, or Self Customer (Profile changes)
* **Body**: Updated fields (`email`, `address`, `avatarUrl`, `points`, `tier`).
* **Response**: `{ "success": true, "member": { ... } }`

#### `DELETE /api/members/:id`
* **Auth**: HO Admin
* **Side Effects**:
  1. Deletes record from `data/members.json`.
  2. Deletes document from Firestore `members/:id`.
  3. Appends `:id` to `data/deleted_members.json` (tombstone).
* **Response**: `{ "success": true, "message": "Member deleted successfully", "deletedId": "..." }`

#### `GET /api/members/deleted-ids`
* **Auth**: Public / Internal
* **Response**: `{ "success": true, "deletedIds": ["mem_kokas_0001", ...] }`

---

### 5. Employee Authentication
* **Endpoint**: `ALL /api/auth/employee-login`
* **Body / Query**:
```json
{
  "username": "admin",
  "pin": "wtc26",
  "type": "HO"
}
```
* **Response**:
```json
{
  "success": true,
  "token": "custom-firebase-jwt-or-null",
  "role": "HO_ADMIN",
  "storeId": "ADMIN"
}
```

---

### 6. Atomic Point Issuance & Receipt Validation
* **Endpoint**: `ALL /api/loyalty/add-points`
* **Body**:
```json
{
  "memberId": "mem_kokas_0001",
  "amount": 15000000,
  "receiptNo": "INV-20260921-9981",
  "storeId": "PUR",
  "storeName": "Puri Jakarta",
  "cashierName": "Siti Kasir",
  "memberTier": "SILVER",
  "currentPoints": 857
}
```
* **Validations**:
  1. Checks for existing transaction with same `receiptNo` (Rejects duplicate claims with code 400).
  2. Applies tier multipliers (`PLATINUM` = 1.75x, `GOLD` = 1.25x, `SILVER` / `BLUE` = 1.0x).
  3. Updates member balance, recalculates tier progression, writes immutable `/transactions` entry and `/audit` log entry in a single atomic transaction.
* **Response**:
```json
{
  "success": true,
  "data": {
    "calculatedPoints": 1875,
    "newPoints": 2732,
    "newTier": "SILVER",
    "transactionData": {
      "id": "tx_1789713028123",
      "receiptNo": "INV-20260921-9981",
      "amount": 15000000,
      "pointsDelta": 1875,
      "timestamp": "2026-09-22T02:30:28.123Z"
    }
  }
}
```
