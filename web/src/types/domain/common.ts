/**
 * Core shared domain primitives for the OTD Web application.
 * Pure TypeScript domain types decoupled from wire DTO quirks.
 */

export type EntityOrigin = 'local' | 'api' | 'hybrid';

export type EntityId = string;

export interface PaginationSummary {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Primary 5-bucket closet taxonomy rendered across Digital Closet filters & GarmentSwapModal.
 * Frontend domain consistently uses `'footwear'` (translated to `'shoes'` at API boundary).
 */
export type CoreClosetCategory =
  | 'tops'
  | 'bottoms'
  | 'outerwear'
  | 'footwear'
  | 'accessories';

/** Additional backend wardrobe categories preserved by adapters without data loss. */
export type ExtendedGarmentCategory =
  | 'dresses'
  | 'activewear'
  | 'ethnic-wear'
  | 'other';

export type GarmentCategory = CoreClosetCategory | ExtendedGarmentCategory;

/** 5-slot ensemble key used by AvatarOutfitCanvas, outfitSynthesizer, and OutfitSlotsList. */
export type OutfitSlotName =
  | 'top'
  | 'outerwear'
  | 'bottom'
  | 'footwear'
  | 'accessory';

export type GarmentStyleTag =
  | 'casual'
  | 'formal'
  | 'smart-casual'
  | 'streetwear'
  | 'sporty'
  | 'traditional'
  | 'party'
  | 'minimalist'
  | 'other';

export type GarmentFit =
  | 'slim'
  | 'regular'
  | 'relaxed'
  | 'oversized'
  | 'tailored'
  | 'no-preference';

export type LegacyClosetFit = 'Slim' | 'Regular' | 'Relaxed / Tailored';

export type GarmentSeason =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'all-season';

export type FormalityTier = 1 | 2 | 3 | 4 | 5;

export type MeasurementUnit = 'metric' | 'imperial';

export type StudioTabId =
  | 'home'
  | 'ideas'
  | 'stylist'
  | 'destinations'
  | 'closet'
  | 'shopping'
  | 'saved'
  | 'calendar'
  | 'tryon';

export interface GarmentColorProfile {
  /** Human-facing editorial label (e.g. "Vicuna Camel", "Navy Midnight"). */
  displayName: string;
  /** Lowercase normalized color token for filtering and backend queries (e.g. "camel", "navy"). */
  baseToken: string;
  /** Valid CSS hex string resolved for swatch & avatar canvas rendering. */
  hex: string;
}

export interface ColorSwatchOption {
  name: string;
  hex: string;
  token: string;
}

