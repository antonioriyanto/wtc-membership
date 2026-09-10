const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const replacement = `
            <ManualPointAdjustmentModal 
              isOpen={isPointAdjustOpen} 
              onClose={() => setIsPointAdjustOpen(false)} 
              members={members} 
              onSubmitAdjustment={async (memberId, pointsDelta, reason) => {
                const member = members.find(m => m.id === memberId || m.membershipId === memberId || m.phone === memberId);
                if (!member) return;

                try {
                  const res = await fetch('/api/transactions', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({
                      memberId: member.id,
                      storeId: 'S-HQ',
                      storeName: 'Head Office',
                      cashierName: 'Superadmin',
                      type: 'MANUAL_ADJUSTMENT',
                      amount: 0,
                      pointsDelta: pointsDelta,
                      notes: reason
                    }) 
                  });

                  if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || \`Status \${res.status}\`);
                  }

                  const data = await res.json();
                  const savedTrx = data.transaction;
                  const updatedMember = data.member;

                  setTransactions(prev => [savedTrx, ...prev]);
                  setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
                  alert('Point adjustment applied successfully.');
                } catch (e: any) {
                  console.error("Error adjusting points:", e);
                  alert("Failed to adjust points: " + e.message);
                }
              }}
            />
`;

content = content.replace(/<ManualPointAdjustmentModal isOpen=\{isPointAdjustOpen\} onClose=\{\(\) => setIsPointAdjustOpen\(false\)\} members=\{members\} \/>/g, replacement.trim());

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Fixed App.tsx ManualPointAdjustmentModal');
