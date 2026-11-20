/**
 * Shared pure normalization helpers & canonical taxonomies used across OTD adapters.
 * Zero dependencies on React, Context, Services, or browser storage.
 */

import type {
  BackendClothingCategoryDto,
  BackendClothingSeasonDto,
  BackendClothingStyleDto,
  BackendPaginationMetaDto,
  BackendPreferenceFitDto,
  MongoRecordDto,
} from '../types/api';
import type {
  ColorSwatchOption,
  GarmentCategory,
  GarmentColorProfile,
  GarmentFit,
  GarmentSeason,
  GarmentStyleTag,
  OutfitSlotName,
  PaginationSummary,
} from '../types/domain';

export const CORE_PALETTE_SWATCHES: readonly ColorSwatchOption[] = [
  { name: 'Charcoal Noir', hex: '#262930', token: 'charcoal' },
  { name: 'Vicuna Camel', hex: '#B38867', token: 'camel' },
  { name: 'Navy Midnight', hex: '#1B2838', token: 'navy' },
  { name: 'Oatmeal Beige', hex: '#D8CDB9', token: 'beige' },
  { name: 'Olive Forest', hex: '#4B5842', token: 'olive' },
  { name: 'Burgundy Noir', hex: '#4A202A', token: 'burgundy' },
  { name: 'Chalk White', hex: '#F3EFE6', token: 'white' },
  { name: 'Cognac Brown', hex: '#7A4B31', token: 'brown' },
] as const;

const COLOR_HEX_LOOKUP: readonly { keyword: string; token: string; hex: string }[] = [
  { keyword: 'navy', token: 'navy', hex: '#1B2838' },
  { keyword: 'midnight', token: 'navy', hex: '#1E293B' },
  { keyword: 'camel', token: 'camel', hex: '#B38867' },
  { keyword: 'vicuna', token: 'camel', hex: '#B38867' },
  { keyword: 'oatmeal', token: 'beige', hex: '#D8CDB9' },
  { keyword: 'beige', token: 'beige', hex: '#D8CDB9' },
  { keyword: 'sand', token: 'beige', hex: '#C8BA9E' },
  { keyword: 'khaki', token: 'khaki', hex: '#B5A888' },
  { keyword: 'white', token: 'white', hex: '#F3EFE6' },
  { keyword: 'chalk', token: 'white', hex: '#F3EFE6' },
  { keyword: 'ivory', token: 'ivory', hex: '#EFECE6' },
  { keyword: 'cream', token: 'cream', hex: '#F0EAD6' },
  { keyword: 'ecru', token: 'ivory', hex: '#E8E2D5' },
  { keyword: 'charcoal', token: 'charcoal', hex: '#2B2B2D' },
  { keyword: 'noir', token: 'black', hex: '#1C1D21' },
  { keyword: 'black', token: 'black', hex: '#18181A' },
  { keyword: 'obsidian', token: 'black', hex: '#18181A' },
  { keyword: 'olive', token: 'olive', hex: '#4B5842' },
  { keyword: 'forest', token: 'green', hex: '#3D503C' },
  { keyword: 'sage', token: 'green', hex: '#7C8C75' },
  { keyword: 'green', token: 'green', hex: '#4B5842' },
  { keyword: 'burgundy', token: 'burgundy', hex: '#4A202A' },
  { keyword: 'oxblood', token: 'burgundy', hex: '#581F29' },
  { keyword: 'maroon', token: 'burgundy', hex: '#5A202B' },
  { keyword: 'cognac', token: 'brown', hex: '#7A4B31' },
  { keyword: 'chocolate', token: 'brown', hex: '#4A2C2A' },
  { keyword: 'espresso', token: 'brown', hex: '#3D271E' },
  { keyword: 'brown', token: 'brown', hex: '#7A4B31' },
  { keyword: 'tan', token: 'tan', hex: '#A98258' },
  { keyword: 'indigo', token: 'blue', hex: '#283E58' },
  { keyword: 'denim', token: 'blue', hex: '#3B5673' },
  { keyword: 'blue', token: 'blue', hex: '#3B5673' },
  { keyword: 'grey', token: 'grey', hex: '#7C7F85' },
  { keyword: 'gray', token: 'grey', hex: '#7C7F85' },
  { keyword: 'slate', token: 'grey', hex: '#59636E' },
  { keyword: 'silver', token: 'silver', hex: '#B4B9C2' },
  { keyword: 'gold', token: 'gold', hex: '#C5A059' },
  { keyword: 'bronze', token: 'bronze', hex: '#8C6239' },
  { keyword: 'red', token: 'red', hex: '#8F242B' },
  { keyword: 'pink', token: 'pink', hex: '#D8A7B1' },
  { keyword: 'yellow', token: 'yellow', hex: '#C9A959' },
];

