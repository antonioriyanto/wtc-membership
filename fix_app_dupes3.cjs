const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove any line that imports from 'firebase/firestore'
let lines = content.split('\n');
lines = lines.filter(line => !line.includes("from 'firebase/firestore'") && !line.includes('from "firebase/firestore"'));

// Prepend exactly one
lines.unshift("import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';");

fs.writeFileSync('src/App.tsx', lines.join('\n'));

let mockContent = fs.readFileSync('src/data/mockData.ts', 'utf-8');
mockContent = mockContent.replace(/import \{ Member, Transaction, SupportTicket, Store, LoyaltyConfig \} from '\.\.\/types';/g, "import { Member, Transaction, SupportTicket, LoyaltyConfig } from '../types';");
mockContent = mockContent.replace(/currencyToPointRatio: 1000,/g, "");
fs.writeFileSync('src/data/mockData.ts', mockContent);

console.log('Fixed dupes completely');
