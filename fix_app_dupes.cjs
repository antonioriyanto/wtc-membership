const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Using regex to remove duplicate imports block
content = content.replace(/import \{ doc, getDoc, setDoc, deleteDoc, serverTimestamp \} from 'firebase\/firestore';\nimport \{ signInWithPopup \} from 'firebase\/auth';\nimport \{ auth, googleProvider, db \} from '\.\/lib\/firebase';\n/, "");
fs.writeFileSync('src/App.tsx', content);

let modalContent = fs.readFileSync('src/components/CreateMemberModal.tsx', 'utf-8');
modalContent = modalContent.replace(/if \(!code && typeof storeCodeMap !== 'undefined'\) \{ code = storeCodeMap\[registeredStore\.toLowerCase\(\)\] \|\| 'PUR'; \}/, "");
fs.writeFileSync('src/components/CreateMemberModal.tsx', modalContent);

let mockContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');
mockContent = mockContent.replace("import { Member, Transaction, SupportTicket, Store, LoyaltyConfig } from '../types';", "import { Member, Transaction, SupportTicket, LoyaltyConfig } from '../types';");
mockContent = mockContent.replace("currencyToPointRatio: 1000,", "");
fs.writeFileSync('src/data/mockData.ts', mockContent);

console.log('Fixed remaining TS errors');