const BACKEND_STYLE_SET: ReadonlySet<GarmentStyleTag> = new Set([
  'casual',
  'formal',
  'smart-casual',
  'streetwear',
  'sporty',
  'traditional',
  'party',
  'minimalist',
  'other',
]);

const BACKEND_SEASON_SET: ReadonlySet<GarmentSeason> = new Set([
  'spring',
  'summer',
  'autumn',
  'winter',
  'all-season',
]);

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function isMongoObjectId(value: string | undefined | null): boolean {
  if (!value) return false;
  return /^[0-9a-fA-F]{24}$/.test(value.trim());
}

/** Resolves `id` or raw Mongoose `_id` safely into a trimmed string (empty string if missing). */
export function extractRecordId(record: MongoRecordDto | null | undefined): string {
  if (!record) return '';
  if (typeof record.id === 'string' && record.id.trim()) return record.id.trim();
  if (typeof record._id === 'string' && record._id.trim()) return record._id.trim();
  return '';
}

export function toIsoString(
  value: string | Date | undefined | null,
  fallbackIso?: string,
): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallbackIso ?? new Date().toISOString();
}

export function normalizeStringArray(values: readonly string[] | undefined | null): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const entry of values) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      normalized.push(trimmed);
    }
  }
  return normalized;
}

export function normalizePaginationMeta(
  meta: BackendPaginationMetaDto | undefined | null,
): PaginationSummary {
  const page = meta?.page && meta.page >= 1 ? meta.page : 1;
  const limit = meta?.limit && meta.limit >= 1 ? meta.limit : 20;
  const totalItems =
    typeof meta?.totalItems === 'number'
      ? meta.totalItems
      : typeof meta?.total === 'number'
        ? meta.total
        : 0;
  const totalPages =
    typeof meta?.totalPages === 'number'
      ? meta.totalPages
      : Math.ceil(totalItems / limit);

  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNextPage: meta?.hasNextPage ?? page < totalPages,
    hasPrevPage: meta?.hasPrevPage ?? page > 1,
  };
}

/**
 * Resolves editorial compound colors ("Vicuna Camel", "Navy Midnight") and basic colors
 * into both display name, normalized base color token, and hex value.
 */
export function resolveColorProfile(rawColor?: string): GarmentColorProfile {
  const cleaned = (rawColor || '').trim();
  if (!cleaned) {
    return {
      displayName: 'Neutral',
      baseToken: 'neutral',
      hex: '#3B3B40',
    };
  }

  const lower = cleaned.toLowerCase();
  for (const entry of COLOR_HEX_LOOKUP) {
    if (lower.includes(entry.keyword)) {
      return {
        displayName: cleaned,
        baseToken: entry.token,
        hex: entry.hex,
      };
    }
  }

  return {
    displayName: cleaned,
    baseToken: lower.slice(0, 50),
    hex: /^#[0-9a-fA-F]{6}$/.test(cleaned) ? cleaned : '#3B3B40',
  };
}

/** Normalizes backend (`shoes`) and legacy/slot (`shoe`, `bottom`, `accessory`) categories into domain `GarmentCategory`. */
export function normalizeCategoryToDomain(rawCategory?: string): GarmentCategory {
  const token = (rawCategory || '').trim().toLowerCase();
  switch (token) {
    case 'tops':
    case 'top':
    case 'shirt':
    case 'tshirt':
    case 'blouse':
      return 'tops';
    case 'bottoms':
    case 'bottom':
    case 'trousers':
    case 'jeans':
    case 'shorts':
    case 'skirt':
      return 'bottoms';
    case 'outerwear':
    case 'jacket':
    case 'coat':
    case 'sweater':
    case 'hoodie':
    case 'suit':
      return 'outerwear';
    case 'shoes':
    case 'shoe':
    case 'footwear':
      return 'footwear';
    case 'accessories':
    case 'accessory':
      return 'accessories';
    case 'dresses':
    case 'dress':
      return 'dresses';
    case 'activewear':
      return 'activewear';
    case 'ethnic-wear':
      return 'ethnic-wear';
    default:
      return 'other';
  }
}

/** Maps frontend domain `GarmentCategory` to backend `WardrobeItem.category` (`footwear` -> `shoes`). */
export function mapCategoryToBackend(category: GarmentCategory | string): BackendClothingCategoryDto {
  const normalized = normalizeCategoryToDomain(category);
  if (normalized === 'footwear') {
    return 'shoes';
  }
  return normalized;
}

