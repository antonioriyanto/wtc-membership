# BUSINESS LOGIC & LOYALTY ENGINE
**Document**: `PROJECT_HANDOVER/07_BUSINESS_LOGIC.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Loyalty Tier Rules & Multipliers

* **Source File**: `src/lib/loyalty.ts` & `server.ts:64-77`
* **Default Spending Ratio**: 1 Point for every **IDR 10,000** spent.

| Tier Name | Qualifying Points | Qualifying Spend (Estimate) | Point Earning Multiplier | Special Perks |
|---|---|---|---|---|
| **BLUE** | 0 – 4,999 | Rp 0 – Rp 49,990,000 | **1.0x** | Welcome voucher, digital card |
| **SILVER** | 5,000 – 9,999 | Rp 50,000,000 – Rp 99,990,000 | **1.0x** | 5% service discount, birthday points |
| **GOLD** | 10,000 – 29,999 | Rp 100,000,000 – Rp 299,990,000 | **1.25x** (+25%) | 10% watch straps, free battery replacement |
| **PLATINUM** | ≥ 30,000 | ≥ Rp 300,000,000 | **1.75x** (+75%) | VIP private lounge, complimentary watch polishing, concierge service |

---

## 2. Point Calculation Algorithm

```typescript
export function calculateEarnedPoints(
  amountIdr: number, 
  tier: MemberTier, 
  config?: LoyaltyConfig
): number {
  const unit = config?.amountUnit || 10000;
  const pointsPerUnit = config?.pointsPerAmount || 1;
  const basePoints = Math.floor(amountIdr / unit) * pointsPerUnit;

  let multiplier = 1.0;
  if (tier === 'PLATINUM') multiplier = config?.platinumMultiplier || 1.75;
  else if (tier === 'GOLD') multiplier = config?.goldMultiplier || 1.25;

  return Math.max(0, Math.floor(basePoints * multiplier));
}
```

* **Rounding Rule**: Floored to the nearest integer. Fractional points are not granted.
* **Minimum Spend**: Minimum purchase must meet `amountUnit` (IDR 10,000) to yield points.

---

## 3. Membership ID Sequential Generator

* **Source File**: `src/lib/canonicalMember.ts`
* **Pattern**: `<STORE_PREFIX><SEQUENTIAL_NUMBER>`
  * Example: Kota Kasablanka store (`KOKAS`) -> `KOKAS0001`, `KOKAS0002`...
  * Example: Mall Puri Indah store (`PURI`) -> `PURI0001`, `PURI0002`...
* **Counter Persistence**: Synced in Firestore under `/store_counters/{storeCode}` using Firestore atomic increment counters (`FieldValue.increment(1)`).

---

## 4. Voucher Redemption Constraints

1. **Validity Window**: Valid between `validFrom` and `validUntil` timestamps.
2. **Minimum Purchase**: Receipt total must exceed `minPurchase`.
3. **Store Scope**: Can be scoped to `ALL_STORES` or `applicableStoreIds` (e.g. only valid in Jakarta branches).
4. **Single-Use Enforcement**: When configured with `enableStrictVoucherSingleUse`, the voucher status transitions to `USED` and records member ID & transaction ID.
