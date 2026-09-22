# EXTERNAL INTEGRATIONS
**Document**: `PROJECT_HANDOVER/09_INTEGRATIONS.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Integrations Inventory

| Service | Provider | Purpose | Implementation File | Status |
|---|---|---|---|---|
| **Cloud Firestore** | Google Firebase | Real-time member profiles, POS transactions, live store directory | `src/lib/firebase.ts`, `server.ts` | ACTIVE / VERIFIED |
| **Firebase Auth & Google SSO** | Google Firebase | Customer Google Single Sign-On & Admin Custom Tokens | `src/lib/firebase.ts`, `server.ts` | ACTIVE / VERIFIED |
| **Gemini AI API** | Google DeepMind | Server-side intelligent loyalty recommendations & analytics | `server.ts` via `@google/genai` | ACTIVE / VERIFIED |
| **PostgreSQL Database** | Generic / Cloud SQL | Relational backup & SQL analytics | `src/db/index.ts`, `src/db/schema.ts` | CONFIGURED (Optional) |
| **Web Geolocation API** | W3C Standard | Customer proximity to 42 stores | `src/components/CustomerMemberView.tsx` | ACTIVE / VERIFIED |
| **WhatsApp Direct Messaging** | Meta / WhatsApp Web | Direct customer boutique concierge chat | `src/components/StoreCard.tsx` | ACTIVE / VERIFIED |
| **Camera Barcode / QR** | HTML5 QR Code | POS hardware barcode / QR scanning | `src/components/CashierTab.tsx` | ACTIVE / VERIFIED |

---

## 2. WhatsApp Boutique Chat Deep-Link Specification

* **Protocol**: URL Scheme `https://wa.me/<PHONE_DIGITS>?text=<ENCODED_MESSAGE>`
* **Number Normalization**: Automatically converts local `08...` numbers to international Indonesian format `628...`.
* **Sample Payload**:
```typescript
const waUrl = `https://wa.me/${store.waNumber}?text=${encodeURIComponent(
  `Halo Watch Club ${store.name}, saya member loyalty ingin menanyakan ketersediaan koleksi jam tangan.`
)}`;
```
