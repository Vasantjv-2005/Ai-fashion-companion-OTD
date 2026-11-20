/**
 * Backend API & AI/ML DTO contracts for Wardrobe / Clothing Items & Recognition.
 * Mirrors AI-FASHION-OTD/src/models/WardrobeItem.ts, modules/wardrobe/*,
 * and integrations/ai/{ai.types.ts,clothing-recognition.client.ts}.
 */

import type { IsoDateString, MongoRecordDto, ObjectIdString } from './common.dto';

/** Backend `CLOTHING_CATEGORIES`. Note: uses `"shoes"` where frontend uses `"footwear"`. */
export type BackendClothingCategoryDto =
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'shoes'
  | 'accessories'
  | 'activewear'
  | 'ethnic-wear'
  | 'other';

export type BackendClothingSeasonDto =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'all-season';

export type BackendClothingStyleDto =
  | 'casual'
  | 'formal'
  | 'smart-casual'
  | 'streetwear'
  | 'sporty'
  | 'traditional'
  | 'party'
  | 'minimalist'
  | 'other';

/** Normalized response serialized by `wardrobe.service.ts` (`toWardrobeItemResponse`). */
export interface BackendWardrobeItemDto extends MongoRecordDto {
  id: ObjectIdString;
  userId: ObjectIdString;
  name: string;
  category: BackendClothingCategoryDto;
  color: string;
  style: BackendClothingStyleDto;
  season: BackendClothingSeasonDto[];
  brand?: string;
  notes?: string;
  imageFileId?: ObjectIdString;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/** Validated by `createWardrobeItemSchema.strict()`. */
export interface CreateWardrobeItemRequestDto {
  name: string;
  category: BackendClothingCategoryDto;
  color: string;
  style: BackendClothingStyleDto;
  season: BackendClothingSeasonDto[];
  brand?: string;
  notes?: string;
  imageFileId?: ObjectIdString;
}

/** Validated by `updateWardrobeItemSchema.strict()`. */
export type UpdateWardrobeItemRequestDto = Partial<CreateWardrobeItemRequestDto>;

export interface WardrobeListQueryDto {
  page?: number;
  limit?: number;
  category?: BackendClothingCategoryDto;
  color?: string;
  style?: BackendClothingStyleDto;
  season?: BackendClothingSeasonDto;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response from `POST /api/wardrobe/:id/image` (`uploadWardrobeItemImage`).
 * Multipart upload field name MUST be `"image"`.
 * Note: `GET /api/wardrobe/:id/image` stream endpoint is not yet mounted in `wardrobe-image.routes.ts`.
 */
export interface BackendWardrobeImageUploadDto {
  itemId: ObjectIdString;
  image: {
    fileId: ObjectIdString;
    filename: string;
    contentType: string;
    size: number;
  };
}

/**
 * AI/ML granular categories accepted by `wardrobe-attributes.validator.ts`
 * & returned by `POST ${AI_SERVICE_URL}/recognize-clothing`.
 */
export type AiRecognizedCategoryDto =
  | 'shirt'
  | 'tshirt'
  | 'top'
  | 'blouse'
  | 'trousers'
  | 'jeans'
  | 'shorts'
  | 'skirt'
  | 'dress'
  | 'jacket'
  | 'coat'
  | 'sweater'
  | 'hoodie'
  | 'suit'
  | 'shoes'
  | 'accessory'
  | 'other';

export interface AiClothingRecognitionRequestDto {
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
}

export interface AiClothingPredictionDto {
  category: AiRecognizedCategoryDto;
  color?: string;
  secondaryColor?: string;
  material?: string;
  pattern?: string;
  style?: string[];
  season?: BackendClothingSeasonDto[];
  occasions?: string[];
  /** Confidence between 0 and 1. Backend filters below `minimumConfidence` (default 0.65). */
  confidence: number;
}

/**
 * Output produced by `clothing-recognition.service.ts` (`detectClothingAttributes`).
 * @pendingPublicRoute Backend does not yet mount a public Express route exposing this payload to web clients (owned by Vasant + Chodhita).
 */
export interface AiClothingRecognitionResponseDto {
  predictions: AiClothingPredictionDto[];
  modelVersion?: string;
  requestId?: string;
  /** Enforced server-side before saving recognized items into WardrobeItem. */
  requiresUserConfirmation: true;
  /**
   * Optional cutout / background-removed URL not yet emitted by backend AI client.
   * @pendingExternalContract
   */
  cutoutImageUrl?: string;
}

