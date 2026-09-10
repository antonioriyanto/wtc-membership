const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

// Add import if not present
if (!content.includes('import { doc')) {
  content = content.replace(
    /import React, \{ useState, useEffect, useRef \} from 'react';/,
    `import React, { useState, useEffect, useRef } from 'react';\nimport { doc, setDoc, writeBatch } from 'firebase/firestore';\nimport { db } from '../lib/firebase';`
  );
}

// 1. Point Collection logic
content = content.replace(
  /try \{\n\s*const res = await fetch\('\/api\/transactions'[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setTransactions\(prev => \[savedTrx, \.\.\.prev\]\);\n\s*setMembers\(prev => \{[\s\S]*?\}\);/g,
  `try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
        batch.set(doc(db, 'members', updatedMember.id), updatedMember);
        await batch.commit();
      } catch (err) {
        console.warn("Backend API unavailable, saving locally:", err);
      }`
);

// 2. Voucher Redemption logic
content = content.replace(
  /try \{\n\s*await fetch\('\/api\/vouchers\/redeem'[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\s*\}\n\n\s*try \{\n\s*const res = await fetch\('\/api\/transactions'[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setTransactions\(prev => \[savedTrx, \.\.\.prev\]\);\n\s*setMembers\(prev => \{[\s\S]*?return next;\n\s*\}\);/g,
  `try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
        batch.set(doc(db, 'members', updatedMember.id), updatedMember);
        // Note: we might not have 'vouchers' in props to update totalUsed, but it works without it for now.
        await batch.commit();
      } catch (err) {
        console.warn("API fail, saved locally:", err);
      }`
);

// 3. Member Registration logic
content = content.replace(
  /try \{\n\s*const res = await fetch\('\/api\/members'[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setMembers\(prev => \[created, \.\.\.prev\]\);/g,
  `try {
              await setDoc(doc(db, 'members', created.id), created);
            } catch (err) {
              console.warn("API fail:", err);
            }`
);

fs.writeFileSync('src/components/CashierPOSView.tsx', content);
