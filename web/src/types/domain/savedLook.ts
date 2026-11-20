/**
 * Frontend domain models for Saved Looks & Liked Look Identifiers.
 * Cleanly distinguishes local editorial slugs (`saved-1`, `sug-2`, `idea-1`)
 * from persisted MongoDB Outfit ObjectIds (`backendOutfitId`).
 */

import type {
  EntityOrigin,
  GarmentSeason,
  GarmentStyleTag,
  OutfitSlotName,
} from './common';
import type { OutfitSlotPiece } from './outfit';

export type SavedLookOrigin =
  | 'curated-default'
  | 'stylist-generated'
  | 'api-outfit';

export interface SavedLookIdentifier {
  /** Primary UI identifier (`saved-1`, `local-look-...`, or Mongo ObjectId). */
  localId: string;
  /** 24-hex Mongo ObjectId if synced with `Outfit` collection, otherwise undefined. */
  backendOutfitId?: string;
  /** Editorial template/card ID when liked from Home or Ideas (`sug-1`, `idea-3`). */
  sourceTemplateId?: string;
  /** True only when `backendOutfitId` is a valid backend Outfit record ID. */
  isPersistedOnBackend: boolean;
}

export interface SavedLook {
  id: string;
  backendOutfitId?: string;
  sourceTemplateId?: string;
  origin: EntityOrigin;
  sourceKind: SavedLookOrigin;
  title: string;
  subtitle: string;
  occasion: string;
  venue?: string;
  vibe: string;
  style?: GarmentStyleTag | string;
  season?: GarmentSeason;
  isFavorite: boolean;
  rating?: number;
  weatherTag: string;
  imageUrl: string;
  tags: string[];
  /** Human-readable garment titles shown in Saved Looks cards. */
  garments: string[];
  /** Referenced closet / wardrobe item IDs when linked to real garments. */
  garmentIds: string[];
  /** Per-slot garment ID mapping enabling exact slot restoration when worn/viewed. */
  slotAssignments?: Partial<Record<OutfitSlotName, string>>;
  /** Normalized per-slot snapshot preserving composition across reloads or missing closet items. */
  slots?: OutfitSlotPiece[];
  variationIndex?: number;
  colorPalette: string[];
  reason: string;
  notes?: string;
  savedAt: string;
  wornAt?: string;
}

export interface LikedLookReference {
  id: string;
  kind: 'saved-look' | 'editorial-card' | 'api-outfit';
  isMongoObjectId: boolean;
}

