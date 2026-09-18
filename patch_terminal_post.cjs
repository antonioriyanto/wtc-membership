const fs = require('fs');
let c = fs.readFileSync('src/components/CashierTerminalView.tsx', 'utf8');

const targetStr = `const params = new URLSearchParams({
          memberId: member.id || '',
          amount: amount.toString(),
          receiptNo: receiptNo || '',
          storeId: currentStore?.id || currentStore?.code || 'PUR',
          storeName: currentStore?.name || 'Puri Jakarta',
          cashierName: cashierName || \`Kasir \${currentStore?.name || 'Aktif'}\`,
          _t: Date.now().toString()
        });

        const response = await fetch('/api/loyalty/add-points?' + params.toString(), {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          },
          credentials: 'same-origin'
        });`;

const newCode = `const response = await fetch('/api/loyalty/add-points', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            memberId: member.id || '',
            amount: amount.toString(),
            receiptNo: receiptNo || '',
            storeId: currentStore?.id || currentStore?.code || 'PUR',
            storeName: currentStore?.name || 'Puri Jakarta',
            cashierName: cashierName || \`Kasir \${currentStore?.name || 'Aktif'}\`
          })
        });`;

c = c.replace(targetStr, newCode);
fs.writeFileSync('src/components/CashierTerminalView.tsx', c);
