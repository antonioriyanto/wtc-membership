const fs = require('fs');
let content = fs.readFileSync('src/components/CashierPOSView.tsx', 'utf-8');

if (!content.includes("import { doc, setDoc }")) {
  content = content.replace("import { CashierTabType } from '../types';", 
    "import { CashierTabType } from '../types';\nimport { doc, setDoc, updateDoc, increment } from 'firebase/firestore';\nimport { db } from '../lib/firebase';");

  content = content.replace(/const \{ doc, setDoc \} = await import\('firebase\/firestore'\);\s*const \{ db \} = await import\('\.\.\/lib\/firebase'\);/g, "");
  content = content.replace(/const \{ doc, updateDoc, increment \} = await import\('firebase\/firestore'\);\s*const \{ db \} = await import\('\.\.\/lib\/firebase'\);/g, "");

  fs.writeFileSync('src/components/CashierPOSView.tsx', content);
  console.log('Fixed CashierPOSView.tsx imports');
}
