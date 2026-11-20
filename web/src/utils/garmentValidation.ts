/**
 * Shared validation constants and helpers for Digital Closet garment uploads,
 * editing modals, and metadata preparation.
 */

export const MAX_GARMENT_IMAGE_MB = 5;
export const MAX_GARMENT_IMAGE_BYTES = MAX_GARMENT_IMAGE_MB * 1024 * 1024;

export const ACCEPTED_GARMENT_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ACCEPTED_GARMENT_IMAGE_ACCEPT = ACCEPTED_GARMENT_IMAGE_TYPES.join(',');

export const GARMENT_NAME_MAX_LENGTH = 100;
export const GARMENT_BRAND_MAX_LENGTH = 100;
export const GARMENT_COLOR_MAX_LENGTH = 50;
export const GARMENT_SUBTYPE_MAX_LENGTH = 100;
export const GARMENT_PATTERN_MAX_LENGTH = 100;
export const GARMENT_NOTES_MAX_LENGTH = 1000;
export const CLOSET_SEARCH_MAX_LENGTH = 100;

export interface GarmentMetadataErrors {
  name?: string;
  brand?: string;
  color?: string;
  description?: string;
}

/**
 * Validates that an image file is JPEG, PNG, or WebP and does not exceed 5 MB.
 * Returns a user-facing error message or null when valid.
 */
export function validateGarmentImageFile(file: File): string | null {
  const normalizedType = file.type.trim().toLowerCase();
  const isSupportedType = (ACCEPTED_GARMENT_IMAGE_TYPES as readonly string[]).includes(
    normalizedType,
  );

  if (!isSupportedType) {
    return 'Please select a valid JPEG, PNG, or WebP image file.';
  }

  if (file.size > MAX_GARMENT_IMAGE_BYTES) {
    return `Image size exceeds ${MAX_GARMENT_IMAGE_MB}MB limit. Please choose a smaller file.`;
  }

  return null;
}

/**
 * Validates trimmed garment metadata lengths and required fields.
 * Brand and description are optional.
 */
export function validateGarmentMetadata(fields: {
  name: string;
  brand?: string;
  color: string;
  description?: string;
}): GarmentMetadataErrors {
  const errors: GarmentMetadataErrors = {};
  const trimmedName = fields.name.trim();
  const trimmedBrand = (fields.brand ?? '').trim();
  const trimmedColor = fields.color.trim();
  const trimmedDescription = (fields.description ?? '').trim();

  if (!trimmedName) {
    errors.name = 'Garment name is required.';
  } else if (trimmedName.length > GARMENT_NAME_MAX_LENGTH) {
    errors.name = `Garment name must be ${GARMENT_NAME_MAX_LENGTH} characters or less.`;
  }

  if (trimmedBrand.length > GARMENT_BRAND_MAX_LENGTH) {
    errors.brand = `Brand must be ${GARMENT_BRAND_MAX_LENGTH} characters or less.`;
  }

  if (!trimmedColor) {
    errors.color = 'Color family is required.';
  } else if (trimmedColor.length > GARMENT_COLOR_MAX_LENGTH) {
    errors.color = `Color must be ${GARMENT_COLOR_MAX_LENGTH} characters or less.`;
  }

  if (trimmedDescription.length > GARMENT_NOTES_MAX_LENGTH) {
    errors.description = `Notes must be ${GARMENT_NOTES_MAX_LENGTH} characters or less.`;
  }

  return errors;
}

/**
 * Builds a clean, capped default garment name from a selected image filename.
 */
export function deriveDefaultGarmentName(
  fileName: string,
  fallback = 'Garment Piece',
): string {
  const cleaned = fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .trim();

  if (!cleaned) {
    return fallback;
  }

  const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return formatted.slice(0, GARMENT_NAME_MAX_LENGTH).trim() || fallback;
}

/**
 * Joins non-empty metadata parts (such as optional brand + subType) cleanly without
 * leaving dangling separators when brand is omitted.
 */
export function formatGarmentMetaParts(
  parts: Array<string | undefined | null>,
  fallback = '',
): string {
  const joined = parts
    .map((part) => (typeof part === 'string' ? part.trim() : ''))
    .filter(Boolean)
    .join(' • ');

  return joined || fallback;
}

