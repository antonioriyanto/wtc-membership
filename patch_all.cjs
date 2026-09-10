const fs = require('fs');

// --- StoresSettingsTab.tsx ---
let storesContent = fs.readFileSync('src/components/StoresSettingsTab.tsx', 'utf-8');

if (!storesContent.includes('import { doc')) {
  storesContent = storesContent.replace(
    /import React, \{ useState, useEffect \} from 'react';/,
    `import React, { useState, useEffect } from 'react';\nimport { doc, setDoc } from 'firebase/firestore';\nimport { db } from '../lib/firebase';`
  );
}

storesContent = storesContent.replace(
  /try \{\n\s*const res = await fetch\('\/api\/stores'[\s\S]*?\} else \{\n\s*setStores\(\[created, \.\.\.stores\]\);\n\s*\}\n\s*\} catch \(err\) \{[\s\S]*?\}/,
  `try {
        await setDoc(doc(db, 'stores', created.id), created);
      } catch (err) {
        console.warn('Firebase error', err);
      }`
);
fs.writeFileSync('src/components/StoresSettingsTab.tsx', storesContent);

// --- CashierPOSView.tsx ---
let cashierContent = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

cashierContent = cashierContent.replace(
  /try \{\n\s*const res = await fetch\('\/api\/transactions', \{\n\s*method: 'POST',[\s\S]*?\}\);[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setTransactions\(prev => \[savedTrx, \.\.\.prev\]\);\n\s*setMembers\(prev => \{[\s\S]*?\}\);/,
  `try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
        batch.set(doc(db, 'members', updatedMember.id), updatedMember);
        await batch.commit();
      } catch (err) {
        console.warn("Backend API unavailable, saving locally:", err);
      }`
);

cashierContent = cashierContent.replace(
  /try \{\n\s*await fetch\('\/api\/vouchers\/redeem'[\s\S]*?\} catch \(e: any\) \{[\s\S]*?\}\n\s*try \{\n\s*const res = await fetch\('\/api\/transactions', \{\n\s*method: 'POST',[\s\S]*?\}\);[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setTransactions\(prev => \[savedTrx, \.\.\.prev\]\);\n\s*setMembers\(prev => \{[\s\S]*?return next;\n\s*\}\);/,
  `try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'transactions', savedTrx.id), savedTrx);
        batch.set(doc(db, 'members', updatedMember.id), updatedMember);
        await batch.commit();
      } catch (err) {
        console.warn("API fail, saved locally:", err);
      }`
);

cashierContent = cashierContent.replace(
  /try \{\n\s*const res = await fetch\('\/api\/members', \{\n\s*method: 'POST',[\s\S]*?\}\);[\s\S]*?\} catch \(err\) \{[\s\S]*?\}\n\n\s*setMembers\(prev => \[created, \.\.\.prev\]\);/,
  `try {
              await setDoc(doc(db, 'members', created.id), created);
            } catch (err) {
              console.warn("API fail:", err);
            }`
);

fs.writeFileSync('src/components/CashierPOSView.tsx', cashierContent);
