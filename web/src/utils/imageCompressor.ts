import { validateGarmentImageFile } from './garmentValidation';

export interface CompressedImageResult {
  dataUrl: string;
  usedFallback: boolean;
  fallbackReason?: string;
}

/**
 * Utility to compress and downscale user-uploaded image files and base64 strings
 * to protect browser localStorage limits while maintaining high visual fidelity.
 * Validates file type and 5MB cap upfront so oversized/unsupported files are never
 * silently passed through via fallback.
 */
export async function compressImageFileWithMeta(
  file: File,
  maxDimension = 800,
  quality = 0.82
): Promise<CompressedImageResult> {
  const validationError = validateGarmentImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const rawResult = e.target?.result;
      if (typeof rawResult !== 'string' || !rawResult.startsWith('data:image/')) {
        reject(new Error('Selected file could not be read as a valid image.'));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode selected image file.'));
      img.onload = () => {
        try {
          let { width, height } = img;
          if (!width || !height) {
            reject(new Error('Image has invalid dimensions.'));
            return;
          }

          // Scale down proportionally if either dimension exceeds maxDimension
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            // Safe fallback on pre-validated <=5MB file if 2D canvas context is unavailable
            resolve({
              dataUrl: rawResult,
              usedFallback: true,
              fallbackReason: 'Canvas 2D context unavailable; kept validated original photo.',
            });
            return;
          }

          // Paint light neutral backdrop so transparent PNG/WebP areas never turn black under JPEG
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          if (!compressedDataUrl || !compressedDataUrl.startsWith('data:image/')) {
            resolve({
              dataUrl: rawResult,
              usedFallback: true,
              fallbackReason: 'Browser image encoding unavailable; kept validated original photo.',
            });
            return;
          }

          resolve({
            dataUrl: compressedDataUrl,
            usedFallback: false,
          });
        } catch (err) {
          console.warn('Canvas compression failed, falling back to validated original data URL:', err);
          resolve({
            dataUrl: rawResult,
            usedFallback: true,
            fallbackReason: 'Local downscaling unavailable; kept validated original photo.',
          });
        }
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  });
}

export async function compressImageFile(
  file: File,
  maxDimension = 800,
  quality = 0.82
): Promise<string> {
  const result = await compressImageFileWithMeta(file, maxDimension, quality);
  return result.dataUrl;
}
