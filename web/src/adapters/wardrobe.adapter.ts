/**
 * Bidirectional Digital Closet adapters decoupling `ClosetGarment` & `GarmentDraftItem`
 * from backend `BackendWardrobeItemDto` (`shoes` vs `footwear`, `style` vs `subType`)
 * and AI/ML `AiClothingRecognitionResponseDto` predictions.
 */

import type {
  AiClothingPredictionDto,
  AiClothingRecognitionResponseDto,
  AiRecognizedCategoryDto,
  BackendClothingStyleDto,
  BackendWardrobeImageUploadDto,
  BackendWardrobeItemDto,
  CreateWardrobeItemRequestDto,
  UpdateWardrobeItemRequestDto,
} from '../types/api';
import type {
  ClosetGarment,
  FormalityTier,
  GarmentCategory,
  GarmentDraftItem,
  GarmentImageUploadAsset,
  GarmentRecognitionCandidate,
  GarmentRecognitionDraftResult,
  GarmentStyleTag,
} from '../types/domain';
import {
  extractRecordId,
  isMongoObjectId,
  mapCategoryToBackend,
  normalizeCategoryToDomain,
  normalizeFitToDomain,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  resolveColorProfile,
  toIsoString,
} from './shared.adapter';

const AI_CATEGORY_PLACEMENT: Readonly<
  Record<AiRecognizedCategoryDto, { category: GarmentCategory; subType: string; icon: string }>
> = {
  shirt: { category: 'tops', subType: 'Oxford Shirt', icon: '👔' },
  tshirt: { category: 'tops', subType: 'T-Shirt', icon: '👕' },
  top: { category: 'tops', subType: 'Knit Polo', icon: '👕' },
  blouse: { category: 'tops', subType: 'Poplin Blouse', icon: '👚' },
  trousers: { category: 'bottoms', subType: 'Pleated Trousers', icon: '👖' },
  jeans: { category: 'bottoms', subType: 'Denim Jeans', icon: '👖' },
  shorts: { category: 'bottoms', subType: 'Tailored Shorts', icon: '🩳' },
  skirt: { category: 'bottoms', subType: 'Midi Skirt', icon: '👗' },
  dress: { category: 'dresses', subType: 'Evening Dress', icon: '👗' },
  jacket: { category: 'outerwear', subType: 'Structured Jacket', icon: '🧥' },
  coat: { category: 'outerwear', subType: 'Wool Overcoat', icon: '🧥' },
  sweater: { category: 'tops', subType: 'Merino Knit Sweater', icon: '🧶' },
  hoodie: { category: 'tops', subType: 'Cashmere Hoodie', icon: '🧥' },
  suit: { category: 'outerwear', subType: 'Tailored Blazer', icon: '🧥' },
  shoes: { category: 'footwear', subType: 'Leather Loafers', icon: '👞' },
  accessory: { category: 'accessories', subType: 'Minimalist Belt', icon: '⌚' },
  other: { category: 'other', subType: 'Editorial Piece', icon: '✨' },
};

const CATEGORY_DEFAULT_ICON: Readonly<Record<GarmentCategory, string>> = {
  tops: '👔',
  bottoms: '👖',
  outerwear: '🧥',
  footwear: '👞',
  accessories: '⌚',
  dresses: '👗',
  activewear: '🏃',
  'ethnic-wear': '👘',
  other: '✨',
};

const CATEGORY_DEFAULT_SUBTYPE: Readonly<Record<GarmentCategory, string>> = {
  tops: 'Tailored Top',
  bottoms: 'Tailored Trousers',
  outerwear: 'Structured Layer',
  footwear: 'Classic Footwear',
  accessories: 'Curated Accessory',
  dresses: 'Studio Dress',
  activewear: 'Performance Layer',
  'ethnic-wear': 'Traditional Ensemble',
  other: 'Wardrobe Piece',
};

