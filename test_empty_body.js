async function test() {
  const fetch = (await import('node-fetch')).default;
  try {
    const res = await fetch('http://localhost:3000/api/loyalty/add-points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberId: '123',
        amount: 1000,
        receiptNo: 'JL-INV/A/2410/12345',
        storeId: 'PURI',
        storeName: 'Puri',
        cashierName: 'Admin'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error(e);
  }
}
test();
