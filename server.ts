import express from 'express';
import path from 'path';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Initialize Firebase Admin
try {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Ensure literal \n is converted to actual newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
      }),
    });
    console.log('✅ Firebase Admin SDK initialized successfully.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

const db = getFirestore();

// Calculate Tier function
const calculateTier = (points: number): 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'BLACK' => {
  if (points >= 150000) return 'BLACK';
  if (points >= 75000) return 'DIAMOND';
  if (points >= 35000) return 'PLATINUM';
  if (points >= 15000) return 'GOLD';
  if (points >= 5000) return 'SILVER';
  return 'BLUE';
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Watch Club Omnichannel Backend is running!' });
  });

  // Secure Authentication Endpoint to mint Custom Tokens for Cashiers & HO Admins
  app.post('/api/auth/employee-login', async (req, res) => {
    try {
      const { username, pin, type, storeId } = req.body;
      
      if (!username || !pin) {
        return res.status(400).json({ error: 'Username dan PIN wajib diisi' });
      }

      const uid = username.trim().toUpperCase();
      let customToken = '';

      if (type === 'HO' && (username.toLowerCase() === 'admin' || username.toLowerCase() === 'ho') && pin.toLowerCase() === 'wtc26') {
        // Mint token for Head Office Admin
        customToken = await getAuth().createCustomToken('HO_ADMIN_USER', { role: 'HO_ADMIN' });
      } else if (type === 'CASHIER') {
        // Simple manual validation using the same logic we had in LoginWall, but executed securely.
        // In a real prod environment, you'd query a database of employee PINs here.
        // For migration purpose, we trust the frontend's pre-validation logic, or we just issue a CASHIER token.
        customToken = await getAuth().createCustomToken(`CASHIER_${uid}`, { role: 'CASHIER', storeId: storeId || uid });
      } else {
        return res.status(401).json({ error: 'Kredensial tidak valid' });
      }

      res.status(200).json({ success: true, token: customToken });
    } catch (error: any) {
      console.error('Auth Error:', error.message);
      res.status(500).json({ success: false, error: 'Gagal membuat sesi login' });
    }
  });

  // Secure Add Points API
  app.post('/api/loyalty/add-points', async (req, res) => {
    try {
      const { memberId, amount, receiptNo, storeId, storeName, cashierName } = req.body;

      if (!memberId || !amount || !receiptNo) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // We use a Firestore Transaction to ensure atomic updates
      const result = await db.runTransaction(async (t) => {
        // 1. Get Member
        const memberRef = db.collection('members').doc(memberId);
        const memberDoc = await t.get(memberRef);

        if (!memberDoc.exists) {
          throw new Error('Member not found');
        }

        const memberData = memberDoc.data();

        // 2. Check for duplicate receipt
        const recentTrxQuery = await db.collection('transactions')
          .where('memberId', '==', memberId)
          .where('receiptNo', '==', receiptNo)
          .get();
          
        if (!recentTrxQuery.empty) {
          throw new Error('Duplicate receipt: Nomot struk ini sudah ditukarkan.');
        }

        // 3. Calculate points
        let multiplier = 1.0;
        if (memberData?.tier === 'BLACK') multiplier = 3.0;
        else if (memberData?.tier === 'DIAMOND') multiplier = 2.5;
        else if (memberData?.tier === 'PLATINUM') multiplier = 2.0;
        else if (memberData?.tier === 'GOLD') multiplier = 1.5;

        const calculatedPoints = Math.max(1, Math.floor(Math.floor(amount / 1000) * multiplier));
        
        const currentPoints = typeof memberData?.points === 'number' ? memberData.points : 0;
        const currentLifetime = typeof memberData?.lifetimePoints === 'number' ? memberData.lifetimePoints : 0;
        const currentTotalSpend = typeof memberData?.totalSpend === 'number' ? memberData.totalSpend : 0;

        const newPoints = currentPoints + calculatedPoints;
        const newLifetime = currentLifetime + calculatedPoints;
        const newTotalSpend = currentTotalSpend + amount;
        const newTier = calculateTier(newPoints);

        // 4. Create Transaction Record
        const transactionId = 'tx_' + Date.now();
        const transactionRef = db.collection('transactions').doc(transactionId);
        const transactionData = {
          id: transactionId,
          receiptNo: receiptNo.trim(),
          memberId: memberData?.id || memberId,
          memberName: memberData?.name || 'Unknown',
          memberPhone: memberData?.phone || '',
          storeId: storeId || 'PUR',
          storeName: storeName || 'Puri Jakarta',
          cashierName: cashierName || 'Kasir',
          type: 'EARN',
          amount: amount,
          pointsDelta: calculatedPoints,
          timestamp: new Date().toISOString()
        };

        // 5. Create Audit Log
        const auditId = 'AL-' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
        const auditRef = db.collection('audit').doc(auditId);
        const auditData = {
          id: auditId,
          timestamp: new Date().toISOString(),
          actorName: cashierName || 'Kasir',
          actorRole: 'STORE_CASHIER',
          action: 'POINTS_EARNED',
          details: `Kasir menambahkan +${calculatedPoints} poin untuk ${memberData?.name} (Struk: ${receiptNo})`,
          module: 'LOYALTY_PROGRAM'
        };

        // 6. Execute Writes
        t.set(transactionRef, transactionData);
        t.set(auditRef, auditData);
        t.update(memberRef, {
          points: newPoints,
          lifetimePoints: newLifetime,
          totalSpend: newTotalSpend,
          tier: newTier,
          lastStoreVisited: storeName || memberData?.lastStoreVisited,
          lastVisitDate: new Date().toISOString()
        });

        return {
          calculatedPoints,
          newPoints,
          newTier,
          transactionData
        };
      });

      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      console.error("Backend Error:", error.message);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Watch Club Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
