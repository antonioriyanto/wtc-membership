const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The white screen is usually a React crash. 
// Let's check for any missing imports, specifically the ones we added in previous fixes (doc, setDoc, writeBatch, auth, db, etc).
// The issue is likely `auth`, `googleProvider`, or `db` not being imported at the top level, 
// OR the Google Sign in logic dynamically importing it inside a component (which can be problematic).

// Let's ensure Firebase is imported properly at the top.
if (!content.includes("import { auth, googleProvider }")) {
  content = content.replace(
    /import \{ db \} from '\.\/lib\/firebase';/,
    `import { db, auth, googleProvider } from './lib/firebase';`
  );
}

// Let's check if the fix_google_auth.cjs introduced a syntax error
// It replaced:
// const newMember = {
//   id: user.uid,
//   ...
// };
// With:
// const shortUid = ...

// The dynamic import inside the onClick handler in App.tsx might be causing a crash if Vercel strips it or it fails to resolve.
// Let's change the dynamic import to a static one or just use the already imported auth.

content = content.replace(
  /const \{ signInWithPopup \} = await import\('firebase\/auth'\);\n\s*const \{ auth, googleProvider, db \} = await import\('\.\/lib\/firebase'\);\n\s*const \{ doc, getDoc, setDoc, serverTimestamp \} = await import\('firebase\/firestore'\);/,
  `const { signInWithPopup } = await import('firebase/auth');
                const { getDoc, serverTimestamp } = await import('firebase/firestore');`
);

fs.writeFileSync('src/App.tsx', content);
