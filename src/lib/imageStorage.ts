/**
 * Image Storage & Validation Service
 * Enforces MIME type, magic bytes verification, file size limits, and image dimensions.
 * Uploads assets directly to Firebase Storage,
 * ensuring Firestore and localStorage NEVER store raw Base64 data.
 */

import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

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
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // Firebase Storage rules
const MAX_SOURCE_SIZE_BYTES = 20 * 1024 * 1024; // Phone photos are compressed before upload
const MIN_DIMENSION = 50;
const MAX_SOURCE_DIMENSION = 8192;
const SMALL_IMAGE_BYTES = 350 * 1024;

type ImageFolder = 'stores' | 'campaigns' | 'vouchers' | 'members';
const IMAGE_BOUNDS: Record<ImageFolder, [number, number]> = {
  stores: [1200, 900],
  campaigns: [1200, 1200],
  vouchers: [1200, 800],
  members: [480, 480],
};

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

async function inspectImage(file: File): Promise<{ image: HTMLImageElement; release: () => void; result: ImageValidationResult }> {
  if (!file || file.size === 0 || file.size > MAX_SOURCE_SIZE_BYTES) {
    throw new Error('Pilih foto dengan ukuran maksimal 20 MB.');
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Format gambar harus JPG, PNG, atau WebP.');
  }
  const magic = checkMagicBytes(await file.slice(0, 16).arrayBuffer());
  if (!magic.valid || magic.detectedMime !== file.type) {
    throw new Error('Isi file gambar tidak sesuai format JPG, PNG, atau WebP.');
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Gambar tidak dapat dibuka.'));
      image.src = objectUrl;
    });
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    if (width < MIN_DIMENSION || height < MIN_DIMENSION ||
        width > MAX_SOURCE_DIMENSION || height > MAX_SOURCE_DIMENSION) {
      throw new Error('Dimensi foto harus antara 50 dan 8192 piksel.');
    }
    return {
      image,
      release: () => URL.revokeObjectURL(objectUrl),
      result: { valid: true, mimeType: file.type, width, height, sizeBytes: file.size },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function validateImageFile(file: File): Promise<ImageValidationResult> {
  try {
    const inspected = await inspectImage(file);
    inspected.release();
    return inspected.result;
  } catch (error: any) {
    return { valid: false, error: error?.message || 'Validasi gambar gagal.' };
  }
}

async function prepareImage(file: File, folder: ImageFolder): Promise<{ file: File; width: number; height: number }> {
  const inspected = await inspectImage(file);
  try {
    const { width, height } = inspected.result;
    const [maxWidth, maxHeight] = IMAGE_BOUNDS[folder];
    const scale = Math.min(1, maxWidth / width!, maxHeight / height!);
    if (scale === 1 && file.size <= SMALL_IMAGE_BYTES) {
      return { file, width: width!, height: height! };
    }

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width! * scale));
    canvas.height = Math.max(1, Math.round(height! * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Browser tidak dapat memproses foto.');
    context.drawImage(inspected.image, 0, 0, canvas.width, canvas.height);
    const encoded = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', 0.8));
    if (!encoded || !ALLOWED_MIME_TYPES.includes(encoded.type)) {
      throw new Error('Browser gagal mengompres foto.');
    }
    if (encoded.size >= file.size && file.size <= MAX_UPLOAD_SIZE_BYTES) {
      return { file, width: width!, height: height! };
    }
    if (encoded.size > MAX_UPLOAD_SIZE_BYTES) {
      throw new Error('Hasil kompresi masih melebihi 5 MB. Pilih foto lain.');
    }
    const ext = encoded.type === 'image/webp' ? '.webp' : encoded.type === 'image/png' ? '.png' : '.jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '');
    return {
      file: new File([encoded], baseName + ext, { type: encoded.type }),
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    inspected.release();
  }
}

/**
 * Uploads an image to Firebase Storage.
 * Returns the public URL and metadata. NEVER returns or persists Base64 strings.
 */
export async function uploadImageToStorage(
  file: File,
  destinationFolder: ImageFolder,
  memberId?: string
): Promise<UploadedImageMetadata> {
  if (destinationFolder === 'members' && (!memberId || memberId.includes('/'))) {
    throw new Error('ID member tidak valid untuk upload avatar.');
  }
  const prepared = await prepareImage(file, destinationFolder);
  const uploadFile = prepared.file;
  if (uploadFile.size > MAX_UPLOAD_SIZE_BYTES) {
    throw new Error('Ukuran gambar hasil kompresi melebihi 5 MB.');
  }
  const cleanBaseName = uploadFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}_${cleanBaseName}`;
  const storagePath = destinationFolder === 'members'
    ? `members/${memberId}/${filename}`
    : `${destinationFolder}/${filename}`;
  try {
    const storageRef = ref(storage, storagePath);
    const snapshot = await uploadBytes(storageRef, uploadFile, {
      contentType: uploadFile.type,
      cacheControl: 'public,max-age=31536000,immutable',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      url: downloadUrl,
      path: storagePath,
      size: uploadFile.size,
      mimeType: uploadFile.type,
      width: prepared.width,
      height: prepared.height,
      uploadedAt: new Date().toISOString()
    };
  } catch (firebaseErr: any) {
    throw new Error(`Gagal mengunggah gambar ke Firebase Storage: ${firebaseErr?.message || 'periksa login admin dan Storage Rules'}`);
  }
}
