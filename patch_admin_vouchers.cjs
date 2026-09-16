const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const target = `                {activeTab === 'vouchers' && (
                  <VouchersTab 
                    vouchers={vouchers} 
                    stores={stores}`;

const replacement = `                {activeTab === 'vouchers' && (
                  <VouchersTab 
                    vouchers={vouchers} 
                    transactions={transactions}
                    stores={stores}`;

content = content.replace(target, replacement);
fs.writeFileSync('src/App.tsx', content);
