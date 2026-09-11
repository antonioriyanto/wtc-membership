const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const target = `import { AdminLogin, MemberLogin } from './components/LoginWall';`;
const replacement = `import { AdminLogin, MemberLogin } from './components/LoginWall';
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, db } from './lib/firebase';`;

if (!content.includes('import { doc, getDoc')) {
  content = content.replace(target, replacement);
  fs.writeFileSync('src/App.tsx', content);
}
