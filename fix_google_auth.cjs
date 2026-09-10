const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Update Google Sign-In logic to ensure clean ID generation and avoid mock data collision
content = content.replace(
  /const newMember = \{\n\s*id: user\.uid,[\s\S]*?createdAt: new Date\(\)\.toISOString\(\)\n\s*\};/g,
  `// Generate a realistic membership ID instead of using the raw Firebase UID for the UI
                  const shortUid = user.uid.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
                  const membershipId = 'ONL' + shortUid;
                  
                  const newMember = {
                    id: user.uid,
                    membershipId: membershipId, // Added readable membership ID
                    name: user.displayName || 'Google User',
                    phone: user.phoneNumber || '', 
                    email: user.email || '',
                    joinDate: new Date().toISOString().split('T')[0],
                    points: 0,
                    tier: 'BLUE',
                    totalSpent: 0,
                    registeredStore: 'Online',
                    lastStoreVisited: 'Online',
                    createdAt: new Date().toISOString()
                  };`
);

fs.writeFileSync('src/App.tsx', content);

// Also need to update CustomerMemberView to show membershipId instead of raw Firebase UID or hardcoded string
let viewContent = fs.readFileSync('src/components/CustomerMemberView.tsx', 'utf-8');

viewContent = viewContent.replace(
  /<p className="text-sm font-medium tracking-\[0\.2em\] opacity-90">\{member\.membershipId \|\| 'PUR7343'\}<\/p>/g,
  `<p className="text-sm font-medium tracking-[0.2em] opacity-90">{member.membershipId || member.id || 'ONL1001'}</p>`
);

viewContent = viewContent.replace(
  /<span className="font-bold text-slate-700">\{member\.membershipId \|\| 'PUR7343'\}<\/span>/g,
  `<span className="font-bold text-slate-700">{member.membershipId || member.id || 'ONL1001'}</span>`
);

fs.writeFileSync('src/components/CustomerMemberView.tsx', viewContent);