export function mapSlotToDomainCategory(slot: OutfitSlotName): GarmentCategory {
  switch (slot) {
    case 'top':
      return 'tops';
    case 'outerwear':
      return 'outerwear';
    case 'bottom':
      return 'bottoms';
    case 'footwear':
      return 'footwear';
    case 'accessory':
      return 'accessories';
  }
}

export function mapDomainCategoryToSlot(category: GarmentCategory): OutfitSlotName {
  switch (category) {
    case 'outerwear':
      return 'outerwear';
    case 'bottoms':
      return 'bottom';
    case 'footwear':
      return 'footwear';
    case 'accessories':
      return 'accessory';
    default:
      return 'top';
  }
}

export function normalizeStyleTag(rawStyle?: string): GarmentStyleTag {
  const token = (rawStyle || '').trim().toLowerCase().replace(/_/g, '-');
  if (BACKEND_STYLE_SET.has(token as GarmentStyleTag)) {
    return token as GarmentStyleTag;
  }
  if (token.includes('minimal') || token.includes('quiet luxury')) return 'minimalist';
  if (token.includes('smart') || token.includes('heritage') || token.includes('sartorial') || token.includes('modular')) {
    return 'smart-casual';
  }
  if (token.includes('formal') || token.includes('tailor') || token.includes('business')) return 'formal';
  if (token.includes('street') || token.includes('urban')) return 'streetwear';
  if (token.includes('sport') || token.includes('athletic') || token.includes('gym')) return 'sporty';
  if (token.includes('tradition') || token.includes('ethnic')) return 'traditional';
  if (token.includes('party') || token.includes('evening') || token.includes('haute')) return 'party';
  if (token.includes('casual') || token.includes('relaxed')) return 'casual';
  return 'casual';
}

export function mapStyleTagToBackend(style: GarmentStyleTag | string): BackendClothingStyleDto {
  return normalizeStyleTag(style);
}

export function normalizeSeasonList(rawSeasons?: readonly string[] | string): BackendClothingSeasonDto[] {
  const sourceList = Array.isArray(rawSeasons)
    ? rawSeasons
    : typeof rawSeasons === 'string' && rawSeasons.trim()
      ? [rawSeasons]
      : [];

  const result: BackendClothingSeasonDto[] = [];
  const seen = new Set<BackendClothingSeasonDto>();

  for (const item of sourceList) {
    const token = item.trim().toLowerCase().replace(/\s+/g, '-');
    const mapped: BackendClothingSeasonDto | null =
      token === 'fall'
        ? 'autumn'
        : token === 'all' || token === 'all-seasons'
          ? 'all-season'
          : BACKEND_SEASON_SET.has(token as GarmentSeason)
            ? (token as BackendClothingSeasonDto)
            : null;

    if (mapped && !seen.has(mapped)) {
      seen.add(mapped);
      result.push(mapped);
    }
  }

  return result.length > 0 ? result : ['all-season'];
}

/**
 * Unifies all 4 frontend fit conventions (`Slim Fit`, `Tailored / Slim`,
 * `Regular Classic`, `Relaxed / Tailored`, `Loose Fit`, etc.) into a canonical token.
 */
export function normalizeFitToDomain(rawFit?: string): GarmentFit {
  const token = (rawFit || '').trim().toLowerCase();
  if (!token || token === 'no-preference') return 'no-preference';
  if (token.includes('oversiz') || token.includes('loose')) return 'oversized';
  if (token.includes('relaxed') || token.includes('drape')) return 'relaxed';
  if (token.includes('slim') || token === 'tailored / slim') return 'slim';
  if (token.includes('tailored') && !token.includes('regular')) return 'tailored';
  if (token.includes('regular') || token.includes('classic')) return 'regular';
  return 'regular';
}

export function mapFitToBackendPreference(fit?: string): BackendPreferenceFitDto {
  const domainFit = normalizeFitToDomain(fit);
  if (domainFit === 'tailored') return 'slim';
  return domainFit;
}

export function formatBackendFitToDisplay(fit: BackendPreferenceFitDto | GarmentFit): string {
  switch (fit) {
    case 'slim':
      return 'Tailored / Slim';
    case 'regular':
      return 'Regular Classic';
    case 'relaxed':
      return 'Relaxed / Drape';
    case 'oversized':
      return 'Loose Fit';
    case 'tailored':
      return 'Relaxed / Tailored';
    default:
      return 'Regular Classic';
  }
}