export function inferFormalityFromStyle(style: GarmentStyleTag | string): FormalityTier {
  const token = normalizeStyleTag(style);
  if (token === 'formal') return 5;
  if (token === 'smart-casual' || token === 'traditional' || token === 'party') return 4;
  if (token === 'minimalist') return 3;
  if (token === 'streetwear' || token === 'casual') return 2;
  if (token === 'sporty') return 1;
  return 3;
}

export function inferStyleFromGarment(garment: {
  style?: GarmentStyleTag | string;
  formality?: number;
  subType?: string;
  occasions?: readonly string[];
}): BackendClothingStyleDto {
  if (garment.style) {
    return normalizeStyleTag(garment.style);
  }

  const subTypeLower = (garment.subType || '').toLowerCase();
  const occasionsJoined = (garment.occasions || []).join(' ').toLowerCase();

  if (subTypeLower.includes('sneaker') && (garment.formality ?? 3) <= 2) {
    return 'streetwear';
  }
  if (subTypeLower.includes('tuxedo') || subTypeLower.includes('oxford shirt') || (garment.formality ?? 3) >= 5) {
    return 'formal';
  }
  if ((garment.formality ?? 3) === 4 || occasionsJoined.includes('office') || occasionsJoined.includes('dinner')) {
    return 'smart-casual';
  }
  if (occasionsJoined.includes('party') || occasionsJoined.includes('galas')) {
    return 'party';
  }
  if (occasionsJoined.includes('gym') || occasionsJoined.includes('athletic')) {
    return 'sporty';
  }
  if ((garment.formality ?? 3) === 3) {
    return 'minimalist';
  }
  return 'casual';
}

export function mapAiCategoryToClosetPlacement(
  aiCategory: AiRecognizedCategoryDto | string,
): { category: GarmentCategory; subType: string; icon: string } {
  const key = aiCategory.trim().toLowerCase() as AiRecognizedCategoryDto;
  if (key in AI_CATEGORY_PLACEMENT) {
    return AI_CATEGORY_PLACEMENT[key];
  }
  const fallbackCategory = normalizeCategoryToDomain(aiCategory);
  return {
    category: fallbackCategory,
    subType: CATEGORY_DEFAULT_SUBTYPE[fallbackCategory],
    icon: CATEGORY_DEFAULT_ICON[fallbackCategory],
  };
}

/**
 * Maps backend `BackendWardrobeItemDto` -> `ClosetGarment`.
 * Converts backend `category: 'shoes'` -> `'footwear'` and backfills frontend UI fields
 * (`subType`, `formality`, `fit`, `occasions`, `wearCount`, `icon`).
 */
