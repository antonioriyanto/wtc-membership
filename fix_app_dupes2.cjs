const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The file has multiple identical imports scattered around line 16 and 42.
// Let's remove ALL of them, and then add them back ONCE at the top.

content = content.replace(/import \{ doc, getDoc, setDoc, deleteDoc, serverTimestamp \} from 'firebase\/firestore';\n/g, "");
content = content.replace(/import \{ signInWithPopup \} from 'firebase\/auth';\n/g, "");
content = content.replace(/import \{ auth, googleProvider, db \} from '\.\/lib\/firebase';\n/g, "");
content = content.replace(/import \{ db, auth, googleProvider \} from '\.\/lib\/firebase';\n/g, "");

const correctImports = `import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from './lib/firebase';
`;

content = content.replace("import React,", correctImports + "import React,");

fs.writeFileSync('src/App.tsx', content);

let mockContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');
mockContent = mockContent.replace("import { Member, Transaction, SupportTicket, Store, LoyaltyConfig } from '../types';", "import { Member, Transaction, SupportTicket, LoyaltyConfig } from '../types';");
mockContent = mockContent.replace(/currencyToPointRatio: 1000,\n/g, "");
fs.writeFileSync('src/data/mockData.ts', mockContent);

console.log('Fixed dupes');
