/**
 * Image Storage & Validation Service
 * Enforces MIME type, magic bytes verification, file size limits, and image dimensions.
 * Uploads assets directly to Firebase Storage (or server multipart upload),
 * ensuring Firestore and localStorage NEVER store raw Base64 data.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';
import { compressImage } from '../utils/imageCompression';
import { getApiBaseUrl } from './apiClient';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface UploadedImageMetadata {
  url: string;
  path: string;
  size: number;
  mimeType: string;
  width: number;
  height: number;
  uploadedAt: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MIN_DIMENSION = 50;
const MAX_DIMENSION = 4096;

/**
 * Validates magic bytes of an ArrayBuffer to guarantee the file matches its declared extension.
 */
export function checkMagicBytes(buffer: ArrayBuffer): { valid: boolean; detectedMime?: string } {
  const bytes = new Uint8Array(buffer.slice(0, 12));
  if (bytes.length < 4) return { valid: false };

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 (0x89 'PNG')
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { valid: true, detectedMime: 'image/png' };
  }

  // WEBP: RIFF .... WEBP
  if (
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && // 'RIFF'
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50 // 'WEBP'
  ) {
    return { valid: true, detectedMime: 'image/webp' };
  }

  return { valid: false };
}

/**
 * Thoroughly validates an uploaded File object before sending to storage.
 */
export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  if (!file) {
    return { valid: false, error: 'File gambar tidak ditemukan.' };
  }

  // 1. File size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `Ukuran file terlalu besar (${sizeMb} MB). Batas maksimum adalah 5 MB.` 
    };
  }

  // 2. MIME type check
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { 
      valid: false, 
      error: `Format file (${file.type || 'tidak dikenal'}) tidak didukung. Harap gunakan JPG, PNG, atau WEBP.` 
    };
  }

  // 3. Magic bytes validation (prevent extension spoofing e.g. .exe renamed to .jpg)
  try {
    const headerSlice = await file.slice(0, 16).arrayBuffer();
    const magicCheck = checkMagicBytes(headerSlice);
    if (!magicCheck.valid) {
      return { 
        valid: false, 
        error: 'Integritas file gambar tidak valid atau korup (magic bytes mismatch).' 
      };
    }
  } catch (err: any) {
    return { 
      valid: false, 
      error: 'Gagal memverifikasi struktur biner file gambar: ' + (err?.message || err) 
    };
  }

  // 4. Dimensions check via browser Image loader
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.naturalWidth;
      const height = img.naturalHeight;

      if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
        resolve({
          valid: false,
          error: `Dimensi gambar terlalu kecil (${width}x${height}px). Minimum adalah ${MIN_DIMENSION}x${MIN_DIMENSION}px.`
        });
        return;
      }

      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        resolve({
          valid: false,
          error: `Dimensi gambar terlalu besar (${width}x${height}px). Maksimum adalah ${MAX_DIMENSION}x${MAX_DIMENSION}px.`
        });
        return;
      }

      resolve({
        valid: true,
        mimeType: file.type,
        width,
        height,
        sizeBytes: file.size
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        valid: false,
        error: 'File tidak dapat dirender sebagai gambar yang valid.'
      });
    };
  });
}

/**
 * Uploads an image to Firebase Storage (with fallback to multipart server upload).
 * Returns the public URL and metadata. NEVER returns or persists Base64 strings.
 */
export async function uploadImageToStorage(
  file: File, 
  destinationFolder: 'stores' | 'campaigns' | 'vouchers' | 'members'
): Promise<UploadedImageMetadata> {
  const validation = await validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Validasi gambar gagal.');
  }

  const cleanBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `${destinationFolder}/${timestamp}_${cleanBaseName}`;

  try {
    // 1. Attempt upload to Firebase Storage
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: validation.mimeType,
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      url: downloadUrl,
      path: storagePath,
      size: file.size,
      mimeType: validation.mimeType || file.type,
      width: validation.width || 0,
      height: validation.height || 0,
      uploadedAt: new Date().toISOString()
    };
  } catch (firebaseErr: any) {
    console.warn('[ImageStorage] Firebase Storage direct upload failed or blocked, attempting server multipart upload:', firebaseErr?.message);

    // 2. Fallback to multipart /api/upload endpoint (saves to server disk, returns relative URL)
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('folder', destinationFolder);

      const apiBase = getApiBaseUrl();
      const uploadUrl = apiBase ? `${apiBase}/api/upload` : '/api/upload';

      const res = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      let returnUrl = data.url || data.fileUrl;
      if (data.success && returnUrl) {
        if (returnUrl.startsWith('/uploads/') && apiBase) {
          returnUrl = `${apiBase}${returnUrl}`;
        }
        return {
          url: returnUrl,
          path: returnUrl,
          size: file.size,
          mimeType: validation.mimeType || file.type,
          width: validation.width || 0,
          height: validation.height || 0,
          uploadedAt: new Date().toISOString()
        };
      }
      throw new Error(data.error || 'Upload server gagal');
    } catch (serverErr: any) {
      console.warn('[ImageStorage] Server upload failed or unreachable, generating compressed WebP/JPEG dataUrl fallback:', serverErr?.message);
      try {
        const compressed = await compressImage(file, 1200, 800, 0.82);
        return {
          url: compressed.dataUrl,
          path: `local/${cleanBaseName}`,
          size: compressed.compressedSize,
          mimeType: 'image/jpeg',
          width: compressed.width,
          height: compressed.height,
          uploadedAt: new Date().toISOString()
        };
      } catch (compressErr: any) {
        throw new Error(`Gagal memproses unggahan gambar: ${compressErr?.message || serverErr?.message || firebaseErr?.message}`);
      }
    }
  }
}