export function mapWardrobeItemDtoToDomain(
  dto: BackendWardrobeItemDto,
  imageUrlResolver?: (imageFileId: string) => string,
): ClosetGarment {
  const id = extractRecordId(dto);
  const category = normalizeCategoryToDomain(dto.category);
  const style = normalizeStyleTag(dto.style);
  const colorProfile = resolveColorProfile(dto.color);

  return {
    id,
    backendId: isMongoObjectId(id) ? id : undefined,
    origin: 'api',
    name: dto.name.trim(),
    category,
    subType: CATEGORY_DEFAULT_SUBTYPE[category],
    style,
    color: colorProfile.displayName,
    normalizedColor: colorProfile.baseToken,
    colorHex: colorProfile.hex,
    brand: dto.brand?.trim() || 'Atelier Piece',
    season: normalizeSeasonList(dto.season),
    formality: inferFormalityFromStyle(style),
    fit: 'Regular',
    normalizedFit: 'regular',
    occasions: style === 'formal' ? ['Work', 'Formal'] : ['Daily'],
    wearCount: 0,
    icon: CATEGORY_DEFAULT_ICON[category],
    imageFileId: dto.imageFileId,
    imageUrl:
      dto.imageFileId && imageUrlResolver
        ? imageUrlResolver(dto.imageFileId)
        : undefined,
    description: dto.notes,
    notes: dto.notes,
    isArchived: false,
    createdAt: dto.createdAt ? toIsoString(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : undefined,
  };
}

/**
 * Serializes `ClosetGarment` -> `CreateWardrobeItemRequestDto`.
 * Enforces `createWardrobeItemSchema.strict()` by stripping frontend-only keys
 * (`id`, `subType`, `formality`, `fit`, `occasions`, `wearCount`, `icon`, `isArchived`, data URL `imageUrl`).
 */
export function mapClosetGarmentToCreateDto(
  garment: Pick<ClosetGarment, 'name' | 'category' | 'color' | 'season'> &
    Partial<ClosetGarment>,
): CreateWardrobeItemRequestDto {
  const payload: CreateWardrobeItemRequestDto = {
    name: garment.name.trim().slice(0, 100) || 'Untitled Garment',
    category: mapCategoryToBackend(garment.category),
    color: (garment.color || 'Neutral').trim().slice(0, 50),
    style: inferStyleFromGarment(garment),
    season: normalizeSeasonList(garment.season),
  };

  const brand = garment.brand?.trim();
  if (brand) {
    payload.brand = brand.slice(0, 100);
  }

  const combinedNotes = (garment.notes ?? garment.description)?.trim();
  if (combinedNotes) {
    payload.notes = combinedNotes.slice(0, 1000);
  }

  if (garment.imageFileId?.trim()) {
    payload.imageFileId = garment.imageFileId.trim();
  }

  return payload;
}

export function mapClosetGarmentToUpdateDto(
  patch: Partial<ClosetGarment>,
): UpdateWardrobeItemRequestDto {
  const payload: UpdateWardrobeItemRequestDto = {};

  if (typeof patch.name === 'string' && patch.name.trim()) {
    payload.name = patch.name.trim().slice(0, 100);
  }
  if (patch.category !== undefined) {
    payload.category = mapCategoryToBackend(patch.category);
  }
  if (typeof patch.color === 'string' && patch.color.trim()) {
    payload.color = patch.color.trim().slice(0, 50);
  }
  if (patch.style !== undefined || patch.formality !== undefined) {
    payload.style = inferStyleFromGarment(patch);
  }
  if (patch.season !== undefined) {
    payload.season = normalizeSeasonList(patch.season);
  }
  if (typeof patch.brand === 'string') {
    payload.brand = patch.brand.trim().slice(0, 100);
  }
  if (typeof patch.notes === 'string' || typeof patch.description === 'string') {
    const noteText = (patch.notes ?? patch.description ?? '').trim();
    if (noteText) {
      payload.notes = noteText.slice(0, 1000);
    }
  }
  if (patch.imageFileId?.trim()) {
    payload.imageFileId = patch.imageFileId.trim();
  }

  return payload;
}

export function mapWardrobeImageUploadDtoToAsset(
  dto: BackendWardrobeImageUploadDto,
): GarmentImageUploadAsset {
  return {
    garmentId: dto.itemId,
    fileId: dto.image.fileId,
    filename: dto.image.filename,
    contentType: dto.image.contentType,
    sizeBytes: dto.image.size,
  };
}

export function mapAiPredictionToRecognitionCandidate(
  prediction: AiClothingPredictionDto,
  confidenceThreshold = 0.65,
): GarmentRecognitionCandidate {
  const placement = mapAiCategoryToClosetPlacement(prediction.category);
  const primaryColorProfile = prediction.color
    ? resolveColorProfile(prediction.color)
    : undefined;
  const primaryStyle = normalizeStyleTag(prediction.style?.[0]);

  return {
    suggestedCategory: placement.category,
    suggestedSubType: placement.subType,
    suggestedStyle: primaryStyle,
    rawAiCategory: prediction.category,
    primaryColor: primaryColorProfile?.displayName,
    colorHex: primaryColorProfile?.hex,
    secondaryColor: prediction.secondaryColor?.trim() || undefined,
    material: prediction.material?.trim() || undefined,
    pattern: prediction.pattern?.trim() || undefined,
    seasons: normalizeSeasonList(prediction.season),
    occasions: normalizeStringArray(prediction.occasions),
    confidence: prediction.confidence,
    isLowConfidence: prediction.confidence < confidenceThreshold,
  };
}

export function mapRecognitionResponseToDraftResult(
  dto: AiClothingRecognitionResponseDto,
  confidenceThreshold = 0.65,
): GarmentRecognitionDraftResult {
  return {
    candidates: (dto.predictions ?? []).map((pred) =>
      mapAiPredictionToRecognitionCandidate(pred, confidenceThreshold),
    ),
    modelVersion: dto.modelVersion,
    requestId: dto.requestId,
    requiresUserConfirmation: dto.requiresUserConfirmation ?? true,
    cutoutImageUrl: dto.cutoutImageUrl,
  };
}

export function mapRecognitionCandidateToDraftItem(
  candidate: GarmentRecognitionCandidate,
  draftId: string,
  previewUrl: string,
  source: 'gallery' | 'camera' = 'gallery',
): GarmentDraftItem {
  const colorName = candidate.primaryColor || 'Neutral';
  const placement = mapAiCategoryToClosetPlacement(candidate.rawAiCategory);

  return {
    id: draftId,
    previewUrl,
    source,
    status: 'ready',
    name: `${colorName} ${candidate.suggestedSubType}`.trim(),
    category: candidate.suggestedCategory,
    subType: candidate.suggestedSubType,
    style: candidate.suggestedStyle,
    color: colorName,
    colorHex: candidate.colorHex || resolveColorProfile(colorName).hex,
    brand: 'Bespoke',
    fit: 'Regular',
    formality: inferFormalityFromStyle(candidate.suggestedStyle),
    season: candidate.seasons,
    occasions: candidate.occasions.length > 0 ? candidate.occasions : ['Daily'],
    material: candidate.material,
    pattern: candidate.pattern,
    icon: placement.icon,
    recognitionConfidence: candidate.confidence,
    requiresUserConfirmation: true,
  };
}

/** Converts an existing `ClosetContext.ClosetItem` object cleanly into domain `ClosetGarment`. */
export function mapLegacyClosetItemToDomain(legacy: {
  id: string;
  name: string;
  category: 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories';
  subType: string;
  color: string;
  colorHex?: string;
  brand: string;
  season: string[];
  formality: number;
  fit: string;
  occasions: string[];
  wearCount: number;
  icon: string;
  imageUrl?: string;
  description?: string;
  isArchived?: boolean;
}): ClosetGarment {
  const colorProfile = resolveColorProfile(legacy.color);
  const clampedFormality = Math.min(5, Math.max(1, Math.round(legacy.formality))) as FormalityTier;

  return {
    id: legacy.id,
    backendId: isMongoObjectId(legacy.id) ? legacy.id : undefined,
    origin: isMongoObjectId(legacy.id) ? 'hybrid' : 'local',
    name: legacy.name,
    category: legacy.category,
    subType: legacy.subType,
    style: inferStyleFromGarment({
      formality: clampedFormality,
      subType: legacy.subType,
      occasions: legacy.occasions,
    }),
    color: legacy.color,
    normalizedColor: colorProfile.baseToken,
    colorHex: legacy.colorHex || colorProfile.hex,
    brand: legacy.brand,
    season: normalizeSeasonList(legacy.season),
    formality: clampedFormality,
    fit: legacy.fit,
    normalizedFit: normalizeFitToDomain(legacy.fit),
    occasions: normalizeStringArray(legacy.occasions),
    wearCount: legacy.wearCount,
    icon: legacy.icon,
    imageUrl: legacy.imageUrl,
    description: legacy.description,
    isArchived: legacy.isArchived ?? false,
  };
}

