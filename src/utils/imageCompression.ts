/**
 * Utility to compress images client-side before upload.
 * Prevents Nginx/proxy 413 (Payload Too Large) errors and speeds up uploads.
 * Also provides instant Base64 data URL fallback.
 */

export interface CompressedImageResult {
  blob: Blob;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 675,
  quality = 0.85
): Promise<CompressedImageResult> {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan berkas gambar yang valid'));
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas gambar'));
    };

    reader.onload = (readerEvent) => {
      const img = new Image();

      img.onerror = () => {
        reject(new Error('Format gambar tidak didukung atau berkas korup'));
      };

      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Calculate aspect ratio preserving resize
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Fallback to original data URL if canvas context unavailable
            return resolve({
              blob: file,
              dataUrl: readerEvent.target?.result as string,
              originalSize: file.size,
              compressedSize: file.size,
              width: img.width,
              height: img.height,
            });
          }

          // Draw and smooth
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Get compressed Data URL
          const mimeType = 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);

          // Convert to Blob for multipart upload
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  blob,
                  dataUrl: compressedDataUrl,
                  originalSize: file.size,
                  compressedSize: blob.size,
                  width,
                  height,
                });
              } else {
                resolve({
                  blob: file,
                  dataUrl: compressedDataUrl,
                  originalSize: file.size,
                  compressedSize: file.size,
                  width,
                  height,
                });
              }
            },
            mimeType,
            quality
          );
        } catch (err: any) {
          reject(new Error('Gagal mengompres gambar: ' + (err?.message || 'Unknown error')));
        }
      };

      img.src = readerEvent.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
}
