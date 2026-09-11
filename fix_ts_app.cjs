const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Fix duplicate imports
content = content.replace("import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';\nimport { signInWithPopup } from 'firebase/auth';\nimport { auth, googleProvider, db } from './lib/firebase';\n", "");
content = content.replace("import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';\nimport { db, auth, googleProvider } from './lib/firebase';\n", "");
content = content.replace("import { StoreTransactionsModal } from './components/StoreTransactionsModal';", "import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';\nimport { signInWithPopup } from 'firebase/auth';\nimport { auth, googleProvider, db } from './lib/firebase';\nimport { StoreTransactionsModal } from './components/StoreTransactionsModal';");

// Fix calculateTier
if (!content.includes("import { calculateTier }")) {
    content = content.replace("import { StoreTransactionsModal }", "import { calculateTier } from './lib/loyalty';\nimport { StoreTransactionsModal }");
}

fs.writeFileSync('src/App.tsx', content);
console.log('Fixed App.tsx imports');
