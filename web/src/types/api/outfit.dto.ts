/**
 * Backend API DTO contracts for Outfits, Outfit Generation, History, and Ratings.
 * Mirrors AI-FASHION-OTD/src/models/{Outfit,OutfitGeneration,OutfitHistory,OutfitRating}.ts
 * and modules/outfits/*.
 *
 * CRITICAL BACKEND MISMATCH TO NOTE (Owned by Vasant):
 * - `outfits.validator.ts` enforces `.strict()` and requires `clothingItemIds`, plus allows
 *   `status` ('generated' | 'saved' | 'worn'), `colorPalette`, `aiGenerated`, `rating`.
 * - `models/Outfit.ts` defines `wardrobeItemIds` (required) and `isFavorite` (default `false`),
 *   and omits `clothingItemIds`, `status`, `colorPalette`, `aiGenerated`, `rating`.
 * - Therefore, `BackendOutfitDto` tolerates both field sets defensively while request DTOs
 *   reflect exact Zod validators (`clothingItemIds`).
 */

import type { IsoDateString, MongoRecordDto, ObjectIdString } from './common.dto';

export type BackendOutfitOccasionDto =
  | 'casual'
  | 'work'
  | 'party'
  | 'wedding'
  | 'date'
  | 'travel'
  | 'gym'
  | 'formal'
  | 'other';

export type BackendOutfitSeasonDto =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'all-season';

export type BackendOutfitStyleDto =
  | 'casual'
  | 'formal'
  | 'smart-casual'
  | 'streetwear'
  | 'sporty'
  | 'traditional'
  | 'party'
  | 'minimalist'
  | 'other';

export type BackendOutfitStatusDto = 'generated' | 'saved' | 'worn';

export interface BackendOutfitDto extends MongoRecordDto {
  userId: ObjectIdString;
  name: string;
  description?: string;
  /** Defined in `models/Outfit.ts` & `outfit-history.service.ts`. */
  wardrobeItemIds?: ObjectIdString[];
  /** Defined in `outfits.validator.ts` (`createOutfitSchema` / `updateOutfitSchema`). */
  clothingItemIds?: ObjectIdString[];
  occasion: string;
  style: BackendOutfitStyleDto | string;
  season?: BackendOutfitSeasonDto;
  isFavorite?: boolean;
  status?: BackendOutfitStatusDto;
  colorPalette?: string[];
  aiGenerated?: boolean;
  rating?: number;
  notes?: string;
  wornAt?: IsoDateString;
}

/** Validated by `createOutfitSchema.strict()` in `outfits.validator.ts`. */
export interface CreateOutfitRequestDto {
  name: string;
  description?: string;
  clothingItemIds: ObjectIdString[];
  occasion: BackendOutfitOccasionDto;
  style: string;
  season?: BackendOutfitSeasonDto;
  colorPalette?: string[];
  status?: BackendOutfitStatusDto;
  aiGenerated?: boolean;
  rating?: number;
  notes?: string;
  wornAt?: IsoDateString;
}

/** Validated by `updateOutfitSchema.strict()` in `outfits.validator.ts`. */
export type UpdateOutfitRequestDto = Partial<CreateOutfitRequestDto>;

export interface OutfitListQueryDto {
  page?: number;
  limit?: number;
  occasion?: BackendOutfitOccasionDto;
  status?: BackendOutfitStatusDto;
}

export interface GenerateOutfitsRequestDto {
  occasion?: string;
  requestedStyle?: string;
  season?: string;
  excludedItemIds?: ObjectIdString[];
  preferredColor?: string;
  includeAccessories?: boolean;
}

export interface OutfitRecommendationItemDto {
  itemIds: ObjectIdString[];
  explanation: string;
  score?: number;
}

/** Returned inside `data` by `POST /api/outfits/generate`. */
export interface GenerateOutfitsResponseDto {
  recommendations: OutfitRecommendationItemDto[];
  total: number;
  processingTimeMs: number;
}

export interface GeneratedOutfitSnapshotDto {
  name?: string;
  description?: string;
  wardrobeItemIds: ObjectIdString[];
  style?: string;
  explanation?: string;
  /** Stored on OutfitGeneration doc as 0..100 integer score. */
  score?: number;
}

export type OutfitGenerationStatusDto =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface BackendOutfitGenerationRecordDto extends MongoRecordDto {
  userId: ObjectIdString;
  occasion: string;
  requestedStyle: string;
  season: string;
  wardrobeItemIds: ObjectIdString[];
  generatedOutfits: GeneratedOutfitSnapshotDto[];
  status: OutfitGenerationStatusDto;
  aiProvider?: string;
  modelName?: string;
  promptVersion?: string;
  errorMessage?: string;
  generatedAt?: IsoDateString;
  processingTimeMs?: number;
}

export interface LogOutfitWearRequestDto {
  outfitId?: ObjectIdString;
  outfitName?: string;
  wardrobeItemIds?: ObjectIdString[];
  occasion?: string;
  wornAt?: IsoDateString;
  notes?: string;
  rating?: number;
  feedback?: string;
}

export interface BackendOutfitHistoryDto extends MongoRecordDto {
  userId: ObjectIdString;
  outfitId?: ObjectIdString;
  outfitName: string;
  wardrobeItemIds: ObjectIdString[];
  occasion: string;
  wornAt: IsoDateString;
  notes: string;
  rating?: number;
  feedback: string;
}

export interface OutfitHistoryQueryDto {
  page?: number;
  limit?: number;
  outfitId?: ObjectIdString;
  fromDate?: IsoDateString;
  toDate?: IsoDateString;
}

/**
 * Mirrors `models/OutfitRating.ts`.
 * @pendingPublicRoute No HTTP route is currently mounted in `outfits.routes.ts` for ratings.
 */
export interface BackendOutfitRatingDto extends MongoRecordDto {
  userId: ObjectIdString;
  outfitId: ObjectIdString;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  occasion: string;
  wouldWearAgain?: boolean;
}

/** @pendingPublicRoute */
export interface RateOutfitRequestDto {
  outfitId: ObjectIdString;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  occasion?: string;
  wouldWearAgain?: boolean;
}

