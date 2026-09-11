const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace the first line to include writeBatch
content = content.replace(
  "import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';",
  "import { doc, getDoc, setDoc, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';"
);

fs.writeFileSync('src/App.tsx', content);

// Let's completely rewrite the start of mockData to fix it reliably
let mock = fs.readFileSync('src/data/mockData.ts', 'utf-8');
const lines = mock.split('\n');

// Find imports line
const importIdx = lines.findIndex(l => l.includes('import { Member'));
if (importIdx !== -1) {
    lines[importIdx] = "import { Member, Transaction, SupportTicket, StoreBranch, LoyaltyConfig } from '../types';";
}

// Find config
const confIdx = lines.findIndex(l => l.includes('export const LOYALTY_CONFIG'));
if (confIdx !== -1) {
    // Just replace the block
    mock = lines.join('\n');
    mock = mock.replace(/currencyToPointRatio: \d+,/g, "");
    fs.writeFileSync('src/data/mockData.ts', mock);
}

console.log('Fixed writeBatch and mockData');
