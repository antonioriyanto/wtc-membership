const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const targetImport = `import admin from 'firebase-admin';`;
const newImport = `import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';`;

content = content.replace(targetImport, newImport);

const targetInit = `try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n') : undefined,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

const db = admin.firestore();`;

const newInit = `try {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Ensure literal \\n is converted to actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\\\n/g, '\\n') : undefined,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

const db = getFirestore();`;

content = content.replace(targetInit, newInit);

fs.writeFileSync('server.ts', content);
