const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf-8');

// Ensure firebase imports are present
const firebaseImports = `import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from './lib/firebase';
`;

// Remove any existing partial firebase imports and add the complete one
appContent = appContent.replace(/import \{ doc, getDoc, setDoc, deleteDoc, serverTimestamp \} from 'firebase\/firestore';\n/, "");
appContent = appContent.replace(/import \{ signInWithPopup \} from 'firebase\/auth';\n/, "");
appContent = appContent.replace(/import \{ auth, googleProvider, db \} from '\.\/lib\/firebase';\n/, "");

appContent = appContent.replace("import { StoreTransactionsModal } from './components/StoreTransactionsModal';", firebaseImports + "import { StoreTransactionsModal } from './components/StoreTransactionsModal';");

fs.writeFileSync('src/App.tsx', appContent);

// mockData.ts
let mockContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');
mockContent = mockContent.replace("import { Member, Transaction, SupportTicket, Store, LoyaltyConfig } from '../types';", "import { Member, Transaction, SupportTicket, LoyaltyConfig } from '../types';");
mockContent = mockContent.replace("currencyToPointRatio: 1000,", "");
fs.writeFileSync('src/data/mockData.ts', mockContent);

console.log('Fixed imports and mockData');
