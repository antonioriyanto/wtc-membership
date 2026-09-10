async function test() {
  const reqBody = {
    code: 'TESTCODE123',
    title: 'Test Voucher',
    subtitle: 'Exclusive Member Reward Voucher',
    discountType: 'PERCENTAGE',
    discountValue: 20,
    minPurchase: 1500000,
    validFrom: new Date().toISOString().slice(0, 10),
    validUntil: '2026-12-31',
    scope: 'ALL_STORES',
    applicableStoreIds: [],
    maxUsageLimit: 1000,
    status: 'ACTIVE',
    terms: ['Valid at Watch Club stores throughout Indonesia.']
  };

  try {
    const res = await fetch('http://localhost:3000/api/vouchers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response:", data);
  } catch (e) {
    console.error(e);
  }
}

test();
