const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  /try \{\s*if \(getApps\(\)\.length === 0\) \{[\s\S]*?const db = getFirestore\(\);/m,
  `let db: any = null;
let adminAuth: any = null;

try {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n'),
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('⚠️ Firebase Admin SDK credentials missing from environment. API routes requiring admin access will fail.');
    }
  }
  if (getApps().length > 0) {
    db = getFirestore();
    adminAuth = getAuth();
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}`
);

fs.writeFileSync('server.ts', content);
