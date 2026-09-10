import { calculateTier, calculateEarnedPoints } from "./src/lib/loyalty.ts";
import express from 'express';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index.ts';
import { stores, members, vouchers, transactions, auditLogs, loyaltyConfig, campaigns, supportTickets } from './src/db/schema.ts';
import { eq, desc, or, ilike } from 'drizzle-orm';
import { logger } from './src/lib/logger.ts';
import rateLimit from 'express-rate-limit';
import { getAuth } from 'firebase-admin/auth';
import { getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';



if (!getApps().length) {
  try {
    initializeApp({ credential: applicationDefault() });
  } catch (e) {
    logger.warn({ err: e }, 'Firebase Admin initialization failed. Auth middleware will block requests if enforced.');
  }
}

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  
  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    logger.warn({ error: error.message }, 'Unauthorized access attempt');
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Forbidden: No role assigned' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};

const transactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 transaction requests per windowMs
  message: { error: 'Too many transactions created from this IP, please try again after a minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Setup Multer for image uploads
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanExt = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + cleanExt);
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// API Endpoint for image upload with comprehensive error catching
app.post('/api/upload', (req, res) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      logger.error({ err }, 'Multer upload error:');
      return res.status(400).json({ 
        error: err.message || 'Gagal memproses unggahan file gambar' 
      });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada berkas gambar yang dipilih' });
    }
    // Return the path that the frontend can use to load the image
    res.json({ 
      url: `/uploads/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size
    });
  });
});

// Serve the uploads directory statically
app.use('/uploads', express.static(uploadDir));

// API Endpoints
app.get('/api/stores', async (req, res) => {
  try {
    const allStores = await db.select().from(stores);
    res.json(allStores);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.get('/api/members', async (req, res) => {
  try {
    const allMembers = await db.select().from(members).orderBy(desc(members.joinDate));
    res.json(allMembers);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.post('/api/members', async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Clean string fields
    if (data.phone) data.phone = String(data.phone).trim();
    if (data.name) data.name = String(data.name).trim();
    if (data.email) data.email = String(data.email).trim() || null;
    if (data.address) data.address = String(data.address).trim() || null;

    if (!data.name || !data.phone) {
      return res.status(400).json({ error: 'Nama dan nomor telepon wajib diisi.' });
    }

    // Check if member with this phone already exists
    const existingByPhone = await db.select().from(members).where(eq(members.phone, data.phone)).limit(1);
    if (existingByPhone.length > 0) {
      const existing = existingByPhone[0];
      const updateData: any = {
        name: data.name || existing.name,
        email: data.email !== undefined ? data.email : existing.email,
        gender: data.gender || existing.gender,
        registeredStore: data.registeredStore || existing.registeredStore,
        status: 'ACTIVE'
      };
      if (data.birthDate) {
        updateData.birthDate = new Date(data.birthDate);
      }
      if (data.address) {
        updateData.address = data.address;
      }
      const updated = await db.update(members)
        .set(updateData)
        .where(eq(members.id, existing.id))
        .returning();
      return res.json(updated[0]);
    }
    
    // If id is not a valid UUID, strip it so defaultRandom() generates one
    if (data.id && (typeof data.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id))) {
      delete data.id;
    }
    
    // Auto-generate membershipId if not provided
    if (!data.membershipId) {
      data.membershipId = 'MBR-' + Math.floor(100000 + Math.random() * 900000);
    }
    
    // Date fields handling
    if (data.joinDate) data.joinDate = new Date(data.joinDate);
    else data.joinDate = new Date();

    if (data.birthDate) data.birthDate = new Date(data.birthDate);
    else delete data.birthDate;

    if (data.lastVisitDate) data.lastVisitDate = new Date(data.lastVisitDate);
    else delete data.lastVisitDate;

    // Schema required defaults
    data.registeredStore = data.registeredStore || data.store || 'Puri Jakarta';
    data.lastStoreVisited = data.lastStoreVisited || data.registeredStore;
    data.gender = data.gender || 'Pria';
    data.tier = data.tier || 'BLUE';
    data.points = Number(data.points) || 0;
    data.lifetimePoints = Number(data.lifetimePoints ?? data.points ?? 0);
    data.totalSpend = Number(data.totalSpend ?? data.totalSpent ?? 0);
    delete data.totalSpent;
    data.status = data.status || 'ACTIVE';

    const newMember = await db.insert(members).values(data).returning();
    res.json(newMember[0]);
  } catch (err: any) {
    logger.error({ err }, 'POST /api/members error:');
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.put('/api/members/:id', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      gender, 
      address, 
      birthDate, 
      status, 
      registeredStore,
      tier,
      points,
      lifetimePoints,
      totalSpend
    } = req.body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).trim() || null;
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (gender !== undefined) updateData.gender = gender;
    if (address !== undefined) updateData.address = String(address).trim() || null;
    if (status !== undefined) updateData.status = status;
    if (registeredStore !== undefined) updateData.registeredStore = registeredStore;
    if (tier !== undefined) updateData.tier = tier;
    if (points !== undefined) updateData.points = Number(points);
    if (lifetimePoints !== undefined) updateData.lifetimePoints = Number(lifetimePoints);
    if (totalSpend !== undefined) updateData.totalSpend = Number(totalSpend);
    
    if (birthDate) {
      updateData.birthDate = new Date(birthDate);
    }
    
    const updated = await db.update(members)
      .set(updateData)
      .where(eq(members.id, req.params.id))
      .returning();
      
    if (updated.length > 0) {
      res.json(updated[0]);
    } else {
      res.status(404).json({ error: "Member not found" });
    }
  } catch (err: any) {
    logger.error({ err }, 'PUT /api/members/:id error:');
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.delete('/api/members/:id', async (req, res) => {
  try {
    const deleted = await db.delete(members)
      .where(eq(members.id, req.params.id))
      .returning();
      
    if (deleted.length > 0) {
      res.json({ success: true, member: deleted[0] });
    } else {
      res.status(404).json({ error: "Member not found" });
    }
  } catch (err: any) {
    logger.error({ err }, 'DELETE /api/members/:id error:');
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.get('/api/vouchers', async (req, res) => {
  try {
    const allVouchers = await db.select().from(vouchers);
    res.json(allVouchers);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.post('/api/vouchers', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.id && (typeof data.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id))) {
      delete data.id;
    }
    if (data.code) data.code = String(data.code).trim().toUpperCase();
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    else data.validFrom = new Date();
    if (data.validUntil) data.validUntil = new Date(data.validUntil);
    else data.validUntil = new Date('2026-12-31');
    data.totalClaimed = Number(data.totalClaimed) || 0;
    data.totalUsed = Number(data.totalUsed) || 0;
    data.maxUsageLimit = Number(data.maxUsageLimit) || 1000;
    data.status = data.status || 'ACTIVE';

    const newVoucher = await db.insert(vouchers).values(data).returning();
    res.json(newVoucher[0]);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.post('/api/vouchers/redeem', async (req, res) => {
  try {
    const { code, memberPhone } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Kode voucher wajib diisi' });
    }
    const cleanCode = String(code).trim().toUpperCase().replace(/^VOUCHER-/, '');
    const found = await db.select().from(vouchers).where(
      or(
        eq(vouchers.code, cleanCode),
        eq(vouchers.code, `VOUCHER-${cleanCode}`),
        ilike(vouchers.code, cleanCode)
      )
    ).limit(1);
    if (found.length === 0) {
      return res.status(404).json({ error: 'Kode voucher tidak ditemukan' });
    }
    const v = found[0];
    const updated = await db.update(vouchers)
      .set({
        totalUsed: (v.totalUsed || 0) + 1,
        totalClaimed: Math.max(v.totalClaimed || 0, (v.totalUsed || 0) + 1)
      })
      .where(eq(vouchers.id, v.id))
      .returning();
    res.json({ success: true, voucher: updated[0] });
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.get('/api/transactions', async (req, res) => {
  try {
    const allTransactions = await db.select().from(transactions).orderBy(desc(transactions.timestamp)).limit(200);
    res.json(allTransactions);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.post('/api/transactions', transactionLimiter, async (req, res) => {
  try {
    const data = { ...req.body };
    const type = data.type;
    const amount = Number(data.amount) || 0;
    
    if (!type) {
      return res.status(400).json({ error: "Transaction type is required" });
    }

    if (!data.memberId) {
      return res.status(400).json({ error: "Member ID is required" });
    }
    
    if (typeof data.memberId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.memberId)) {
      return res.status(400).json({ error: "Invalid Member ID format" });
    }

    // Ensure unique receipt number
    let finalReceiptNo = data.receiptNo;
    if (!finalReceiptNo || finalReceiptNo.trim() === '') {
      finalReceiptNo = 'INV-' + Date.now().toString().slice(-6) + '-' + Math.floor(100 + Math.random() * 900);
    } else {
      const existing = await db.select().from(transactions).where(eq(transactions.receiptNo, finalReceiptNo)).limit(1);
      if (existing.length > 0) {
        finalReceiptNo = `${finalReceiptNo}-${Math.floor(100 + Math.random() * 900)}`;
      }
    }

    // Use db.transaction for atomicity
    const result = await db.transaction(async (tx) => {
      // 1. Fetch Member
      const memberRows = await tx.select().from(members).where(eq(members.id, data.memberId)).limit(1);
      if (memberRows.length === 0) {
        throw new Error("Member not found");
      }
      const member = memberRows[0];

      // 2. Fetch Config
      const configRows = await tx.select().from(loyaltyConfig).limit(1);
      const config = configRows.length > 0 ? configRows[0] : null;

      // 3. Determine Points Delta
      let finalPointsDelta = 0;
      if (type === 'EARN') {
        if (amount < 0) throw new Error("Amount cannot be negative for EARN");
        finalPointsDelta = calculateEarnedPoints(amount, member.tier, config);
      } else if (type === 'MANUAL_ADJUSTMENT' || type === 'REDEEM') {
        const requestedDelta = Math.floor(Number(data.pointsDelta) || 0);
        if (requestedDelta < 0 && member.points + requestedDelta < 0) {
          throw new Error("Insufficient points balance");
        }
        finalPointsDelta = requestedDelta;
      }

      // 4. Update Member
      const newPoints = member.points + finalPointsDelta;
      const newLifetimePoints = finalPointsDelta > 0 ? member.lifetimePoints + finalPointsDelta : member.lifetimePoints;
      const newTotalSpend = type === 'EARN' ? member.totalSpend + amount : member.totalSpend;
      const newTier = calculateTier(newPoints);

      const updatedMemberRows = await tx.update(members)
        .set({
          points: newPoints,
          lifetimePoints: newLifetimePoints,
          totalSpend: newTotalSpend,
          tier: newTier,
          lastStoreVisited: data.storeId || member.lastStoreVisited,
          lastVisitDate: new Date()
        })
        .where(eq(members.id, member.id))
        .returning();
      
      const updatedMember = updatedMemberRows[0];

      // 5. Create Transaction Record
      const newTrxData = {
        id: data.id || undefined,
        receiptNo: finalReceiptNo,
        memberId: member.id,
        memberName: member.name,
        memberPhone: member.phone,
        memberEmail: member.email,
        storeId: data.storeId || null,
        storeName: data.storeName || null,
        cashierName: data.cashierName || 'System',
        type: type,
        amount: amount,
        pointsDelta: finalPointsDelta,
        voucherCode: data.voucherCode || null,
        timestamp: new Date(),
        notes: data.notes || null
      };

      const newTransactionRows = await tx.insert(transactions).values(newTrxData).returning();
      const newTransaction = newTransactionRows[0];

      // 5.b. If transaction is a voucher redeem or has voucherCode, update voucher quota in database
      if (type === 'REDEEM' || data.voucherCode) {
        const rawCode = String(data.voucherCode || data.receiptNo || '').trim().toUpperCase();
        const vCode = rawCode.replace(/^VOUCHER-/, '');
        if (vCode) {
          try {
            const vFound = await tx.select().from(vouchers).where(
              or(
                eq(vouchers.code, vCode),
                eq(vouchers.code, `VOUCHER-${vCode}`),
                ilike(vouchers.code, vCode)
              )
            ).limit(1);
            if (vFound.length > 0) {
              const v = vFound[0];
              await tx.update(vouchers).set({
                totalUsed: (v.totalUsed || 0) + 1,
                totalClaimed: Math.max(v.totalClaimed || 0, (v.totalUsed || 0) + 1)
              }).where(eq(vouchers.id, v.id));
            }
          } catch (vErr) {
            logger.warn({ vErr }, 'Could not increment voucher totalUsed in transaction:');
          }
        }
      }

      // 6. Audit Log
      await tx.insert(auditLogs).values({
        actorName: data.cashierName || 'System',
        actorRole: 'System',
        action: `${type} Transaction`,
        details: `Transaction ${newTransaction.id} created. Member ${member.id} points altered by ${finalPointsDelta}. New balance: ${newPoints}`,
        module: 'POS'
      });

      return { transaction: newTransaction, member: updatedMember };
    });

    res.json(result);
  } catch (err) {
    logger.error({ err }, 'POST /api/transactions error:');
    res.status(400).json({ error: process.env.NODE_ENV === 'production' ? 'Bad Request' : err.message });
  }
});

app.put('/api/vouchers/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.validFrom) data.validFrom = new Date(data.validFrom);
    if (data.validUntil) data.validUntil = new Date(data.validUntil);
    const updated = await db.update(vouchers)
      .set(data)
      .where(eq(vouchers.id, req.params.id))
      .returning();
    if (updated.length > 0) {
      res.json(updated[0]);
    } else {
      res.status(404).json({ error: "Voucher not found" });
    }
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.get('/api/config', async (req, res) => {
  try {
    const configList = await db.select().from(loyaltyConfig).limit(1);
    if (configList.length > 0) {
      res.json(configList[0]);
    } else {
      res.json(null);
    }
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.get('/api/audit', async (req, res) => {
  try {
    const logs = await db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(100);
    res.json(logs);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.get('/api/campaigns', async (req, res) => {
  try {
    const camps = await db.select().from(campaigns).orderBy(desc(campaigns.scheduledAt));
    res.json(camps);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.get('/api/support', async (req, res) => {
  try {
    const tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
    res.json(tickets);
  } catch (err: any) {
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

async function seedInitialData() {
  try {
    // 1. Seed Stores
    const existingStores = await db.select().from(stores).limit(5);
    if (existingStores.length < 2) {
      const sampleStores = [
        { id: 'PUR', code: 'PUR', name: 'Puri Jakarta', mallName: 'Puri Indah Mall 1', city: 'Jakarta Barat', region: 'DKI Jakarta', address: 'Jl. Puri Agung No. 1, Kembangan Selatan, Jakarta Barat 11610', whatsapp: '+62 811-1901-4401', activePromosCount: 3 },
        { id: 'KKJ', code: 'KKJ', name: 'Kota Kasablanka Jakarta', mallName: 'Kota Kasablanka', city: 'Jakarta Selatan', region: 'DKI Jakarta', address: 'Jl. Casablanca Raya Kav. 88, Tebet, Jakarta Selatan 12870', whatsapp: '+62 811-1901-4402', activePromosCount: 4 },
        { id: '2PB', code: '2PB', name: '23 Paskal Bandung', mallName: '23 Paskal Shopping Center', city: 'Bandung', region: 'Jawa Barat', address: 'Jl. Pasir Kaliki No. 25-27, Kebon Jeruk, Andir, Kota Bandung 40181', whatsapp: '+62 811-1901-4403', activePromosCount: 2 },
        { id: 'PAR', code: 'PAR', name: 'Paragon Semarang', mallName: 'Pollux Mall Paragon', city: 'Semarang', region: 'Jawa Tengah', address: 'Jl. Pemuda No. 118, Sekayu, Semarang Tengah, Kota Semarang 50132', whatsapp: '+62 811-1901-4404', activePromosCount: 3 },
        { id: 'SLB', code: 'SLB', name: 'Solo Baru', mallName: 'The Park Mall Solo Baru', city: 'Sukoharjo', region: 'Jawa Tengah', address: 'Jl. Ir. Soekarno, Madegondo, Grogol, Sukoharjo, Jawa Tengah 57552', whatsapp: '+62 811-1901-4405', activePromosCount: 2 },
        { id: 'L21', code: 'L21', name: 'Level 21 Bali', mallName: 'Level 21 Mall Denpasar', city: 'Denpasar', region: 'Bali', address: 'Jl. Teuku Umar No. 1, Dauh Puri Klod, Denpasar Barat, Kota Denpasar, Bali 80113', whatsapp: '+62 811-1901-4406', activePromosCount: 5 }
      ];
      for (const s of sampleStores) {
        try {
          await db.insert(stores).values(s).onConflictDoNothing();
        } catch (e) {}
      }
    }

    // 2. Seed Vouchers (including Independence Day WTC-0826)
    const existingVouchers = await db.select().from(vouchers).limit(5);
    if (existingVouchers.length < 2) {
      const sampleVouchers = [
        {
          code: 'WTC-0826',
          title: 'Independence Day Special Voucher',
          subtitle: 'Promo Spesial Hari Kemerdekaan RI',
          discountType: 'PERCENTAGE',
          discountValue: 17,
          minPurchase: 1000000,
          validFrom: new Date('2026-08-01'),
          validUntil: new Date('2026-08-31'),
          scope: 'ALL_STORES',
          applicableStoreIds: [],
          totalClaimed: 245,
          totalUsed: 68,
          maxUsageLimit: 1945,
          status: 'ACTIVE',
          terms: [
            'Diskon spesial Kemerdekaan 17% di seluruh store Watch Club Indonesia.',
            'Minimal pembelian Rp 1.000.000.',
            'Berlaku hingga 31 Agustus 2026.',
            'Tunjukkan kode voucher ke kasir saat pembayaran.'
          ]
        },
        {
          code: 'WC-WELCOME20',
          title: '20% OFF Welcome Bonus',
          subtitle: 'New member joining gift across all stores',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          minPurchase: 1500000,
          validFrom: new Date('2026-08-01'),
          validUntil: new Date('2026-12-31'),
          scope: 'ALL_STORES',
          applicableStoreIds: [],
          totalClaimed: 1420,
          totalUsed: 685,
          maxUsageLimit: 3000,
          status: 'ACTIVE',
          terms: [
            'Valid for Watch purchases at all Watch Club stores throughout Indonesia.',
            'Valid with min. purchase of IDR 1,500,000.',
            'Not valid for Smart Watches.',
            'Cannot be combined with other ongoing promotions.'
          ]
        },
        {
          code: 'WC-15OFF-LTD',
          title: '15% OFF Storewide Sale',
          subtitle: 'Special national campaign discount',
          discountType: 'PERCENTAGE',
          discountValue: 15,
          minPurchase: 1000000,
          validFrom: new Date('2026-08-15'),
          validUntil: new Date('2026-11-15'),
          scope: 'ALL_STORES',
          applicableStoreIds: [],
          totalClaimed: 890,
          totalUsed: 310,
          maxUsageLimit: 2000,
          status: 'ACTIVE',
          terms: [
            'Applies to storewide purchases.',
            'Valid with min. purchase of IDR 1,000,000.',
            'One redemption per member account.'
          ]
        },
        {
          code: 'PURI-EXCLUSIVE-50K',
          title: 'IDR 50.000 Special Mall Voucher',
          subtitle: 'Exclusive for Puri Indah Mall anniversary',
          discountType: 'FIXED',
          discountValue: 50000,
          minPurchase: 500000,
          validFrom: new Date('2026-08-01'),
          validUntil: new Date('2026-09-30'),
          scope: 'SPECIFIC_STORES',
          applicableStoreIds: ['PUR'],
          totalClaimed: 250,
          totalUsed: 142,
          maxUsageLimit: 500,
          status: 'ACTIVE',
          terms: [
            'Valid exclusively at Watch Club Puri Indah Mall 1 (PUR).',
            'Valid with minimum transaction IDR 500,000.'
          ]
        }
      ];
      for (const v of sampleVouchers) {
        try {
          await db.insert(vouchers).values(v).onConflictDoNothing();
        } catch (e) {}
      }
    }

    // 3. Seed Members
    const existingMembers = await db.select().from(members).limit(5);
    if (existingMembers.length < 2) {
      const sampleMembers = [
        {
          membershipId: '123456789012',
          name: 'Sarah Johnson',
          phone: '085817418645',
          email: 'sarah.johnson@email.com',
          tier: 'GOLD',
          points: 850,
          lifetimePoints: 2350,
          totalSpend: 23500000,
          joinDate: new Date('2026-08-12'),
          registeredStore: 'Puri Jakarta',
          lastStoreVisited: 'Puri Jakarta',
          lastVisitDate: new Date('2026-08-24'),
          gender: 'Wanita',
          birthDate: new Date('1995-04-18'),
          address: 'Jl. Puri Agung No. 1, Kembangan Selatan, Jakarta Barat',
          status: 'ACTIVE'
        },
        {
          membershipId: '987654321098',
          name: 'Budi Santoso',
          phone: '081234567890',
          email: 'budi.santoso@gmail.com',
          tier: 'SILVER',
          points: 120,
          lifetimePoints: 120,
          totalSpend: 1200000,
          joinDate: new Date('2026-08-19'),
          registeredStore: 'Kota Kasablanka Jakarta',
          lastStoreVisited: 'Kota Kasablanka Jakarta',
          lastVisitDate: new Date('2026-08-24'),
          gender: 'Pria',
          birthDate: new Date('1990-08-17'),
          status: 'ACTIVE'
        }
      ];

      for (const sm of sampleMembers) {
        try {
          await db.insert(members).values(sm).onConflictDoNothing();
        } catch (e) {
          // ignore duplicate conflicts
        }
      }
    }

    // 4. Seed sample transactions if empty
    const existingTrx = await db.select().from(transactions).limit(5);
    if (existingTrx.length === 0) {
      const initialTrxs = [
        {
          receiptNo: 'INV-00121',
          memberName: 'Budi Santoso',
          memberPhone: '081234567890',
          storeId: 'PUR',
          storeName: 'Puri Jakarta',
          cashierName: 'Admin Kasir',
          type: 'EARN',
          amount: 1200000,
          pointsDelta: 120,
          timestamp: new Date('2026-08-25T08:30:00Z'),
          notes: 'Belanja Jam Tangan Seiko'
        },
        {
          receiptNo: 'VCH-WTC0826-001',
          memberName: 'Sarah Johnson',
          memberPhone: '085817418645',
          storeId: 'PUR',
          storeName: 'Puri Jakarta',
          cashierName: 'Admin Kasir',
          type: 'REDEEM',
          amount: 0,
          pointsDelta: -50,
          timestamp: new Date('2026-08-25T09:15:00Z'),
          notes: 'Klaim Voucher Independence Day WTC-0826'
        }
      ];
      for (const t of initialTrxs) {
        try {
          await db.insert(transactions).values(t).onConflictDoNothing();
        } catch (e) {}
      }
    }
  } catch (err) {
    logger.error({ err: err }, "Error seeding initial data:");
  }
}

async function startServer() {
  await seedInitialData();

  if (process.env.NODE_ENV !== 'production') {
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

  
// Gemini AI Initialization
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
            { text: 'Analyze this receipt and extract the total amount, date, and list of items. Respond strictly in JSON.' }
          ]
        }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            totalAmount: { type: 'NUMBER' },
            date: { type: 'STRING' },
            items: { 
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  name: { type: 'STRING' },
                  price: { type: 'NUMBER' }
                }
              }
            }
          }
        }
      }
    });

    res.json({ result: JSON.parse(response.text) });
  } catch (err) {
    logger.error({ err }, 'AI scan-receipt error');
    res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message });
  }
});

app.post('/api/validate-notes', async (req, res) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.json({ safe: true });
    
    // We can use generateContent with safety settings to validate
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: notes,
      config: {
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
          },
        ],
      }
    });
    
    // If we reach here without throwing, it's generally safe. Or we check the candidate finishReason
    if (response.candidates && response.candidates[0].finishReason === 'SAFETY') {
      return res.status(400).json({ error: 'Input violates safety policies (Harassment).' });
    }
    
    res.json({ safe: true });
  } catch (err) {
    logger.error({ err }, 'AI validate-notes error');
    // If the API blocks it, it throws an error
    res.status(400).json({ error: 'Input violates safety policies.' });
  }
});

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

startServer();
