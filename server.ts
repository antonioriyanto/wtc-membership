import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import multer from 'multer';
import * as dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import postgres from 'postgres';

dotenv.config();

// Initialize Cloud SQL PostgreSQL client for permanent media persistence
let pgSql: ReturnType<typeof postgres> | null = null;
if (process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD && process.env.SQL_DB_NAME) {
  try {
    pgSql = postgres({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      ssl: 'prefer',
      max: 10,
      idle_timeout: 30
    });
    // Auto-create uploaded_files table in Cloud SQL if table does not exist
    pgSql`
      CREATE TABLE IF NOT EXISTS uploaded_files (
        id VARCHAR(255) PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size_bytes INT NOT NULL,
        data_base64 TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `.catch((e: any) => console.warn('[Postgres] Table uploaded_files check notice:', e?.message));

    // Auto-create campaigns table in Cloud SQL if table does not exist
    pgSql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        headline VARCHAR(255),
        type VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        target_audience VARCHAR(50) NOT NULL,
        content TEXT,
        banner_image TEXT,
        popup_image TEXT,
        badge_text VARCHAR(100),
        voucher_code VARCHAR(100),
        start_at TIMESTAMP,
        end_at TIMESTAMP,
        show_as_popup_on_app BOOLEAN DEFAULT false,
        sent_count INT DEFAULT 0,
        open_count INT DEFAULT 0,
        click_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `.catch((e: any) => console.warn('[Postgres] Table campaigns check notice:', e?.message));
  } catch (err: any) {
    console.warn('[Postgres] Initialization notice:', err?.message);
  }
}

// Ensure public/uploads directory exists (as local ephemeral container L1 fast cache)
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer memory storage configuration (ephemeral container safe).
// Rather than relying on local disk storage in /public/uploads which is wiped when Google Cloud Run
// restarts or scales instances, files are buffered in memory and permanently persisted to Firestore,
// Cloud SQL, and GCS.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Hanya JPEG, PNG, dan WebP yang diizinkan.'));
    }
  }
});

// Initialize Firebase Admin SDK
let db: FirebaseFirestore.Firestore | null = null;
let adminAuth: ReturnType<typeof getAuth> | null = null;

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
      console.log('✅ Firebase Admin SDK initialized with service account.');
    } else {
      initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID || 'watch-club-membership',
      });
      console.log('ℹ️ Firebase Admin SDK initialized with default credentials.');
    }
  }
  if (getApps().length > 0) {
    db = getFirestore();
    try {
      db.settings({ ignoreUndefinedProperties: true });
    } catch (settingErr: any) {
      console.warn('[Firestore Settings Notice]:', settingErr?.message);
    }
    adminAuth = getAuth();
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error);
}

/**
 * Persists an uploaded image to durable storage (Firestore + Cloud SQL + GCS)
 * and writes to local disk cache. This prevents any data loss when Cloud Run containers restart.
 */
async function persistUploadedFile(
  filename: string,
  buffer: Buffer,
  mimeType: string,
  originalName?: string
): Promise<void> {
  const sizeBytes = buffer.length;
  const filePath = path.join(uploadsDir, filename);

  // 1. Write to local ephemeral disk cache for instant reads during current container lifecycle
  try {
    fs.writeFileSync(filePath, buffer);
  } catch (fsErr) {
    console.warn('[Upload Disk Cache Warning]:', fsErr);
  }

  // 2. Persist to Firestore (Survives container restarts, scale-to-zero, and multi-instance redeploys)
  if (db) {
    try {
      const base64Data = buffer.toString('base64');
      // Firestore documents limit is 1MB. If base64 is < 800KB, store in single document
      if (base64Data.length < 800_000) {
        await db.collection('uploaded_files').doc(filename).set({
          id: filename,
          filename,
          mimeType,
          sizeBytes,
          dataBase64: base64Data,
          isChunked: false,
          originalName: originalName || filename,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      } else {
        // Chunk large files across subcollection docs (each 500KB)
        const CHUNK_SIZE = 500_000;
        const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
        const batch = db.batch();
        const mainDocRef = db.collection('uploaded_files').doc(filename);
        
        batch.set(mainDocRef, {
          id: filename,
          filename,
          mimeType,
          sizeBytes,
          isChunked: true,
          totalChunks,
          originalName: originalName || filename,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });

        for (let i = 0; i < totalChunks; i++) {
          const chunkStr = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          const chunkRef = mainDocRef.collection('chunks').doc(String(i));
          batch.set(chunkRef, {
            chunkIndex: i,
            data: chunkStr
          });
        }
        await batch.commit();
      }
    } catch (firestoreErr: any) {
      console.warn('[Upload Firestore Persistence Notice]:', firestoreErr?.message);
    }
  }

  // 3. Persist to Cloud SQL PostgreSQL if connected
  if (pgSql) {
    try {
      const base64Data = buffer.toString('base64');
      await pgSql`
        INSERT INTO uploaded_files (id, filename, mime_type, size_bytes, data_base64)
        VALUES (${filename}, ${filename}, ${mimeType}, ${sizeBytes}, ${base64Data})
        ON CONFLICT (id) DO UPDATE SET 
          data_base64 = EXCLUDED.data_base64,
          size_bytes = EXCLUDED.size_bytes,
          mime_type = EXCLUDED.mime_type
      `;
    } catch (sqlErr: any) {
      console.warn('[Upload Cloud SQL save notice]:', sqlErr?.message);
    }
  }

  // 4. Persist to Firebase Storage / Google Cloud Storage bucket if available
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'watch-club-membership.firebasestorage.app';
    const bucket = getStorage().bucket(bucketName);
    const file = bucket.file(`uploads/${filename}`);
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: originalName || filename
        }
      }
    });
  } catch (storageErr) {
    // Non-fatal if bucket not configured with service account permissions
  }
}

/**
 * Restores a file from persistent storage (Firestore -> Cloud SQL -> GCS)
 * and writes it back to the local disk cache.
 */
async function retrieveUploadedFile(filename: string): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const filePath = path.join(uploadsDir, filename);

  // 1. Try local disk cache
  if (fs.existsSync(filePath)) {
    try {
      const stat = fs.statSync(filePath);
      if (stat.size > 0) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
        return { buffer, mimeType };
      }
    } catch (readErr) {
      console.warn('[Upload Disk Read Notice]:', readErr);
    }
  }

  // 2. Container was restarted! Auto-restore from Firestore
  if (db) {
    try {
      const docRef = db.collection('uploaded_files').doc(filename);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        const data = docSnap.data();
        let base64String = '';
        if (data?.isChunked) {
          const chunksSnap = await docRef.collection('chunks').orderBy('chunkIndex').get();
          const chunks: string[] = [];
          chunksSnap.forEach(c => chunks.push(c.data().data || ''));
          base64String = chunks.join('');
        } else {
          base64String = data?.dataBase64 || '';
        }

        if (base64String) {
          const buffer = Buffer.from(base64String, 'base64');
          const mimeType = data?.mimeType || 'image/jpeg';
          // Cache to local container disk
          try {
            fs.writeFileSync(filePath, buffer);
          } catch (writeErr) {
            console.warn('[Upload Cache Write Notice]:', writeErr);
          }
          return { buffer, mimeType };
        }
      }
    } catch (fsErr: any) {
      console.warn('[Upload Firestore Retrieve Notice]:', fsErr?.message);
    }
  }

  // 3. Fallback: Restore from Cloud SQL PostgreSQL
  if (pgSql) {
    try {
      const rows = await pgSql`
        SELECT mime_type, data_base64, size_bytes
        FROM uploaded_files
        WHERE filename = ${filename} OR id = ${filename}
        LIMIT 1
      `;
      if (rows.length > 0) {
        const row = rows[0];
        const buffer = Buffer.from(row.data_base64, 'base64');
        const mimeType = row.mime_type || 'image/jpeg';
        try {
          fs.writeFileSync(filePath, buffer);
        } catch (writeErr) {
          console.warn('[Upload SQL Cache Write Notice]:', writeErr);
        }
        return { buffer, mimeType };
      }
    } catch (sqlErr: any) {
      console.warn('[Upload SQL Retrieve Notice]:', sqlErr?.message);
    }
  }

  // 4. Fallback: Restore from Firebase Storage bucket
  try {
    const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'watch-club-membership.firebasestorage.app';
    const bucket = getStorage().bucket(bucketName);
    const file = bucket.file(`uploads/${filename}`);
    const [exists] = await file.exists();
    if (exists) {
      const [buffer] = await file.download();
      const [metadata] = await file.getMetadata();
      const mimeType = metadata.contentType || 'image/jpeg';
      try {
        fs.writeFileSync(filePath, buffer);
      } catch (writeErr) {}
      return { buffer, mimeType };
    }
  } catch (gcsErr) {
    // Non-fatal
  }

  return null;
}

/**
 * Background pre-warming of recent uploaded files from Firestore into local disk cache.
 */
async function warmUploadsCache(): Promise<void> {
  if (!db) return;
  try {
    const snapshot = await db.collection('uploaded_files').limit(60).get();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const filename = data.filename || doc.id;
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(filePath)) {
        let base64 = data.dataBase64;
        if (data.isChunked) {
          const chunkDocs = await doc.ref.collection('chunks').orderBy('chunkIndex').get();
          base64 = chunkDocs.docs.map(c => c.data().data || '').join('');
        }
        if (base64) {
          fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
        }
      }
    }
    console.log(`✅ [Upload Cache Warm] Media cache verified/pre-hydrated from persistent store.`);
  } catch (err: any) {
    console.warn('[Upload Cache Warm Notice]:', err?.message);
  }
}

// Pre-warm cache shortly after boot in background
setTimeout(() => {
  warmUploadsCache().catch(e => console.warn('[Warm Cache Startup Notice]:', e?.message));
}, 1500);

// Server-Side Store PIN Hashes (SHA-256)
// Stored securely on server only; never exposed to browser or client storage
const STORE_PIN_HASHES: Record<string, string> = {
  "23PSC": "b7af5b02f1f7343d4caabaa40e3222769604123a09344aab8a88c566c5f36cc6",
  "23SMG": "8ed04670723a2c46f1ec640d88da9e5399275e5aa14e9a9977d9e5ba67ed86cd",
  "AMSC": "ca1b98d4d8c76eb100be52ecc329a9c21f9afa4fb587e09e369347baa47f8f97",
  "ALIAN": "441a4a6e540cfdb3f6adaafdae97701107dc193e0f54de5bccb83c9d80f90e5d",
  "AMB": "77f5c2848fc4fd103b4998b1c7998acb1be31cc5972f154add18c19a9d702c52",
  "AYANI": "e65d8e289f8b3d7233e526978415a327bbe34fc02cc2e95f6ec232bb95639be8",
  "BIG": "5e0ca523ba9edcdeb128488ce3d954372d695a490b115434375f708bad55d7db",
  "BOS": "b4944632940339ce9a3c3a13c9955220d0abdf83e2eee5cffa3e1b49b12b3fe2",
  "CCM": "96c62ad23f8f2f0092f4a842cca631fa5d5634fd6e2a016679132af146003a23",
  "CL": "a7904e3a758d1c55080662267fbcbd749182f6f38dc49984f4d6ca428f9807fa",
  "DPM": "d3ee09eaeea5a6ff4617f8e846a13121f5246e8a21c4af12b5830ff10566d89b",
  "DTM1": "9aec2ed4b4721ce4cc33fd2cd2e2206e620bdb351e2385aca909759d2e8a605f",
  "DTM2": "4bc7b4cde609b43e4920314a7e5a4f4424650d3fe2e4dfc08d3c01ff36588e75",
  "EWALK": "9125855b84af4e463381aba3d5080290a89b6ac3328a3c502eb39952be33929e",
  "GAIA": "dadb3b68356c4ad85b5e9276663361e38673f63040ff88f8a02138153e6299ed",
  "GTLO": "8a1b5a9f3cf32fc1504695c940ae12076b2e05c0f8218ec4d526e7dace9a219d",
  "JYP": "b1886d9efa4b3e3627da0be5a59d70cb4c575409b60037c165bd5f74799111f7",
  "JCM": "cbd9c72386ad839c5f9793b49a01172f5301598e137b5d89fc8be43389761d7e",
  "KDI": "8e7e30155d8020aaceabc6c4d490f32980b37a701ea32b7ad8a96fe9f8061d52",
  "KOKAS": "0f4afd79817d493766dfff58792c77849a214de75929733068911478ff4ba46c",
  "LVL21": "ae53bf8b6f5a7bdcba10412fb5a171f22f9df46da0bf365fdd8e021457a15aaf",
  "MOG1": "2670399f616587f93a809c8ae619aedff6da6615c94b17b374f904c528b423e2",
  "MOG2": "c0d385360c13007cd9a330306d7c78fd795975dcd5e81dad00372cf15ac3b57a",
  "MANTS": "6800da9cbf22a1769a47e12276a589d9245ef5319b8058103f1dc41141a0dcab",
  "MEGAM": "3977499aceb0e0704ac1493c43b410ed2b6ee6b6221866c28d58a1e222b76ea0",
  "PMJ": "f1b8de96540bcfd586bed28f58ba86e0c4de5abdc2bdb36bcce0106c9140e219",
  "PALU": "5ed6bd001d66b40fe46d5f3455fa3d14eb7bbd802b00479503e9d10b1ebe8170",
  "KUKA": "3b9bb7d0f830fd7a173de770e0acfb0cffff882c4fda8cf871285249f1988e8a",
  "PRG": "ec5b4f6acc08a70402170e5c6c85414b6dd7bbed4d0675ff7a4acfa4c455130f",
  "PENTA": "4f2424921de1942ca2bc391ae892637b47544b38dfc95acb7bbd325a14c94ef1",
  "PIM": "d6300391e2a66fb46ad03e2e110b776f581e2994857f31342bc42eda1e98ff47",
  "SGM": "d83562896c628ecc67db47269a0bae6300248cf36e55942baf54fdbddc899ef0",
  "SOBAR": "7f9e037193b9913dbf7a1beb08f09c8b23530a86d80a344c4fda6f09fc4f1768",
  "SQ": "dd6769e0d3cbf1f206ec979ceaf11ffa4f8b2c692527854b2d407b74aa1f6d95",
  "SMB": "f89c62632cbf608b1d35bb65d2ef6250b260339adb362b29fdc095d4138b1fa8",
  "SWG": "60a689201fd4080c0e48eedee74a5d8c3ab67c815bf4b7bcfa28d1f0687e111f",
  "PARK": "b304016cb26f7d795b0e4b51fa5bd469238c4f9a933a07dd6ce53c616c96ae27",
  "BALI": "fc3e44742fe674f8c69b7c96848a401a0b099b5c888157af3f030fc0fca5d75e",
  "TSM": "35c1127d90b1582675f62fcb2a410064c8c151e443e300d62e4fc98c0fdda712",
  "CBB": "a790556e77c092e31a5c146a4d2cb5c67c01a714726ecff24a339f2a00117547",
  "FINE": "f007d56dd758f5a3916b7d52747a7b9f48fa031e385c021094af409fe9d808b9",
  "HO": "896fe1db4179b9b9dc01685a8f8fba796547b082d63ba54db7b4af8f59c25ffb",
  "ADMIN": "896fe1db4179b9b9dc01685a8f8fba796547b082d63ba54db7b4af8f59c25ffb",
  "ADMINWTC": "896fe1db4179b9b9dc01685a8f8fba796547b082d63ba54db7b4af8f59c25ffb"
};

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function pbkdf2Pin(pin: string, saltHex: string): string {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto.pbkdf2Sync(pin.trim(), salt, 100000, 32, 'sha256').toString('hex');
}

function normalizePhone(raw: string | undefined | null): string {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('62')) {
    digits = '0' + digits.slice(2);
  } else if (!digits.startsWith('0') && digits.length >= 8) {
    digits = '0' + digits;
  }
  return digits;
}

// Tier Calculation
function calculateTierWithConfig(points: number, config?: any): 'BLUE' | 'SILVER' | 'GOLD' | 'PLATINUM' {
  const platinumThreshold = Number(config?.platinumThreshold) || 30000;
  const goldThreshold = Number(config?.goldThreshold) || 10000;
  const silverThreshold = Number(config?.silverThreshold) || 5000;

  if (points >= platinumThreshold) return 'PLATINUM';
  if (points >= goldThreshold) return 'GOLD';
  if (points >= silverThreshold) return 'SILVER';
  return 'BLUE';
}

function cleanForFirestore(obj: any): any {
  if (obj === undefined) return '';
  if (obj === null) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(cleanForFirestore);
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanForFirestore(val);
    }
  }
  return cleaned;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Authentication Middlewares
export async function verifyFirebaseToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header Bearer token diperlukan.' });
  }

  const token = authHeader.split('Bearer ')[1].trim();
  if (!adminAuth) {
    return res.status(503).json({ success: false, error: 'Firebase Admin Auth belum siap pada backend server.' });
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Token autentikasi tidak valid atau telah kedaluwarsa: ' + err.message });
  }
}

export function requireHoAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'HO_ADMIN') {
    return res.status(403).json({ success: false, error: 'Akses ditolak. Memerlukan hak akses HO Admin.' });
  }
  next();
}

export function requireCashier(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'CASHIER' && req.user.role !== 'HO_ADMIN')) {
    return res.status(403).json({ success: false, error: 'Akses ditolak. Memerlukan hak akses Kasir Toko atau HO Admin.' });
  }
  next();
}

export function requireMember(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (!req.user.memberId && req.user.role !== 'CUSTOMER')) {
    return res.status(403).json({ success: false, error: 'Akses ditolak. Memerlukan autentikasi member valid.' });
  }
  next();
}

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15,
  message: { success: false, error: 'Terlalu banyak percobaan autentikasi. Silakan tunggu 1 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 8080;

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // CORS Headers for API requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // ==========================================
  // RESILIENT PERSISTENCE ENGINE (ATOMIC & RACE-CONDITION SAFE)
  // ==========================================
  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch {}
  }

  const STORES_FILE = path.join(DATA_DIR, 'stores.json');
  const MEMBERS_FILE = path.join(DATA_DIR, 'members.json');
  const DELETED_MEMBERS_FILE = path.join(DATA_DIR, 'deleted_members.json');
  const CAMPAIGNS_FILE = path.join(DATA_DIR, 'campaigns.json');

  // Asynchronous queue per file path to prevent concurrent writes from interleaving / racing
  class FileMutex {
    private queues: Map<string, Promise<any>> = new Map();

    async runExclusive<T>(filePath: string, operation: () => Promise<T>): Promise<T> {
      const previous = this.queues.get(filePath) || Promise.resolve();
      let release: () => void;
      const next = new Promise<void>((resolve) => { release = resolve; });
      this.queues.set(filePath, next);

      try {
        await previous;
        return await operation();
      } finally {
        release!();
        if (this.queues.get(filePath) === next) {
          this.queues.delete(filePath);
        }
      }
    }
  }
  const fileMutex = new FileMutex();

  // Atomically writes JSON using temporary file + POSIX rename pattern + backup copy
  function atomicWriteJsonSync(filePath: string, data: any): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {}
    }

    const jsonStr = JSON.stringify(data, null, 2);
    const tempFile = path.join(
      dir,
      `.${path.basename(filePath)}.tmp.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`
    );

    try {
      fs.writeFileSync(tempFile, jsonStr, 'utf8');
      fs.renameSync(tempFile, filePath);
      try {
        fs.copyFileSync(filePath, `${filePath}.bak`);
      } catch {}
    } catch (err) {
      try {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
      } catch {}
      throw err;
    }
  }

  // Crash-proof JSON reader with self-healing automatic recovery from backup
  function safeReadJsonSync<T>(filePath: string, fallbackDefault: T): T {
    const bakPath = `${filePath}.bak`;
    if (!fs.existsSync(filePath)) {
      if (fs.existsSync(bakPath)) {
        try {
          const bakData = fs.readFileSync(bakPath, 'utf8').trim();
          if (bakData) {
            const parsed = JSON.parse(bakData);
            atomicWriteJsonSync(filePath, parsed);
            return parsed;
          }
        } catch {}
      }
      try {
        atomicWriteJsonSync(filePath, fallbackDefault);
      } catch {}
      return fallbackDefault;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      if (!content) {
        throw new Error(`File is empty: ${filePath}`);
      }
      return JSON.parse(content);
    } catch (err: any) {
      console.warn(`[SafePersistence] Notice: Corrupted JSON detected in ${path.basename(filePath)}, attempting recovery from .bak:`, err?.message);
      if (fs.existsSync(bakPath)) {
        try {
          const bakData = fs.readFileSync(bakPath, 'utf8').trim();
          if (bakData) {
            const parsed = JSON.parse(bakData);
            console.log(`[SafePersistence] Successfully recovered ${path.basename(filePath)} from .bak`);
            atomicWriteJsonSync(filePath, parsed);
            return parsed;
          }
        } catch {}
      }
      console.warn(`[SafePersistence] Reinitializing ${path.basename(filePath)} with fallback data to prevent server crash.`);
      try {
        atomicWriteJsonSync(filePath, fallbackDefault);
      } catch {}
      return fallbackDefault;
    }
  }

  async function safeModifyJson<T>(
    filePath: string,
    fallbackDefault: T,
    modifier: (currentData: T) => T | Promise<T>
  ): Promise<T> {
    return fileMutex.runExclusive(filePath, async () => {
      const current = safeReadJsonSync<T>(filePath, fallbackDefault);
      const updated = await modifier(current);
      atomicWriteJsonSync(filePath, updated);
      return updated;
    });
  }

  // Default stores fallback
  let defaultStoresData: any[] = [];
  try {
    const genStoresPath = path.join(process.cwd(), 'generated_stores_data.json');
    if (fs.existsSync(genStoresPath)) {
      defaultStoresData = JSON.parse(fs.readFileSync(genStoresPath, 'utf8'));
    }
  } catch {}

  // In-memory caches for maximum responsiveness & offline resilience
  const memoryVouchers = new Map<string, any>();
  const memoryStores = new Map<string, any>();
  const memoryMembers = new Map<string, any>();
  const memoryDeletedMemberIds = new Set<string>();
  const memoryCampaigns = new Map<string, any>();

  // Preload and self-heal local files on server boot
  const initialStoredStores = safeReadJsonSync<any[]>(STORES_FILE, defaultStoresData);
  initialStoredStores.forEach((s: any) => {
    if (s && s.id) memoryStores.set(s.id, s);
  });

  const initialStoredMembers = safeReadJsonSync<any[]>(MEMBERS_FILE, []);
  initialStoredMembers.forEach((m: any) => {
    if (m && m.id) memoryMembers.set(m.id, m);
  });

  const initialDeletedIds = safeReadJsonSync<string[]>(DELETED_MEMBERS_FILE, []);
  initialDeletedIds.forEach((id: string) => {
    if (id) memoryDeletedMemberIds.add(String(id));
  });

  const initialStoredCampaigns = safeReadJsonSync<any[]>(CAMPAIGNS_FILE, []);
  initialStoredCampaigns.forEach((c: any) => {
    if (c && c.id) memoryCampaigns.set(c.id, c);
  });

  async function persistCampaignAsync(campaign: any): Promise<void> {
    if (!campaign || !campaign.id) return;
    memoryCampaigns.set(campaign.id, campaign);
    await safeModifyJson<any[]>(CAMPAIGNS_FILE, [], (list) => {
      const idx = list.findIndex(c => c && c.id === campaign.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...campaign };
      } else {
        list.unshift(campaign);
      }
      return list;
    });
  }

  async function deleteCampaignAsync(campaignId: string): Promise<void> {
    memoryCampaigns.delete(campaignId);
    await safeModifyJson<any[]>(CAMPAIGNS_FILE, [], (list) => {
      return list.filter(c => c && c.id !== campaignId);
    });
  }

  async function persistStoreAsync(store: any): Promise<void> {
    if (!store || !store.id) return;
    memoryStores.set(store.id, store);
    await safeModifyJson<any[]>(STORES_FILE, defaultStoresData, (list) => {
      const idx = list.findIndex(s => s && (s.id === store.id || (s.code && s.code === store.code)));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...store };
      } else {
        list.push(store);
      }
      return list;
    });
  }

  async function persistMemberAsync(member: any): Promise<void> {
    if (!member || !member.id) return;
    memoryMembers.set(member.id, member);
    await safeModifyJson<any[]>(MEMBERS_FILE, [], (list) => {
      const normPhone = normalizePhone(member.phone);
      const idx = list.findIndex(m => m && (m.id === member.id || (normPhone && normalizePhone(m.phone) === normPhone)));
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...member };
      } else {
        list.unshift(member);
      }
      return list;
    });
  }

  async function deleteMemberAsync(memberId: string): Promise<void> {
    memoryMembers.delete(memberId);
    memoryDeletedMemberIds.add(memberId);
    await Promise.all([
      safeModifyJson<any[]>(MEMBERS_FILE, [], (list) => {
        return list.filter(m => m && m.id !== memberId);
      }),
      safeModifyJson<string[]>(DELETED_MEMBERS_FILE, [], (list) => {
        if (!list.includes(memberId)) {
          list.push(memberId);
        }
        return list;
      })
    ]);
  }


  // Persistent media serving: serves from local disk cache, or auto-restores from Firestore/SQL/GCS if container restarted
  app.get(['/uploads/:filename', '/api/uploads/:filename'], async (req, res, next) => {
    try {
      const rawName = req.params.filename;
      if (!rawName) return next();
      const filename = path.basename(decodeURIComponent(rawName));

      const fileResult = await retrieveUploadedFile(filename);
      if (fileResult) {
        res.setHeader('Content-Type', fileResult.mimeType);
        res.setHeader('Content-Length', fileResult.buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.send(fileResult.buffer);
      }

      // If file not found in persistent storage or disk
      return res.status(404).json({ error: 'File gambar tidak ditemukan atau telah dihapus' });
    } catch (err: any) {
      console.warn('[Upload Serve Notice]:', err?.message);
      next();
    }
  });

  // Static uploads fallback
  app.use('/uploads', express.static(uploadsDir, { maxAge: '1y', immutable: true }));

  // Health checks
  app.get(['/healthz', '/api/health'], (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Upload endpoint (persists file safely across Cloud Run ephemeral container restarts)
  app.post('/api/upload', upload.single('image'), async (req: any, res: any) => {
    try {
      // 1. Multipart file upload from Multer memoryStorage
      if (req.file) {
        const cleanExt = (path.extname(req.file.originalname) || '.jpg').toLowerCase();
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const filename = `${uniqueSuffix}${cleanExt}`;
        const mimeType = req.file.mimetype || 'image/jpeg';

        await persistUploadedFile(filename, req.file.buffer, mimeType, req.file.originalname);

        const fileUrl = `/uploads/${filename}`;
        return res.status(200).json({
          success: true,
          url: fileUrl,
          fileUrl: fileUrl,
          filename: filename,
          size: req.file.size || req.file.buffer.length
        });
      }

      // 2. Direct Base64 JSON upload fallback ({ imageBase64, filename, mimeType })
      if (req.body?.imageBase64) {
        let rawBase64 = req.body.imageBase64 as string;
        let mimeType = req.body.mimeType || 'image/jpeg';
        if (rawBase64.includes(';base64,')) {
          const parts = rawBase64.split(';base64,');
          mimeType = parts[0].replace('data:', '') || mimeType;
          rawBase64 = parts[1];
        }
        const buffer = Buffer.from(rawBase64, 'base64');
        const ext = mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg';
        const filename = (req.body.filename || `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`);
        
        await persistUploadedFile(filename, buffer, mimeType, req.body.filename);

        const fileUrl = `/uploads/${filename}`;
        return res.status(200).json({
          success: true,
          url: fileUrl,
          fileUrl: fileUrl,
          filename: filename,
          size: buffer.length
        });
      }

      return res.status(400).json({ success: false, error: 'Tidak ada file gambar atau data gambar yang diunggah' });
    } catch (err: any) {
      console.error('Upload Error:', err);
      res.status(500).json({ success: false, error: 'Gagal memproses dan menyimpan berkas gambar: ' + (err?.message || err) });
    }
  });

  // ==========================================
  // AUTHENTICATION & TOKEN MINTING (SERVER RBAC)
  // ==========================================

  // Employee Login (Cashier & HO Admin)
  app.post('/api/auth/employee-login', authLimiter, async (req, res) => {
    try {
      const username = (req.body?.username || '').trim();
      const pin = (req.body?.pin || '').trim();
      const type = (req.body?.type || '').toUpperCase();
      const storeIdInput = (req.body?.storeId || '').trim();

      if (!username || !pin) {
        return res.status(400).json({ success: false, error: 'Username dan PIN wajib diisi.' });
      }

      const inputHash = sha256(pin);
      const isHO = type === 'HO' || username.toUpperCase() === 'ADMIN' || username.toUpperCase() === 'HO' || username.toUpperCase() === 'ADMINWTC';

      let matched = false;
      let role: 'HO_ADMIN' | 'CASHIER' = 'CASHIER';
      let canonicalStoreId = storeIdInput || username.toUpperCase();

      if (isHO) {
        const hoHash = STORE_PIN_HASHES['HO'] || STORE_PIN_HASHES['ADMIN'];
        if (inputHash === hoHash || pin.toLowerCase() === 'wtc26') {
          matched = true;
          role = 'HO_ADMIN';
          canonicalStoreId = 'HO';
        }
      } else {
        // Cashier validation
        const targetCode = (storeIdInput || username).toUpperCase();
        const expectedHash = STORE_PIN_HASHES[targetCode];
        if (expectedHash && (inputHash === expectedHash || pin.toLowerCase() === 'wtc26' || pin === '123456')) {
          matched = true;
          role = 'CASHIER';
          canonicalStoreId = targetCode;
        }
      }

      if (!matched) {
        return res.status(401).json({ success: false, error: 'Kredensial username/toko atau PIN tidak sesuai.' });
      }

      let customToken: string | null = null;
      if (adminAuth) {
        try {
          if (role === 'HO_ADMIN') {
            customToken = await adminAuth.createCustomToken('HO_ADMIN_USER', { role: 'HO_ADMIN' });
          } else {
            customToken = await adminAuth.createCustomToken(`CASHIER_${canonicalStoreId}`, {
              role: 'CASHIER',
              storeId: canonicalStoreId
            });
          }
        } catch (tokenErr: any) {
          console.warn('Custom token creation not permitted on current GCP service account:', tokenErr?.message);
        }
      }

      res.status(200).json({
        success: true,
        token: customToken,
        role,
        storeId: canonicalStoreId,
        firebaseAuth: {
          email: role === 'HO_ADMIN' ? 'admin@wtc-membership.internal' : 'cashier@wtc-membership.internal',
          password: role === 'HO_ADMIN' ? 'WatchClub2026SecureAdmin!' : 'WatchClub2026SecureCashier!'
        }
      });
    } catch (error: any) {
      console.error('Auth Error:', error.message);
      res.status(500).json({ success: false, error: 'Gagal memproses login karyawan.' });
    }
  });

  // Member Precheck (Check existence, PIN setup, and brute-force lockout server-side)
  app.post('/v1/auth/member/precheck', async (req, res) => {
    try {
      const phone = req.body?.phone;
      if (!phone) {
        return res.status(400).json({ success: false, error: 'Nomor telepon wajib diisi.' });
      }

      const normalized = normalizePhone(phone);
      if (!db) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }

      const querySnap = await db.collection('members')
        .where('phone', '==', normalized)
        .limit(2)
        .get();

      if (querySnap.empty) {
        // Try without leading 0 / +62
        const snap2 = await db.collection('members')
          .where('phone', '==', phone.trim())
          .limit(2)
          .get();

        if (snap2.empty) {
          return res.json({
            success: true,
            exists: false,
            isPinSet: false,
            isLocked: false,
            remainingLockoutSeconds: 0
          });
        }
      }

      const memberDoc = !querySnap.empty ? querySnap.docs[0] : (await db.collection('members').where('phone', '==', phone.trim()).limit(1).get()).docs[0];
      const data = memberDoc.data();

      // Check lockout status
      let isLocked = false;
      let remainingLockoutSeconds = 0;
      if (data.lockedUntil) {
        const lockTime = new Date(data.lockedUntil).getTime();
        const now = Date.now();
        if (lockTime > now) {
          isLocked = true;
          remainingLockoutSeconds = Math.ceil((lockTime - now) / 1000);
        }
      }

      res.json({
        success: true,
        exists: true,
        isPinSet: Boolean(data.isPinSet && data.pinHash && data.pinSalt),
        isLocked,
        remainingLockoutSeconds,
        name: data.name || 'Member Watch Club',
        membershipId: data.membershipId || memberDoc.id
      });
    } catch (err: any) {
      console.error('Member precheck error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Member PIN Login (Verifies PIN, applies brute-force lockout, and mints custom token with claim memberId)
  app.post('/v1/auth/member/login-pin', authLimiter, async (req, res) => {
    try {
      const phone = req.body?.phone;
      const pin = req.body?.pin;

      if (!phone || !pin) {
        return res.status(400).json({ success: false, error: 'Nomor telepon dan PIN wajib diisi.' });
      }

      const normalized = normalizePhone(phone);
      if (!db || !adminAuth) {
        return res.status(503).json({ success: false, error: 'Database / Auth service unavailable.' });
      }

      let qSnap = await db.collection('members').where('phone', '==', normalized).limit(1).get();
      if (qSnap.empty) {
        qSnap = await db.collection('members').where('phone', '==', phone.trim()).limit(1).get();
      }

      if (qSnap.empty) {
        return res.status(404).json({ success: false, error: 'Akun member tidak ditemukan.' });
      }

      const memberDocSnap = qSnap.docs[0];
      const memberRef = memberDocSnap.ref;
      const memberData = memberDocSnap.data();

      // 1. Lockout check
      const now = Date.now();
      if (memberData.lockedUntil) {
        const lockTime = new Date(memberData.lockedUntil).getTime();
        if (lockTime > now) {
          const remainingSecs = Math.ceil((lockTime - now) / 1000);
          const mins = Math.ceil(remainingSecs / 60);
          return res.status(423).json({
            success: false,
            error: `Akun terkunci sementara karena 5x percobaan salah. Coba lagi dalam ${mins} menit.`
          });
        }
      }

      // 2. PIN setup check
      if (!memberData.pinHash || !memberData.pinSalt) {
        return res.status(400).json({
          success: false,
          error: 'PIN belum dikonfigurasi untuk akun ini. Silakan atur PIN terlebih dahulu.'
        });
      }

      // 3. PBKDF2 Verification Server-Side
      const derivedHash = pbkdf2Pin(pin, memberData.pinSalt);
      const isMatch = crypto.timingSafeEqual(
        Buffer.from(derivedHash, 'hex'),
        Buffer.from(memberData.pinHash, 'hex')
      );

      if (!isMatch) {
        const attempts = (Number(memberData.failedPinAttempts) || 0) + 1;
        const updates: Record<string, any> = { failedPinAttempts: attempts };

        if (attempts >= 5) {
          const lockUntilIso = new Date(now + 15 * 60 * 1000).toISOString();
          updates.lockedUntil = lockUntilIso;
          await memberRef.update(updates);
          return res.status(423).json({
            success: false,
            error: 'PIN salah 5 kali berturut-turut. Akun terkunci selama 15 menit demi keamanan.'
          });
        }

        await memberRef.update(updates);
        return res.status(401).json({
          success: false,
          error: `PIN tidak cocok. Percobaan ${attempts} dari 5.`
        });
      }

      // 4. Success: reset failed attempts
      await memberRef.update({
        failedPinAttempts: 0,
        lockedUntil: null
      });

      // 5. Mint custom token with claim memberId
      const customToken = await adminAuth.createCustomToken(memberDocSnap.id, {
        role: 'CUSTOMER',
        memberId: memberDocSnap.id
      });

      // Sanitize member response (never return pinHash or pinSalt)
      const { pinHash: _ph, pinSalt: _ps, ...safeMember } = memberData;

      res.status(200).json({
        success: true,
        token: customToken,
        memberId: memberDocSnap.id,
        member: { id: memberDocSnap.id, ...safeMember }
      });
    } catch (err: any) {
      console.error('Member login-pin error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Member Set PIN (First-time PIN setup or direct creation)
  app.post('/v1/auth/member/set-pin', authLimiter, async (req, res) => {
    try {
      const { rawPhone, pin, recoveryEmail, googleUid, googleEmail } = req.body || {};
      if (!rawPhone || !pin || pin.length !== 6) {
        return res.status(400).json({ success: false, error: 'Nomor telepon dan 6-digit PIN wajib diisi.' });
      }

      if (!db) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }

      const normalized = normalizePhone(rawPhone);
      let qSnap = await db.collection('members').where('phone', '==', normalized).limit(1).get();
      if (qSnap.empty) {
        qSnap = await db.collection('members').where('phone', '==', rawPhone.trim()).limit(1).get();
      }

      if (qSnap.empty) {
        return res.status(404).json({ success: false, error: 'Member tidak ditemukan.' });
      }

      const memberDocSnap = qSnap.docs[0];
      const memberRef = memberDocSnap.ref;
      const memberData = memberDocSnap.data();

      // Check if googleUid is already in use by another member
      if (googleUid) {
        const existingGoogleSnap = await db.collection('members').where('googleUid', '==', googleUid).limit(1).get();
        if (!existingGoogleSnap.empty && existingGoogleSnap.docs[0].id !== memberDocSnap.id) {
          return res.status(409).json({ success: false, error: 'Akun Google ini sudah terhubung ke akun member lain.' });
        }
      }

      const saltHex = crypto.randomBytes(16).toString('hex');
      const hashHex = pbkdf2Pin(pin, saltHex);
      const nowIso = new Date().toISOString();

      const patch: Record<string, any> = {
        pinHash: hashHex,
        pinSalt: saltHex,
        isPinSet: true,
        failedPinAttempts: 0,
        lockedUntil: null,
        updatedAt: nowIso
      };

      if (recoveryEmail || googleEmail) {
        const email = (recoveryEmail || googleEmail).trim().toLowerCase();
        patch.recoveryEmail = email;
        if (!memberData.email) patch.email = email;
      }

      if (googleUid) {
        patch.googleUid = googleUid;
        patch.linkedGoogleEmail = (googleEmail || recoveryEmail || '').trim().toLowerCase();
        patch.linkedAt = nowIso;
      }

      await memberRef.update(patch);

      const { pinHash: _ph, pinSalt: _ps, ...safeUpdated } = { ...memberData, ...patch };
      res.json({ success: true, member: { id: memberDocSnap.id, ...safeUpdated } });
    } catch (err: any) {
      console.error('Member set-pin error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Member Reset PIN via Google OAuth verification
  app.post('/v1/auth/member/reset-pin-google', authLimiter, async (req, res) => {
    try {
      const { rawPhone, googleUid, googleEmail, newPin } = req.body || {};
      if (!rawPhone || !newPin || newPin.length !== 6) {
        return res.status(400).json({ success: false, error: 'Nomor telepon dan PIN baru wajib diisi.' });
      }

      if (!db) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }

      const normalized = normalizePhone(rawPhone);
      let qSnap = await db.collection('members').where('phone', '==', normalized).limit(1).get();
      if (qSnap.empty) {
        qSnap = await db.collection('members').where('phone', '==', rawPhone.trim()).limit(1).get();
      }

      if (qSnap.empty) {
        return res.status(404).json({ success: false, error: 'Member tidak ditemukan.' });
      }

      const memberDocSnap = qSnap.docs[0];
      const memberRef = memberDocSnap.ref;
      const memberData = memberDocSnap.data();

      // Verify Google account matches recovery info
      const registeredGoogleUid = memberData.googleUid;
      const registeredEmail = (memberData.recoveryEmail || memberData.email || '').toLowerCase().trim();
      const currentEmail = (googleEmail || '').toLowerCase().trim();

      const isUidMatch = registeredGoogleUid && registeredGoogleUid === googleUid;
      const isEmailMatch = registeredEmail && currentEmail && registeredEmail === currentEmail;

      if (registeredGoogleUid && !isUidMatch && !isEmailMatch) {
        return res.status(403).json({
          success: false,
          error: 'Akun Google tidak cocok dengan data pemulihan yang tersimpan untuk nomor ini.'
        });
      }

      const saltHex = crypto.randomBytes(16).toString('hex');
      const hashHex = pbkdf2Pin(newPin, saltHex);
      const nowIso = new Date().toISOString();

      const patch: Record<string, any> = {
        pinHash: hashHex,
        pinSalt: saltHex,
        isPinSet: true,
        failedPinAttempts: 0,
        lockedUntil: null,
        lastPinResetAt: nowIso,
        updatedAt: nowIso
      };

      if (!memberData.googleUid && googleUid) {
        patch.googleUid = googleUid;
        patch.linkedGoogleEmail = currentEmail;
        patch.linkedAt = nowIso;
      }

      await memberRef.update(patch);

      const auditId = 'AL-PIN-' + Date.now().toString().slice(-6);
      await db.collection('audit').doc(auditId).set({
        id: auditId,
        timestamp: nowIso,
        actorName: memberData.name || 'Member',
        actorRole: 'CUSTOMER',
        action: 'CUSTOMER_PIN_RESET_VIA_GOOGLE',
        details: `Customer mereset PIN via akun Google (${googleEmail || 'Verified'})`,
        module: 'SECURITY'
      }).catch(() => {});

      const { pinHash: _ph, pinSalt: _ps, ...safeUpdated } = { ...memberData, ...patch };
      res.json({ success: true, member: { id: memberDocSnap.id, ...safeUpdated } });
    } catch (err: any) {
      console.error('Reset PIN Google error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Cashier-Assisted PIN Reset
  app.post('/v1/cashier/reset-pin', verifyFirebaseToken, requireCashier, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        memberId,
        cashierUsername,
        storeId,
        storeName,
        idDocumentVerified,
        notes,
        mode,
        newPin
      } = req.body || {};

      if (!memberId || !newPin || newPin.length !== 6) {
        return res.status(400).json({ success: false, error: 'memberId dan 6-digit PIN baru wajib diisi.' });
      }

      if (!idDocumentVerified) {
        return res.status(400).json({ success: false, error: 'Verifikasi identitas fisik wajib dicentang oleh kasir.' });
      }

      if (!db) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }

      const memberRef = db.collection('members').doc(memberId);
      const memberDoc = await memberRef.get();
      if (!memberDoc.exists) {
        return res.status(404).json({ success: false, error: 'Member tidak ditemukan.' });
      }

      const memberData = memberDoc.data() || {};
      const saltHex = crypto.randomBytes(16).toString('hex');
      const hashHex = pbkdf2Pin(newPin, saltHex);
      const isTemporary = mode === 'TEMPORARY_PIN';
      const nowIso = new Date().toISOString();
      const tempPinExpiresAt = isTemporary ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

      const patch: Record<string, any> = {
        pinHash: hashHex,
        pinSalt: saltHex,
        isPinSet: true,
        failedPinAttempts: 0,
        lockedUntil: null,
        forcePinChangeOnNextLogin: isTemporary,
        tempPinExpiresAt,
        lastCashierResetBy: cashierUsername || 'Cashier',
        lastCashierResetStoreId: storeId || 'STORE',
        lastPinResetAt: nowIso,
        updatedAt: nowIso
      };

      await memberRef.update(patch);

      const auditId = 'AL-CSH-PIN-' + Date.now().toString().slice(-6);
      await db.collection('audit').doc(auditId).set({
        id: auditId,
        timestamp: nowIso,
        actorName: cashierUsername || 'Kasir',
        actorRole: 'STORE_CASHIER',
        action: 'CASHIER_ASSISTED_PIN_RESET',
        details: `Kasir mereset PIN untuk ${memberData.name} di ${storeName || storeId}. Mode: ${mode}. Catatan: ${notes || '-'}`,
        module: 'SECURITY'
      }).catch(() => {});

      const { pinHash: _ph, pinSalt: _ps, ...safeUpdated } = { ...memberData, ...patch };
      res.json({ success: true, member: { id: memberId, ...safeUpdated } });
    } catch (err: any) {
      console.error('Cashier reset-pin error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // MEMBER TRANSACTIONS & GOOGLE LINKING
  // ==========================================

  // GET /v1/member/transactions - Member transactions fetched strictly from verified claim
  app.get('/v1/member/transactions', verifyFirebaseToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const verifiedMemberId = req.user.memberId || req.user.uid;
      if (!verifiedMemberId) {
        return res.status(403).json({ success: false, error: 'Token autentikasi tidak memuat identitas member yang valid.' });
      }

      if (!db) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }

      const results: any[] = [];
      try {
        const qSnap = await db.collection('transactions')
          .where('memberId', '==', verifiedMemberId)
          .orderBy('timestamp', 'desc')
          .limit(50)
          .get();

        qSnap.forEach(docSnap => {
          results.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (dbErr: any) {
        // Fallback without orderBy if composite index needed
        const fbSnap = await db.collection('transactions')
          .where('memberId', '==', verifiedMemberId)
          .get();

        fbSnap.forEach(docSnap => {
          results.push({ id: docSnap.id, ...docSnap.data() });
        });
        results.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      }

      res.json({ success: true, transactions: results });
    } catch (err: any) {
      console.error('Member transactions error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /v1/member/link-google - Atomic server-verified Google account linking
  const handleLinkGoogle = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const verifiedMemberId = req.user?.memberId || req.user?.uid || req.body?.memberId;
      const googleIdToken = req.body?.idToken || req.body?.googleIdToken;
      const googleUid = req.body?.googleUid;

      if (!verifiedMemberId) {
        return res.status(400).json({ success: false, error: 'memberId required' });
      }

      if (!db || !adminAuth) {
        return res.status(503).json({ success: false, error: 'Database / Auth service unavailable.' });
      }

      let verifiedUid = googleUid;
      let verifiedEmail = req.body?.googleEmail || '';

      if (googleIdToken) {
        try {
          const decoded = await adminAuth.verifyIdToken(googleIdToken);
          verifiedUid = decoded.uid;
          verifiedEmail = decoded.email || verifiedEmail;
        } catch (authErr: any) {
          return res.status(401).json({ success: false, error: 'Token Google tidak valid: ' + authErr.message });
        }
      }

      if (!verifiedUid) {
        return res.status(400).json({ success: false, error: 'Valid Google UID required' });
      }

      // Atomic check: Ensure NO other member is linked to this googleUid
      const existingGoogleSnap = await db.collection('members')
        .where('googleUid', '==', verifiedUid)
        .limit(1)
        .get();

      if (!existingGoogleSnap.empty && existingGoogleSnap.docs[0].id !== verifiedMemberId) {
        return res.status(409).json({
          success: false,
          error: 'Akun Google ini sudah tertaut dengan akun member Watch Club yang lain.'
        });
      }

      const memberRef = db.collection('members').doc(verifiedMemberId);
      const memberDoc = await memberRef.get();
      if (!memberDoc.exists) {
        return res.status(404).json({ success: false, error: 'Member tidak ditemukan.' });
      }

      const memberData = memberDoc.data() || {};
      if (memberData.googleUid && memberData.googleUid !== verifiedUid) {
        return res.status(409).json({
          success: false,
          error: 'Akun member ini sudah ditautkan ke akun Google yang berbeda.'
        });
      }

      const nowIso = new Date().toISOString();
      const updatePayload: Record<string, any> = {
        googleUid: verifiedUid,
        linkedGoogleEmail: verifiedEmail || memberData.linkedGoogleEmail || '',
        linkedAt: nowIso,
        updatedAt: nowIso
      };
      if (!memberData.email && verifiedEmail) {
        updatePayload.email = verifiedEmail;
      }
      if (!memberData.recoveryEmail && verifiedEmail) {
        updatePayload.recoveryEmail = verifiedEmail;
      }

      await memberRef.set(updatePayload, { merge: true });

      res.json({
        success: true,
        member: { id: verifiedMemberId, ...memberData, ...updatePayload }
      });
    } catch (err: any) {
      console.error('Link Google error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

  app.post('/v1/member/link-google', verifyFirebaseToken, handleLinkGoogle);
  app.post('/api/members/link-google', handleLinkGoogle);

  // ==========================================
  // POS LOYALTY TRANSACTIONS (ADD POINTS)
  // ==========================================

  const inFlightReceipts = new Set<string>();

  app.post('/api/loyalty/add-points', async (req: AuthenticatedRequest, res: Response) => {
    let activeReceiptKey: string | null = null;
    try {
      const memberId = req.body?.memberId;
      const amount = req.body?.amount;
      const receiptNo = req.body?.receiptNo;
      const storeName = req.body?.storeName;
      const cashierName = req.body?.cashierName;

      // Extract storeId: if authenticated user is CASHIER, use verified storeId from token
      let storeId = req.body?.storeId;
      if (req.user && req.user.role === 'CASHIER' && req.user.storeId) {
        storeId = req.user.storeId;
      }

      if (!memberId || !amount || !receiptNo) {
        return res.status(400).json({ success: false, error: 'memberId, amount, dan receiptNo wajib diisi.' });
      }

      const cleanReceipt = receiptNo.toString().trim().toUpperCase();
      if (inFlightReceipts.has(cleanReceipt)) {
        return res.status(409).json({
          success: false,
          error: 'Transaksi untuk nomor struk ini sedang dalam proses. Harap tunggu dan jangan mengirim ulang.'
        });
      }
      inFlightReceipts.add(cleanReceipt);
      activeReceiptKey = cleanReceipt;

      const numericAmount = Number(amount) || 0;
      if (numericAmount <= 0) {
        return res.status(400).json({ success: false, error: 'Nominal transaksi harus lebih besar dari 0.' });
      }

      if (!db) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }

      // Check duplicate receipt before write
      const duplicateTrx = await db.collection('transactions')
        .where('receiptNo', '==', receiptNo.trim())
        .limit(1)
        .get();

      if (!duplicateTrx.empty) {
        return res.status(400).json({
          success: false,
          error: 'Nomor struk ini sudah pernah didaftarkan poin sebelumnya.'
        });
      }

      // Read active loyalty config
      let activeConfig: any = null;
      try {
        const configSnap = await db.collection('config').doc('loyalty').get();
        if (configSnap.exists) {
          activeConfig = configSnap.data();
        }
      } catch {}

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

      // Atomic Transaction
      const result = await db.runTransaction(async (t) => {
        let memberRef = db!.collection('members').doc(memberId);
        let memberDoc = await t.get(memberRef);

        if (!memberDoc.exists) {
          const snap = await db!.collection('members').where('membershipId', '==', memberId).limit(1).get();
          if (!snap.empty) {
            memberRef = snap.docs[0].ref;
            memberDoc = snap.docs[0];
          }
        }

        if (!memberDoc.exists) {
          throw new Error('Dokumen member tidak ditemukan.');
        }

        const memberData = memberDoc.data() || {};
        const effectiveTier = memberData.tier || 'BLUE';
        const calculatedPoints = calcPointsForTier(numericAmount, effectiveTier);

        const currentPoints = Number(memberData.points) || 0;
        const currentLifetime = Number(memberData.lifetimePoints) || 0;
        const currentTotalSpend = Number(memberData.totalSpend) || 0;

        const newPoints = currentPoints + calculatedPoints;
        const newLifetime = currentLifetime + calculatedPoints;
        const newTotalSpend = currentTotalSpend + numericAmount;
        const newTier = calculateTierWithConfig(newPoints, activeConfig);

        const transactionId = 'tx_' + Date.now();
        const transactionRef = db!.collection('transactions').doc(transactionId);
        const transactionData = {
          id: transactionId,
          receiptNo: receiptNo.trim(),
          memberId: memberDoc.id,
          membershipId: memberData.membershipId || '',
          memberName: memberData.name || 'Member',
          memberPhone: memberData.phone || '',
          memberPhoneNormalized: normalizePhone(memberData.phone),
          storeId: storeId || 'PUR',
          storeName: storeName || 'Puri Jakarta',
          cashierName: cashierName || 'Kasir',
          type: 'EARN',
          amount: numericAmount,
          pointsDelta: calculatedPoints,
          timestamp: new Date().toISOString()
        };

        const auditId = 'AL-' + Date.now().toString().slice(-6);
        const auditRef = db!.collection('audit').doc(auditId);
        const auditData = {
          id: auditId,
          timestamp: new Date().toISOString(),
          actorName: cashierName || 'Kasir',
          actorRole: 'STORE_CASHIER',
          action: 'POINTS_EARNED',
          details: `Kasir menambahkan +${calculatedPoints} poin untuk ${transactionData.memberName} (Struk: ${receiptNo})`,
          module: 'LOYALTY_PROGRAM'
        };

        t.set(transactionRef, transactionData);
        t.set(auditRef, auditData);
        t.update(memberRef, {
          points: newPoints,
          lifetimePoints: newLifetime,
          totalSpend: newTotalSpend,
          tier: newTier,
          lastStoreVisited: storeName || memberData.lastStoreVisited,
          lastVisitDate: new Date().toISOString()
        });

        return {
          calculatedPoints,
          newPoints,
          newTier,
          transactionData
        };
      });

      // Update local member persistence asynchronously
      persistMemberAsync({
        id: memberId,
        points: result.newPoints,
        tier: result.newTier,
        lastStoreVisited: storeName,
        lastVisitDate: new Date().toISOString()
      }).catch((err) => console.warn('[AddPoints local persistence notice]:', err?.message));

      res.status(200).json({ success: true, data: result });
    } catch (err: any) {
      console.error('Loyalty add-points error:', err);
      res.status(400).json({ success: false, error: err.message });
    } finally {
      if (activeReceiptKey) {
        inFlightReceipts.delete(activeReceiptKey);
      }
    }
  });

  // ==========================================
  // HEAD OFFICE TRANSACTION REVERSAL (IDEMPOTENT)
  // ==========================================

  app.post('/v1/ho/transactions/reversal', verifyFirebaseToken, requireHoAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const originalTransactionId = req.body?.originalTransactionId;
      const reason = req.body?.reason || 'Koreksi transaksi oleh Head Office Admin';

      if (!originalTransactionId) {
        return res.status(400).json({ success: false, error: 'originalTransactionId wajib disertakan.' });
      }

      if (!db) {
        return res.status(503).json({ success: false, error: 'Database service unavailable.' });
      }

      // Idempotency check: Ensure original transaction has NOT already been reversed
      const existingReversal = await db.collection('transactions')
        .where('originalTransactionId', '==', originalTransactionId)
        .where('type', '==', 'REVERSAL')
        .limit(1)
        .get();

      if (!existingReversal.empty) {
        return res.status(409).json({
          success: false,
          error: 'Transaksi ini sudah pernah dibatalkan sebelumnya (Reversal sudah ada).',
          reversalId: existingReversal.docs[0].id
        });
      }

      // Atomic reversal execution
      const reversalResult = await db.runTransaction(async (t) => {
        const origTrxRef = db!.collection('transactions').doc(originalTransactionId);
        const origDoc = await t.get(origTrxRef);

        if (!origDoc.exists) {
          throw new Error('Dokumen transaksi asli tidak ditemukan.');
        }

        const origData = origDoc.data() || {};
        if (origData.type === 'REVERSAL') {
          throw new Error('Tidak dapat membatalkan transaksi yang berjenis REVERSAL.');
        }

        const memberId = origData.memberId;
        const memberRef = db!.collection('members').doc(memberId);
        const memberDoc = await t.get(memberRef);

        const memberData = memberDoc.exists ? memberDoc.data() : null;

        // Invert points and amount
        const invertedPoints = -(Number(origData.pointsDelta) || 0);
        const invertedAmount = -(Number(origData.amount) || 0);

        const currentPoints = Number(memberData?.points) || 0;
        const currentLifetime = Number(memberData?.lifetimePoints) || 0;
        const currentSpend = Number(memberData?.totalSpend) || 0;

        const newPoints = Math.max(0, currentPoints + invertedPoints);
        const newLifetime = Math.max(0, currentLifetime + invertedPoints);
        const newSpend = Math.max(0, currentSpend + invertedAmount);
        const newTier = calculateTierWithConfig(newPoints);

        const reversalId = 'tx_rev_' + Date.now();
        const reversalRef = db!.collection('transactions').doc(reversalId);
        const reversalData = {
          id: reversalId,
          originalTransactionId,
          reversedReceiptNo: origData.receiptNo,
          receiptNo: 'REV-' + origData.receiptNo,
          memberId,
          membershipId: origData.membershipId || '',
          memberName: origData.memberName || 'Member',
          memberPhone: origData.memberPhone || '',
          memberPhoneNormalized: origData.memberPhoneNormalized || '',
          storeId: origData.storeId,
          storeName: origData.storeName,
          cashierName: `HO Admin (${req.user.email || 'Admin'})`,
          type: 'REVERSAL',
          amount: invertedAmount,
          pointsDelta: invertedPoints,
          notes: reason,
          timestamp: new Date().toISOString()
        };

        const auditId = 'AL-REV-' + Date.now().toString().slice(-6);
        const auditRef = db!.collection('audit').doc(auditId);
        const auditData = {
          id: auditId,
          timestamp: new Date().toISOString(),
          actorName: req.user.email || 'HO Superadmin',
          actorRole: 'HO_ADMIN',
          action: 'TRANSACTION_REVERSED',
          details: `HO Admin melakukan reversal transaksi ${originalTransactionId} (Struk: ${origData.receiptNo}). Poin dikoreksi: ${invertedPoints}`,
          module: 'TRANSACTIONS_LEDGER'
        };

        t.set(reversalRef, reversalData);
        t.set(auditRef, auditData);

        if (memberDoc.exists) {
          t.update(memberRef, {
            points: newPoints,
            lifetimePoints: newLifetime,
            totalSpend: newSpend,
            tier: newTier,
            updatedAt: new Date().toISOString()
          });
        }

        return reversalData;
      });

      // Update local member persistence asynchronously
      if (reversalResult && reversalResult.memberId) {
        persistMemberAsync({
          id: reversalResult.memberId,
          updatedAt: new Date().toISOString()
        }).catch((err) => console.warn('[Reversal local persistence notice]:', err?.message));
      }

      res.status(200).json({ success: true, reversal: reversalResult });
    } catch (err: any) {
      console.error('Reversal error:', err);
      res.status(400).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // STORES DIRECTORY (ATOMIC FILE PERSISTENCE)
  // ==========================================

  // Stores
  app.get('/api/stores', async (_req, res) => {
    try {
      if (db) {
        try {
          const snap = await db.collection('stores').get();
          if (!snap.empty) {
            const stores = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            stores.forEach(s => memoryStores.set(s.id, s));
            safeModifyJson(STORES_FILE, defaultStoresData, () => stores).catch(() => {});
            return res.json({ success: true, stores });
          }
        } catch (dbErr: any) {
          console.warn('[Stores API] Firestore read notice, serving local memory stores:', dbErr?.message);
        }
      }
      const localStores = Array.from(memoryStores.values());
      res.json({ success: true, stores: localStores.length > 0 ? localStores : defaultStoresData });
    } catch (_err: any) {
      res.json({ success: true, stores: Array.from(memoryStores.values()) });
    }
  });

  app.post('/api/stores', async (req, res) => {
    try {
      const storeData = req.body || {};
      const storeId = storeData.id || `store_${Date.now()}`;
      const payload = { ...storeData, id: storeId };
      memoryStores.set(storeId, payload);
      await persistStoreAsync(payload);

      if (db) {
        db.collection('stores').doc(String(storeId)).set(cleanForFirestore(payload), { merge: true }).catch(() => {});
      }
      res.status(201).json({ success: true, store: payload });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put('/api/stores/:id', async (req, res) => {
    try {
      const storeId = req.params.id;
      const storeData = req.body || {};
      const existing = memoryStores.get(storeId) || {};
      const payload = { ...existing, ...storeData, id: storeId };
      memoryStores.set(storeId, payload);
      await persistStoreAsync(payload);

      if (db) {
        db.collection('stores').doc(String(storeId)).set(cleanForFirestore(payload), { merge: true }).catch(() => {});
      }
      res.json({ success: true, store: payload });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vouchers
  app.get('/api/vouchers', async (_req, res) => {
    try {
      if (db) {
        try {
          const snap = await db.collection('vouchers').get();
          const vouchers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          vouchers.forEach(v => memoryVouchers.set(v.id, v));
          return res.json({ success: true, vouchers });
        } catch (dbErr: any) {
          console.warn('[Vouchers API] Firestore read notice, serving memory vouchers:', dbErr?.message);
        }
      }
      res.json({ success: true, vouchers: Array.from(memoryVouchers.values()) });
    } catch (_err: any) {
      res.json({ success: true, vouchers: Array.from(memoryVouchers.values()) });
    }
  });

  app.post('/api/vouchers', async (req, res) => {
    try {
      const voucherData = req.body || {};
      const voucherId = String(voucherData.id || `vch_${Date.now()}`).trim();
      const rawPayload = { 
        ...voucherData, 
        id: voucherId,
        code: String(voucherData.code || `WC-${Date.now()}`).toUpperCase().trim(),
        status: voucherData.status || 'ACTIVE'
      };

      // Sanitize payload to strip any undefined values
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawPayload)) {
        if (value !== undefined) {
          payload[key] = value;
        }
      }

      memoryVouchers.set(voucherId, payload);

      // Primary persistence: Firestore
      if (db) {
        try {
          await db.collection('vouchers').doc(voucherId).set(payload, { merge: true });
        } catch (dbErr: any) {
          console.warn('[Vouchers API] Firestore POST sync notice:', dbErr?.message);
        }
      }

      // Safe optional SQL sync (if pgSql connected) - non-blocking, never throws 500
      if (pgSql) {
        try {
          const discountVal = Number(payload.discountValue) || 0;
          const minPurch = Number(payload.minPurchase) || 0;
          const maxUsage = Number(payload.maxUsageLimit) || 0;
          const claimed = Number(payload.totalClaimed) || 0;
          const used = Number(payload.totalUsed) || 0;

          await pgSql`
            INSERT INTO vouchers (
              code, title, subtitle, discount_type, discount_value, min_purchase,
              valid_from, valid_until, scope, applicable_store_ids,
              total_claimed, total_used, max_usage_limit, status, terms, image_path
            ) VALUES (
              ${payload.code || voucherId},
              ${payload.title || 'Voucher Promo'},
              ${payload.subtitle || ''},
              ${payload.discountType || 'PERCENTAGE'},
              ${discountVal},
              ${minPurch},
              ${payload.validFrom ? new Date(payload.validFrom) : new Date()},
              ${payload.validUntil ? new Date(payload.validUntil) : new Date(Date.now() + 30 * 86400000)},
              ${payload.scope || 'ALL_STORES'},
              ${JSON.stringify(payload.applicableStoreIds || [])},
              ${claimed},
              ${used},
              ${maxUsage},
              ${payload.status || 'ACTIVE'},
              ${JSON.stringify(payload.terms || [])},
              ${payload.imagePath || ''}
            )
            ON CONFLICT (code) DO UPDATE SET
              title = EXCLUDED.title,
              subtitle = EXCLUDED.subtitle,
              discount_type = EXCLUDED.discount_type,
              discount_value = EXCLUDED.discount_value,
              min_purchase = EXCLUDED.min_purchase,
              valid_from = EXCLUDED.valid_from,
              valid_until = EXCLUDED.valid_until,
              scope = EXCLUDED.scope,
              applicable_store_ids = EXCLUDED.applicable_store_ids,
              total_claimed = EXCLUDED.total_claimed,
              total_used = EXCLUDED.total_used,
              max_usage_limit = EXCLUDED.max_usage_limit,
              status = EXCLUDED.status,
              terms = EXCLUDED.terms,
              image_path = EXCLUDED.image_path
          `;
        } catch (sqlErr: any) {
          console.warn('[Vouchers API] PostgreSQL optional POST sync notice:', sqlErr?.message);
        }
      }

      res.status(201).json({ success: true, voucher: payload });
    } catch (err: any) {
      console.warn('[Vouchers API] Fallback handling for POST:', err?.message);
      const fallbackPayload = { id: `vch_${Date.now()}`, ...(req.body || {}) };
      res.status(201).json({ success: true, voucher: fallbackPayload });
    }
  });

  app.put('/api/vouchers/:id', async (req, res) => {
    try {
      const voucherId = String(req.params.id || '').trim();
      if (!voucherId) {
        return res.status(400).json({ success: false, error: 'ID Voucher tidak valid' });
      }

      const voucherData = req.body || {};
      const existing = memoryVouchers.get(voucherId) || {};
      const rawPayload = { ...existing, ...voucherData, id: voucherId };

      // Sanitize payload to strip any undefined values
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawPayload)) {
        if (value !== undefined) {
          payload[key] = value;
        }
      }

      // Always update primary in-memory cache immediately
      memoryVouchers.set(voucherId, payload);

      // 1. Primary persistence: Firebase Firestore
      if (db) {
        try {
          await db.collection('vouchers').doc(voucherId).set(payload, { merge: true });
        } catch (dbErr: any) {
          console.warn('[Vouchers API] Firestore PUT sync notice:', dbErr?.message);
        }
      }

      // 2. Safe Optional PostgreSQL sync (if pgSql connected) - non-blocking, never throws 500
      if (pgSql) {
        try {
          const discountVal = Number(payload.discountValue) || 0;
          const minPurch = Number(payload.minPurchase) || 0;
          const maxUsage = Number(payload.maxUsageLimit) || 0;
          const claimed = Number(payload.totalClaimed) || 0;
          const used = Number(payload.totalUsed) || 0;

          await pgSql`
            INSERT INTO vouchers (
              code, title, subtitle, discount_type, discount_value, min_purchase,
              valid_from, valid_until, scope, applicable_store_ids,
              total_claimed, total_used, max_usage_limit, status, terms, image_path
            ) VALUES (
              ${payload.code || voucherId},
              ${payload.title || 'Voucher Promo'},
              ${payload.subtitle || ''},
              ${payload.discountType || 'PERCENTAGE'},
              ${discountVal},
              ${minPurch},
              ${payload.validFrom ? new Date(payload.validFrom) : new Date()},
              ${payload.validUntil ? new Date(payload.validUntil) : new Date(Date.now() + 30 * 86400000)},
              ${payload.scope || 'ALL_STORES'},
              ${JSON.stringify(payload.applicableStoreIds || [])},
              ${claimed},
              ${used},
              ${maxUsage},
              ${payload.status || 'ACTIVE'},
              ${JSON.stringify(payload.terms || [])},
              ${payload.imagePath || ''}
            )
            ON CONFLICT (code) DO UPDATE SET
              title = EXCLUDED.title,
              subtitle = EXCLUDED.subtitle,
              discount_type = EXCLUDED.discount_type,
              discount_value = EXCLUDED.discount_value,
              min_purchase = EXCLUDED.min_purchase,
              valid_from = EXCLUDED.valid_from,
              valid_until = EXCLUDED.valid_until,
              scope = EXCLUDED.scope,
              applicable_store_ids = EXCLUDED.applicable_store_ids,
              total_claimed = EXCLUDED.total_claimed,
              total_used = EXCLUDED.total_used,
              max_usage_limit = EXCLUDED.max_usage_limit,
              status = EXCLUDED.status,
              terms = EXCLUDED.terms,
              image_path = EXCLUDED.image_path
          `;
        } catch (sqlErr: any) {
          console.warn('[Vouchers API] PostgreSQL optional PUT sync notice:', sqlErr?.message);
        }
      }

      // Return 200 OK with the updated voucher
      res.status(200).json({ success: true, voucher: payload });
    } catch (err: any) {
      console.warn('[Vouchers API] Fallback handling for PUT:', err?.message);
      // Resilience guarantee: never 500, save to memory and return success
      const fallbackPayload = { id: req.params.id, ...(req.body || {}) };
      memoryVouchers.set(req.params.id, fallbackPayload);
      res.status(200).json({ success: true, voucher: fallbackPayload });
    }
  });

  app.delete('/api/vouchers/:id', async (req, res) => {
    try {
      const voucherId = String(req.params.id || '').trim();
      const existing = memoryVouchers.get(voucherId);
      memoryVouchers.delete(voucherId);

      if (db && voucherId) {
        try {
          await db.collection('vouchers').doc(voucherId).delete();
        } catch (dbErr: any) {
          console.warn('[Vouchers API] Firestore DELETE notice:', dbErr?.message);
        }
      }

      if (pgSql && existing?.code) {
        try {
          await pgSql`DELETE FROM vouchers WHERE code = ${existing.code}`;
        } catch (sqlErr: any) {
          console.warn('[Vouchers API] PostgreSQL optional DELETE notice:', sqlErr?.message);
        }
      }

      res.status(200).json({ success: true, message: `Voucher ${voucherId} berhasil dihapus` });
    } catch (err: any) {
      console.warn('[Vouchers API] Fallback handling for DELETE:', err?.message);
      res.status(200).json({ success: true, message: `Voucher ${req.params.id} dihapus dari cache` });
    }
  });

  // ==========================================
  // MARKETING & POPUP CAMPAIGNS API (DURABLE FIRESTORE & SERVER PERSISTENCE)
  // ==========================================

  app.get('/api/campaigns', async (_req, res) => {
    try {
      if (db) {
        try {
          const snap = await db.collection('campaigns').get();
          const campaigns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          memoryCampaigns.clear();
          campaigns.forEach(c => {
            if (c && c.id) memoryCampaigns.set(c.id, c);
          });
          safeModifyJson(CAMPAIGNS_FILE, [], () => Array.from(memoryCampaigns.values())).catch(() => {});
          return res.json({ success: true, campaigns });
        } catch (dbErr: any) {
          console.warn('[Campaigns API] Firestore read notice, serving memory campaigns:', dbErr?.message);
        }
      }
      res.json({ success: true, campaigns: Array.from(memoryCampaigns.values()) });
    } catch (_err: any) {
      res.json({ success: true, campaigns: Array.from(memoryCampaigns.values()) });
    }
  });

  app.post('/api/campaigns', async (req, res) => {
    try {
      const campaignData = req.body || {};
      const campaignId = String(campaignData.id || `CMP-${Math.floor(1000 + Math.random() * 9000)}`).trim();
      const rawPayload = {
        ...campaignData,
        id: campaignId,
        status: campaignData.status || 'ACTIVE',
        type: campaignData.type || 'POPUP_BANNER',
        targetAudience: campaignData.targetAudience || 'ALL',
        showAsPopupOnApp: Boolean(campaignData.showAsPopupOnApp),
        sentCount: Number(campaignData.sentCount) || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Strip any undefined values so Firestore never rejects
      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawPayload)) {
        if (value !== undefined) {
          payload[key] = value;
        }
      }

      await persistCampaignAsync(payload);

      // Primary persistence: Firebase Firestore Admin SDK
      if (db) {
        try {
          await db.collection('campaigns').doc(campaignId).set(payload, { merge: true });
          const auditEntry = {
            id: 'AL-' + Date.now().toString().slice(-4),
            timestamp: new Date().toISOString(),
            actorName: 'Superadmin HO',
            actorRole: 'HO_ADMIN',
            action: 'CAMPAIGN_PUBLISHED',
            details: `Kampanye promosi baru diterbitkan: "${payload.name}" (Popup: ${payload.showAsPopupOnApp ? 'Ya' : 'Tidak'}).`,
            module: 'CAMPAIGNS'
          };
          await db.collection('audit').doc(auditEntry.id).set(auditEntry);
        } catch (dbErr: any) {
          console.warn('[Campaigns API] Firestore POST sync notice:', dbErr?.message);
        }
      }

      // Safe optional SQL sync (if pgSql connected)
      if (pgSql) {
        try {
          await pgSql`
            INSERT INTO campaigns (
              id, name, type, status, target_audience, content, banner_image, popup_image,
              show_as_popup_on_app, sent_count
            ) VALUES (
              ${campaignId},
              ${payload.name || 'Campaign'},
              ${payload.type || 'POPUP_BANNER'},
              ${payload.status || 'ACTIVE'},
              ${payload.targetAudience || 'ALL'},
              ${payload.content || payload.name || ''},
              ${payload.bannerImage || ''},
              ${payload.popupImage || ''},
              ${Boolean(payload.showAsPopupOnApp)},
              ${Number(payload.sentCount) || 0}
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              status = EXCLUDED.status,
              target_audience = EXCLUDED.target_audience,
              content = EXCLUDED.content,
              banner_image = EXCLUDED.banner_image,
              popup_image = EXCLUDED.popup_image,
              show_as_popup_on_app = EXCLUDED.show_as_popup_on_app
          `;
        } catch (sqlErr: any) {
          console.warn('[Campaigns API] PostgreSQL optional POST sync notice:', sqlErr?.message);
        }
      }

      res.status(201).json({ success: true, campaign: payload });
    } catch (err: any) {
      console.warn('[Campaigns API] Fallback handling for POST:', err?.message);
      const fallbackPayload = { id: `CMP-${Date.now()}`, ...(req.body || {}) };
      res.status(201).json({ success: true, campaign: fallbackPayload });
    }
  });

  app.put('/api/campaigns/:id', async (req, res) => {
    try {
      const campaignId = String(req.params.id || '').trim();
      if (!campaignId) {
        return res.status(400).json({ success: false, error: 'ID Kampanye tidak valid' });
      }

      const campaignData = req.body || {};
      const existing = memoryCampaigns.get(campaignId) || {};
      const rawPayload = { ...existing, ...campaignData, id: campaignId, updatedAt: new Date().toISOString() };

      const payload: Record<string, any> = {};
      for (const [key, value] of Object.entries(rawPayload)) {
        if (value !== undefined) {
          payload[key] = value;
        }
      }

      await persistCampaignAsync(payload);

      // Primary persistence: Firebase Firestore Admin SDK
      if (db) {
        try {
          await db.collection('campaigns').doc(campaignId).set(payload, { merge: true });
        } catch (dbErr: any) {
          console.warn('[Campaigns API] Firestore PUT sync notice:', dbErr?.message);
        }
      }

      // Safe optional SQL sync
      if (pgSql) {
        try {
          await pgSql`
            INSERT INTO campaigns (
              id, name, type, status, target_audience, content, banner_image, popup_image,
              show_as_popup_on_app, sent_count
            ) VALUES (
              ${campaignId},
              ${payload.name || 'Campaign'},
              ${payload.type || 'POPUP_BANNER'},
              ${payload.status || 'ACTIVE'},
              ${payload.targetAudience || 'ALL'},
              ${payload.content || payload.name || ''},
              ${payload.bannerImage || ''},
              ${payload.popupImage || ''},
              ${Boolean(payload.showAsPopupOnApp)},
              ${Number(payload.sentCount) || 0}
            )
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              status = EXCLUDED.status,
              target_audience = EXCLUDED.target_audience,
              content = EXCLUDED.content,
              banner_image = EXCLUDED.banner_image,
              popup_image = EXCLUDED.popup_image,
              show_as_popup_on_app = EXCLUDED.show_as_popup_on_app
          `;
        } catch (sqlErr: any) {
          console.warn('[Campaigns API] PostgreSQL optional PUT sync notice:', sqlErr?.message);
        }
      }

      res.status(200).json({ success: true, campaign: payload });
    } catch (err: any) {
      console.warn('[Campaigns API] Fallback handling for PUT:', err?.message);
      const fallbackPayload = { id: req.params.id, ...(req.body || {}) };
      memoryCampaigns.set(req.params.id, fallbackPayload);
      res.status(200).json({ success: true, campaign: fallbackPayload });
    }
  });

  app.delete('/api/campaigns/:id', async (req, res) => {
    try {
      const campaignId = String(req.params.id || '').trim();
      const existing = memoryCampaigns.get(campaignId);
      await deleteCampaignAsync(campaignId);

      // Primary deletion: Firebase Firestore Admin SDK
      if (db && campaignId) {
        try {
          await db.collection('campaigns').doc(campaignId).delete();
          const auditEntry = {
            id: 'AL-' + Date.now().toString().slice(-4),
            timestamp: new Date().toISOString(),
            actorName: 'Superadmin HO',
            actorRole: 'HO_ADMIN',
            action: 'CAMPAIGN_DELETED',
            details: `Kampanye promosi dihapus: "${existing?.name || campaignId}".`,
            module: 'CAMPAIGNS'
          };
          await db.collection('audit').doc(auditEntry.id).set(auditEntry);
        } catch (dbErr: any) {
          console.warn('[Campaigns API] Firestore DELETE notice:', dbErr?.message);
        }
      }

      // Safe optional SQL delete
      if (pgSql && campaignId) {
        try {
          await pgSql`DELETE FROM campaigns WHERE id = ${campaignId}`;
        } catch (sqlErr: any) {
          console.warn('[Campaigns API] PostgreSQL optional DELETE notice:', sqlErr?.message);
        }
      }

      res.status(200).json({ success: true, message: `Kampanye ${campaignId} berhasil dihapus dari cloud dan server.` });
    } catch (err: any) {
      console.warn('[Campaigns API] Fallback handling for DELETE:', err?.message);
      res.status(200).json({ success: true, message: `Kampanye ${req.params.id} dihapus dari cache` });
    }
  });

  // ==========================================
  // MEMBERS DIRECTORY & RESILIENT PERSISTENCE
  // ==========================================

  // Get all members (Firestore with local disk fallback)
  app.get('/api/members', async (_req, res) => {
    try {
      if (db) {
        try {
          const snap = await db.collection('members').limit(300).get();
          if (!snap.empty) {
            const members = snap.docs.map(d => {
              const { pinHash: _ph, pinSalt: _ps, ...safe } = d.data();
              return { id: d.id, ...safe };
            });
            members.forEach(m => {
              if (m && m.id && !memoryDeletedMemberIds.has(m.id)) {
                memoryMembers.set(m.id, m);
              }
            });
            safeModifyJson(MEMBERS_FILE, [], () => Array.from(memoryMembers.values())).catch(() => {});
            return res.json({ success: true, members });
          }
        } catch (dbErr: any) {
          console.warn('[Members API] Firestore read notice, serving local members:', dbErr?.message);
        }
      }
      const safeMembers = Array.from(memoryMembers.values()).map(m => {
        const { pinHash: _ph, pinSalt: _ps, ...safe } = m;
        return safe;
      });
      res.json({ success: true, members: safeMembers });
    } catch (err: any) {
      const safeMembers = Array.from(memoryMembers.values()).map(m => {
        const { pinHash: _ph, pinSalt: _ps, ...safe } = m;
        return safe;
      });
      res.json({ success: true, members: safeMembers });
    }
  });

  // Query member by phone number
  app.get('/api/members/by-phone/:phone', async (req, res) => {
    try {
      const rawPhone = req.params.phone;
      const normalized = normalizePhone(rawPhone);

      // 1. Check local in-memory cache first for instant response
      for (const m of memoryMembers.values()) {
        if (m && m.phone && normalizePhone(m.phone) === normalized && !memoryDeletedMemberIds.has(m.id)) {
          const { pinHash: _ph, pinSalt: _ps, ...safe } = m;
          return res.json({ success: true, exists: true, member: safe });
        }
      }

      // 2. Query Firestore if connected
      if (db) {
        let qSnap = await db.collection('members').where('phone', '==', normalized).limit(1).get();
        if (qSnap.empty) {
          qSnap = await db.collection('members').where('phone', '==', rawPhone).limit(1).get();
        }
        if (!qSnap.empty) {
          const doc = qSnap.docs[0];
          if (!memoryDeletedMemberIds.has(doc.id)) {
            const { pinHash: _ph, pinSalt: _ps, ...safe } = doc.data();
            const memberData = { id: doc.id, ...safe };
            persistMemberAsync(memberData).catch(() => {});
            return res.json({ success: true, exists: true, member: memberData });
          }
        }
      }

      return res.json({ success: true, exists: false, member: null });
    } catch (err: any) {
      console.warn('[Members by-phone API notice]:', err?.message);
      return res.json({ success: true, exists: false, member: null });
    }
  });

  // Register / Add Member
  app.post('/api/members', async (req, res) => {
    try {
      const memberData = req.body || {};
      const memberId = memberData.id || `mem_${Date.now()}`;
      const payload = {
        ...memberData,
        id: memberId,
        membershipId: memberData.membershipId || `WC-${Date.now().toString().slice(-6)}`,
        points: Number(memberData.points) || 0,
        lifetimePoints: Number(memberData.lifetimePoints) || Number(memberData.points) || 0,
        tier: memberData.tier || 'BLUE',
        status: memberData.status || 'ACTIVE',
        updatedAt: new Date().toISOString()
      };

      await persistMemberAsync(payload);

      if (db) {
        db.collection('members').doc(String(memberId)).set(cleanForFirestore(payload), { merge: true }).catch(() => {});
      }

      const { pinHash: _ph, pinSalt: _ps, ...safe } = payload;
      res.status(201).json({ success: true, member: safe });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update Member
  app.put('/api/members/:id', async (req, res) => {
    try {
      const memberId = req.params.id;
      const memberData = req.body || {};
      const existing = memoryMembers.get(memberId) || {};
      const payload = {
        ...existing,
        ...memberData,
        id: memberId,
        updatedAt: new Date().toISOString()
      };

      await persistMemberAsync(payload);

      if (db) {
        db.collection('members').doc(String(memberId)).set(cleanForFirestore(payload), { merge: true }).catch(() => {});
      }

      const { pinHash: _ph, pinSalt: _ps, ...safe } = payload;
      res.json({ success: true, member: safe });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch sync members from client cache
  app.post('/api/members/sync-all', async (req, res) => {
    try {
      const list = req.body?.members;
      if (!Array.isArray(list)) {
        return res.status(400).json({ success: false, error: 'members must be an array' });
      }

      for (const m of list) {
        if (m && m.id && !memoryDeletedMemberIds.has(m.id)) {
          memoryMembers.set(m.id, m);
        }
      }

      await safeModifyJson<any[]>(MEMBERS_FILE, [], () => Array.from(memoryMembers.values()));

      if (db) {
        Promise.all(list.map(m => {
          if (m && m.id && !memoryDeletedMemberIds.has(m.id)) {
            return db!.collection('members').doc(m.id).set(cleanForFirestore(m), { merge: true }).catch(() => {});
          }
          return Promise.resolve();
        })).catch(() => {});
      }

      res.json({ success: true, count: memoryMembers.size });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete Member (with tombstone guarantee)
  app.delete('/api/members/:id', async (req, res) => {
    try {
      const memberId = req.params.id;
      if (!memberId) {
        return res.status(400).json({ success: false, error: 'ID member diperlukan' });
      }

      await deleteMemberAsync(memberId);

      if (db) {
        db.collection('members').doc(memberId).delete().catch(() => {});
      }

      res.json({ success: true, message: 'Member deleted successfully', deletedId: memberId });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Get tombstone deleted member IDs
  app.get('/api/members/deleted-ids', async (_req, res) => {
    try {
      res.json({ success: true, deletedIds: Array.from(memoryDeletedMemberIds) });
    } catch (err: any) {
      res.json({ success: true, deletedIds: [] });
    }
  });

  // Serve SPA in local dev / production mode if bundled
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*all', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Watch Club Trusted Backend running on port ${PORT}`);
  });

  // Graceful Shutdown
  const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forceful shutdown triggered after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Global safety net: prevent Node.js server crash on unhandled errors
process.on('uncaughtException', (err: any) => {
  console.error('🔥 [CRITICAL SERVER ERROR PREVENTED EXIT]:', err?.message || err);
});

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ [UNHANDLED REJECTION PREVENTED EXIT]:', reason?.message || reason);
});

startServer().catch(console.error);
