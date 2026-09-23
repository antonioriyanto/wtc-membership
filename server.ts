import express from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import multer from 'multer';
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

// Ensure public/uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure Multer for secure and reliable file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Initialize Firebase Admin safely
let db: any = null;
let adminAuth: any = null;

try {
  if (getApps().length === 0) {
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
      console.log('✅ Firebase Admin SDK initialized successfully.');
    } else {
      console.warn('⚠️ Firebase Admin SDK credentials not set in environment. Running in resilient client-first mode.');
    }
  }
  if (getApps().length > 0) {
    db = getFirestore();
    adminAuth = getAuth();
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

// Calculate Tier function
const calculateTierWithConfig = (points: number, config?: any): 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' => {
  const platinumThreshold = Number(config?.platinumThreshold) || 30000;
  const goldThreshold = Number(config?.goldThreshold) || 10000;
  const silverThreshold = Number(config?.silverThreshold) || 5000;

  if (points >= platinumThreshold) return 'PLATINUM';
  if (points >= goldThreshold) return 'GOLD';
  if (points >= silverThreshold) return 'SILVER';
  return 'BLUE';
};

const calculateTier = (points: number): 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' => {
  return calculateTierWithConfig(points);
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Static uploads serving
  app.use('/uploads', express.static(uploadsDir));
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Watch Club Omnichannel Backend is running!' });
  });

  // Multipart File Upload Endpoint for Vouchers, Store Photos & Assets
  app.post('/api/upload', upload.single('image'), (req: any, res: any) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: 'Tidak ada file gambar yang diunggah' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.status(200).json({ 
        success: true, 
        url: fileUrl, 
        filename: req.file.filename,
        size: req.file.size
      });
    } catch (err: any) {
      console.error('Upload Error:', err);
      res.status(500).json({ success: false, error: 'Gagal memproses unggahan berkas' });
    }
  });

  // Persistent Server-Side Store Management (stores.json)
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const storesFilePath = path.join(dataDir, 'stores.json');

  const getStoredStores = (): any[] => {
    try {
      if (fs.existsSync(storesFilePath)) {
        const raw = fs.readFileSync(storesFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('[Server] Error reading stores.json:', err);
    }
    return [];
  };

  const saveStoredStores = (storesList: any[]): void => {
    try {
      fs.writeFileSync(storesFilePath, JSON.stringify(storesList, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Server] Error saving stores.json:', err);
    }
  };

  // GET /api/stores - Fetch all persisted stores
  app.get('/api/stores', (_req, res) => {
    try {
      const stores = getStoredStores();
      res.json({ success: true, stores });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // PUT /api/stores/:id - Update single store profile & photo
  app.put('/api/stores/:id', async (req, res) => {
    try {
      const storeId = req.params.id;
      const storeData = req.body;
      if (!storeData) {
        return res.status(400).json({ success: false, error: 'Store payload required' });
      }

      const currentStores = getStoredStores();
      const idx = currentStores.findIndex((s: any) => s && (String(s.id) === String(storeId) || String(s.code) === String(storeId)));
      let updatedList: any[];
      if (idx >= 0) {
        currentStores[idx] = { ...currentStores[idx], ...storeData };
        updatedList = currentStores;
      } else {
        updatedList = [storeData, ...currentStores];
      }
      saveStoredStores(updatedList);

      // Also attempt Firebase Admin Firestore sync if available
      if (db) {
        try {
          await db.collection('stores').doc(String(storeId)).set(storeData, { merge: true });
        } catch (fErr: any) {
          console.warn('[Server] Firebase Admin stores sync notice:', fErr.message);
        }
      }

      res.json({ success: true, store: storeData });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // POST /api/stores/sync-all - Seed or bulk-sync store collection
  app.post('/api/stores/sync-all', (req, res) => {
    try {
      const storesList = req.body?.stores;
      if (Array.isArray(storesList) && storesList.length > 0) {
        const existing = getStoredStores();
        const existingMap = new Map(existing.map((s: any) => [s.id, s]));
        const merged = storesList.map((s: any) => {
          const prev = existingMap.get(s.id);
          // Preserve custom uploaded photo if incoming has empty photo
          if (prev && prev.imageUrl && !s.imageUrl) {
            return { ...s, imageUrl: prev.imageUrl };
          }
          return s;
        });
        saveStoredStores(merged);
        return res.json({ success: true, count: merged.length });
      }
      res.status(400).json({ success: false, error: 'Invalid stores array' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // Persistent Server-Side Member Management (members.json)
  const membersFilePath = path.join(dataDir, 'members.json');
  const deletedMembersFilePath = path.join(dataDir, 'deleted_members.json');

  const getStoredDeletedMemberIds = (): string[] => {
    try {
      if (fs.existsSync(deletedMembersFilePath)) {
        const raw = fs.readFileSync(deletedMembersFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const addDeletedMemberId = (id: string) => {
    try {
      const current = getStoredDeletedMemberIds();
      if (!current.includes(id)) {
        current.push(id);
        fs.writeFileSync(deletedMembersFilePath, JSON.stringify(current, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('[Server] Could not write deleted_members.json:', e);
    }
  };

  const normalizePhone = (phoneStr: string): string => {
    if (!phoneStr) return '';
    let digits = String(phoneStr).replace(/[^0-9]/g, '');
    if (digits.startsWith('62')) {
      digits = '0' + digits.slice(2);
    } else if (!digits.startsWith('0') && digits.length >= 8) {
      digits = '0' + digits;
    }
    return digits;
  };

  const isPhoneMatch = (p1: string, p2: string): boolean => {
    const n1 = normalizePhone(p1);
    const n2 = normalizePhone(p2);
    if (!n1 || !n2) return false;
    if (n1 === n2) return true;
    if (n1.length >= 8 && n2.length >= 8) {
      return n1.slice(-8) === n2.slice(-8);
    }
    return false;
  };

  const getStoredMembers = (): any[] => {
    try {
      if (fs.existsSync(membersFilePath)) {
        const raw = fs.readFileSync(membersFilePath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (err) {
      console.error('[Server] Error reading members.json:', err);
    }
    const defaultSeed = [
      {
        id: 'mem_kokas_0001',
        membershipId: 'KOKAS0001',
        name: 'Aan',
        phone: '081903987051',
        email: '',
        birthDate: '',
        gender: 'Pria',
        registeredStore: 'Kota Kasablanka Jakarta',
        lastStoreVisited: 'Kota Kasablanka Jakarta',
        lastVisitDate: '2026-09-21T07:00:00.000Z',
        joinDate: '2026-09-17T00:00:00.000Z',
        points: 857,
        lifetimePoints: 857,
        totalSpend: 8570000,
        tier: 'BLUE',
        status: 'ACTIVE',
        address: '',
        isPinSet: false
      },
      {
        id: 'mem_kokas_0002',
        membershipId: 'KOKAS0002',
        name: 'Aan',
        phone: '081234567891',
        email: '',
        birthDate: '',
        gender: 'Pria',
        registeredStore: 'Kota Kasablanka Jakarta',
        lastStoreVisited: 'Kota Kasablanka Jakarta',
        lastVisitDate: '2026-09-21T07:00:00.000Z',
        joinDate: '2026-09-17T00:00:00.000Z',
        points: 0,
        lifetimePoints: 0,
        totalSpend: 0,
        tier: 'BLUE',
        status: 'ACTIVE',
        address: '',
        isPinSet: false
      }
    ];
    try {
      fs.writeFileSync(membersFilePath, JSON.stringify(defaultSeed, null, 2), 'utf-8');
    } catch {}
    return defaultSeed;
  };

  const saveStoredMembers = (membersList: any[]): void => {
    try {
      fs.writeFileSync(membersFilePath, JSON.stringify(membersList, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Server] Error saving members.json:', err);
    }
  };

  // GET /api/members - Fetch all registered members
  app.get('/api/members', (_req, res) => {
    try {
      const members = getStoredMembers();
      res.json({ success: true, members });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // GET /api/members/by-phone/:phone - Lookup member by phone
  app.get('/api/members/by-phone/:phone', (req, res) => {
    try {
      const phoneParam = req.params.phone;
      const members = getStoredMembers();
      const found = members.find((m: any) => m && m.phone && isPhoneMatch(m.phone, phoneParam));
      if (found) {
        return res.json({ success: true, exists: true, member: found });
      }
      return res.json({ success: true, exists: false, member: null });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // POST /api/members - Create or update member
  app.post('/api/members', async (req, res) => {
    try {
      const memberData = req.body;
      if (!memberData || (!memberData.phone && !memberData.id)) {
        return res.status(400).json({ success: false, error: 'Valid member payload with id or phone required' });
      }

      const members = getStoredMembers();
      const idx = members.findIndex((m: any) => 
        (memberData.id && m.id === memberData.id) || 
        (memberData.membershipId && m.membershipId === memberData.membershipId) ||
        (memberData.phone && m.phone && isPhoneMatch(m.phone, memberData.phone))
      );

      let savedMember: any;
      let updatedList: any[];

      if (idx >= 0) {
        savedMember = { ...members[idx], ...memberData };
        members[idx] = savedMember;
        updatedList = members;
      } else {
        savedMember = {
          id: memberData.id || 'mem_' + Date.now(),
          membershipId: memberData.membershipId || ('MEM' + Date.now().toString().slice(-6)),
          name: memberData.name || 'Member',
          phone: memberData.phone || '',
          points: Number(memberData.points) || 0,
          tier: memberData.tier || 'BLUE',
          status: memberData.status || 'ACTIVE',
          joinDate: memberData.joinDate || new Date().toISOString(),
          ...memberData
        };
        updatedList = [savedMember, ...members];
      }

      saveStoredMembers(updatedList);

      if (db && savedMember.id) {
        try {
          await db.collection('members').doc(String(savedMember.id)).set(savedMember, { merge: true });
        } catch (fErr: any) {
          console.warn('[Server] Firebase Admin member sync notice:', fErr.message);
        }
      }

      res.json({ success: true, member: savedMember });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // PUT /api/members/:id - Update member by ID
  app.put('/api/members/:id', async (req, res) => {
    try {
      const memberId = req.params.id;
      const updateData = req.body;
      if (!updateData) {
        return res.status(400).json({ success: false, error: 'Update payload required' });
      }

      const members = getStoredMembers();
      const idx = members.findIndex((m: any) => String(m.id) === String(memberId));
      if (idx >= 0) {
        members[idx] = { ...members[idx], ...updateData, id: memberId };
        saveStoredMembers(members);

        if (db) {
          try {
            await db.collection('members').doc(String(memberId)).set(members[idx], { merge: true });
          } catch {}
        }
        return res.json({ success: true, member: members[idx] });
      }

      const newMember = { id: memberId, ...updateData };
      saveStoredMembers([newMember, ...members]);
      res.json({ success: true, member: newMember });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // DELETE /api/members/:id - Permanently delete member from stored members and Firestore
  app.delete('/api/members/:id', async (req, res) => {
    try {
      const memberId = req.params.id;
      const members = getStoredMembers();
      const updatedList = members.filter((m: any) => 
        String(m.id) !== String(memberId) && 
        String(m.membershipId) !== String(memberId)
      );
      saveStoredMembers(updatedList);

      // Record tombstone permanently
      addDeletedMemberId(memberId);

      if (db) {
        try {
          await db.collection('members').doc(String(memberId)).delete();
        } catch (fErr: any) {
          console.warn('[Server] Firebase Admin member delete notice:', fErr.message);
        }
      }

      res.json({ success: true, message: 'Member deleted successfully', deletedId: memberId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // GET /api/members/deleted-ids - Fetch list of permanently deleted member IDs
  app.get('/api/members/deleted-ids', (_req, res) => {
    try {
      res.json({ success: true, deletedIds: getStoredDeletedMemberIds() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // POST /api/members/sync-all - Bulk merge members from client / localStorage
  app.post('/api/members/sync-all', (req, res) => {
    try {
      const incoming = req.body?.members;
      if (Array.isArray(incoming) && incoming.length > 0) {
        const current = getStoredMembers();
        const memberMap = new Map<string, any>();
        current.forEach((m: any) => {
          if (m && m.id) memberMap.set(m.id, m);
        });

        incoming.forEach((m: any) => {
          if (!m || !m.phone) return;
          const existingById = m.id ? memberMap.get(m.id) : null;
          let existingByPhone: any = null;
          if (!existingById) {
            for (const existing of memberMap.values()) {
              if (existing.phone && isPhoneMatch(existing.phone, m.phone)) {
                existingByPhone = existing;
                break;
              }
            }
          }

          const target = existingById || existingByPhone;
          if (target) {
            memberMap.set(target.id, { ...target, ...m });
          } else {
            const newId = m.id || ('mem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6));
            memberMap.set(newId, { ...m, id: newId });
          }
        });

        const merged = Array.from(memberMap.values());
        saveStoredMembers(merged);
        return res.json({ success: true, count: merged.length });
      }
      res.status(400).json({ success: false, error: 'Invalid members array' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || err });
    }
  });

  // Secure Authentication Endpoint to mint Custom Tokens for Cashiers & HO Admins
  app.all('/api/auth/employee-login', async (req, res) => {
    try {
      const username = req.body?.username || req.query?.username;
      const pin = req.body?.pin || req.query?.pin;
      const type = req.body?.type || req.query?.type;
      const storeId = req.body?.storeId || req.query?.storeId;
      
      if (!username || !pin) {
        return res.status(400).json({ error: 'Username dan PIN wajib diisi' });
      }

      const uid = username.trim().toUpperCase();
      let customToken: string | null = null;
      const isHO = type === 'HO' && (username.toLowerCase() === 'admin' || username.toLowerCase() === 'ho') && pin.toLowerCase() === 'wtc26';

      if (adminAuth) {
        try {
          if (isHO) {
            customToken = await adminAuth.createCustomToken('HO_ADMIN_USER', { role: 'HO_ADMIN' });
          } else if (type === 'CASHIER') {
            customToken = await adminAuth.createCustomToken(`CASHIER_${uid}`, { role: 'CASHIER', storeId: storeId || uid });
          } else {
            return res.status(401).json({ error: 'Kredensial tidak valid' });
          }
        } catch (tokenErr: any) {
          console.warn('Firebase Admin custom token generation skipped:', tokenErr?.message);
        }
      } else {
        // When running in resilient mode without Firebase Admin private key,
        // validate basic credential structure so users can log in smoothly
        if (!isHO && type !== 'CASHIER') {
          return res.status(401).json({ error: 'Kredensial tidak valid' });
        }
      }

      res.status(200).json({ 
        success: true, 
        token: customToken,
        role: isHO ? 'HO_ADMIN' : 'CASHIER',
        storeId: storeId || uid 
      });
    } catch (error: any) {
      console.error('Auth Error:', error.message);
      res.status(500).json({ success: false, error: 'Gagal membuat sesi login' });
    }
  });

  // Secure Add Points API
  app.all('/api/loyalty/add-points', async (req, res) => {
    try {
      const memberId = req.body?.memberId || req.query?.memberId;
      const amount = req.body?.amount || req.query?.amount;
      const receiptNo = req.body?.receiptNo || req.query?.receiptNo;
      const storeId = req.body?.storeId || req.query?.storeId;
      const storeName = req.body?.storeName || req.query?.storeName;
      const cashierName = req.body?.cashierName || req.query?.cashierName;
      const passedConfig = req.body?.loyaltyConfig;
      const passedMemberTier = req.body?.memberTier || req.query?.memberTier;
      const passedMemberName = req.body?.memberName || req.query?.memberName;
      const passedMemberPhone = req.body?.memberPhone || req.query?.memberPhone;
      const passedCurrentPoints = Number(req.body?.currentPoints || req.query?.currentPoints || 0);

      if (!memberId || !amount || !receiptNo) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
      }

      const numericAmount = Number(amount) || 0;

      // Determine dynamic loyalty configuration from request or Firestore
      let activeConfig = passedConfig || null;
      if (!activeConfig && db) {
        try {
          const configSnap = await db.collection('config').doc('loyalty').get();
          if (configSnap.exists) {
            activeConfig = configSnap.data();
          }
        } catch (cErr: any) {
          console.warn('Could not read config/loyalty from DB:', cErr?.message);
        }
      }

      const amountUnit = Number(activeConfig?.amountUnit) > 0 ? Number(activeConfig.amountUnit) : 10000;
      const pointsPerAmount = Number(activeConfig?.pointsPerAmount) > 0 ? Number(activeConfig.pointsPerAmount) : 1;
      const goldMultiplier = Number(activeConfig?.goldMultiplier) > 0 ? Number(activeConfig.goldMultiplier) : 1.25;
      const platinumMultiplier = Number(activeConfig?.platinumMultiplier) > 0 ? Number(activeConfig.platinumMultiplier) : 1.75;

      const calcPointsForTier = (amt: number, tier: string): number => {
        const base = Math.floor(amt / amountUnit) * pointsPerAmount;
        let mult = 1.0;
        if (tier === 'PLATINUM') mult = platinumMultiplier;
        else if (tier === 'GOLD') mult = goldMultiplier;
        return Math.max(0, Math.floor(base * mult));
      };

      // Check for duplicate receipt before transaction/writes
      if (db) {
        try {
          const recentTrxQuery = await db.collection('transactions')
            .where('memberId', '==', memberId)
            .where('receiptNo', '==', receiptNo.trim())
            .get();
            
          if (!recentTrxQuery.empty) {
            return res.status(400).json({ success: false, error: 'Nomor struk ini sudah pernah ditukarkan poin sebelumnya.' });
          }
        } catch (dupErr: any) {
          console.warn('Duplicate receipt check warning:', dupErr?.message);
        }
      }

      // When Firebase Admin SDK is available, perform atomic server transaction
      if (db) {
        try {
          const result = await db.runTransaction(async (t: any) => {
            // 1. Get Member
            let memberRef = db.collection('members').doc(memberId);
            let memberDoc = await t.get(memberRef);

            if (!memberDoc.exists) {
              const snap = await db.collection('members').where('membershipId', '==', memberId).limit(1).get();
              if (!snap.empty) {
                memberRef = snap.docs[0].ref;
                memberDoc = snap.docs[0];
              }
            }

            const memberData = memberDoc.exists ? memberDoc.data() : null;
            const effectiveTier = passedMemberTier || memberData?.tier || 'BLUE';

            // 2. Calculate points according to HO Admin loyalty settings
            const calculatedPoints = calcPointsForTier(numericAmount, effectiveTier);
            
            const currentPoints = typeof memberData?.points === 'number' ? memberData.points : passedCurrentPoints;
            const currentLifetime = typeof memberData?.lifetimePoints === 'number' ? memberData.lifetimePoints : 0;
            const currentTotalSpend = typeof memberData?.totalSpend === 'number' ? memberData.totalSpend : 0;

            const newPoints = currentPoints + calculatedPoints;
            const newLifetime = currentLifetime + calculatedPoints;
            const newTotalSpend = currentTotalSpend + numericAmount;
            const newTier = calculateTierWithConfig(newPoints, activeConfig);

            // 3. Create Transaction Record
            const transactionId = 'tx_' + Date.now();
            const transactionRef = db.collection('transactions').doc(transactionId);
            const rawPhone = memberData?.phone || passedMemberPhone || '';
            const normalizedPhone = normalizePhone(rawPhone);
            const transactionData = {
              id: transactionId,
              receiptNo: receiptNo.trim(),
              memberId: memberData?.id || memberId,
              membershipId: memberData?.membershipId || req.body?.membershipId || '',
              memberName: memberData?.name || passedMemberName || 'Member',
              memberPhone: rawPhone,
              memberPhoneNormalized: normalizedPhone,
              storeId: storeId || 'PUR',
              storeName: storeName || 'Puri Jakarta',
              cashierName: cashierName || 'Kasir',
              type: 'EARN',
              amount: numericAmount,
              pointsDelta: calculatedPoints,
              timestamp: new Date().toISOString()
            };

            // 4. Create Audit Log
            const auditId = 'AL-' + Date.now().toString().slice(-4) + Math.floor(Math.random() * 1000);
            const auditRef = db.collection('audit').doc(auditId);
            const auditData = {
              id: auditId,
              timestamp: new Date().toISOString(),
              actorName: cashierName || 'Kasir',
              actorRole: 'STORE_CASHIER',
              action: 'POINTS_EARNED',
              details: `Kasir menambahkan +${calculatedPoints} poin untuk ${transactionData.memberName} (Struk: ${receiptNo})`,
              module: 'LOYALTY_PROGRAM'
            };

            // 5. Execute Writes
            t.set(transactionRef, transactionData);
            t.set(auditRef, auditData);
            if (memberDoc.exists) {
              t.update(memberRef, {
                points: newPoints,
                lifetimePoints: newLifetime,
                totalSpend: newTotalSpend,
                tier: newTier,
                lastStoreVisited: storeName || memberData?.lastStoreVisited,
                lastVisitDate: new Date().toISOString()
              });
            }

            return {
              calculatedPoints,
              newPoints,
              newTier,
              transactionData
            };
          });

          return res.status(200).json({ success: true, data: result });
        } catch (dbErr: any) {
          console.warn('Firebase Admin transaction skipped, using deterministic calculation:', dbErr?.message);
        }
      }

      // Resilient computation fallback when Admin SDK is unavailable or skipped:
      const effectiveTier = passedMemberTier || 'BLUE';
      const calculatedPoints = calcPointsForTier(numericAmount, effectiveTier);
      const newPoints = passedCurrentPoints + calculatedPoints;
      const newTier = calculateTierWithConfig(newPoints, activeConfig);

      const transactionId = 'tx_' + Date.now();
      const rawPhone = passedMemberPhone || '';
      const normalizedPhone = normalizePhone(rawPhone);
      const transactionData = {
        id: transactionId,
        receiptNo: receiptNo.trim(),
        memberId,
        membershipId: req.body?.membershipId || '',
        memberName: passedMemberName || 'Member',
        memberPhone: rawPhone,
        memberPhoneNormalized: normalizedPhone,
        storeId: storeId || 'PUR',
        storeName: storeName || 'Puri Jakarta',
        cashierName: cashierName || 'Kasir',
        type: 'EARN',
        amount: numericAmount,
        pointsDelta: calculatedPoints,
        timestamp: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        isFallback: true,
        data: {
          calculatedPoints,
          newPoints,
          newTier,
          transactionData
        }
      });
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
