/**
 * Bidirectional Outfit, Outfit Generation, Wear History, and Rating adapters.
 * Reconciles `clothingItemIds` (outfits.validator.ts) vs `wardrobeItemIds` (models/Outfit.ts).
 */

import type {
  BackendOutfitDto,
  BackendOutfitHistoryDto,
  BackendOutfitOccasionDto,
  BackendOutfitRatingDto,
  CreateOutfitRequestDto,
  GenerateOutfitsRequestDto,
  GenerateOutfitsResponseDto,
  LogOutfitWearRequestDto,
  UpdateOutfitRequestDto,
} from '../types/api';
import type {
  OutfitGenerationCriteria,
  OutfitGenerationSummary,
  OutfitRatingSummary,
  OutfitRecord,
  OutfitWearLog,
  SynthesizedOutfitEnsemble,
} from '../types/domain';
import {
  extractRecordId,
  isMongoObjectId,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  toIsoString,
} from './shared.adapter';

export function mapOccasionToBackendEnum(rawOccasion?: string): BackendOutfitOccasionDto {
  const token = (rawOccasion || '').trim().toLowerCase();
  if (!token || token.includes('casual') || token.includes('brunch') || token.includes('coffee')) {
    return 'casual';
  }
  if (token.includes('office') || token.includes('work') || token.includes('business') || token.includes('meeting')) {
    return 'work';
  }
  if (token.includes('date') || token.includes('romantic')) {
    return 'date';
  }
  if (token.includes('wedding') || token.includes('reception') || token.includes('haldi')) {
    return 'wedding';
  }
  if (token.includes('party') || token.includes('cocktail') || token.includes('nightlife') || token.includes('gala')) {
    return 'party';
  }
  if (token.includes('travel') || token.includes('airport') || token.includes('resort') || token.includes('weekend')) {
    return 'travel';
  }
  if (token.includes('gym') || token.includes('workout') || token.includes('fitness')) {
    return 'gym';
  }
  if (token.includes('formal') || token.includes('black tie') || token.includes('ceremony')) {
    return 'formal';
  }
  return 'other';
}

/** Extracts garment IDs whether serialized under `wardrobeItemIds` or `clothingItemIds`. */
export function extractOutfitItemIds(dto: Pick<BackendOutfitDto, 'wardrobeItemIds' | 'clothingItemIds'>): string[] {
  const source =
    Array.isArray(dto.wardrobeItemIds) && dto.wardrobeItemIds.length > 0
      ? dto.wardrobeItemIds
      : Array.isArray(dto.clothingItemIds)
        ? dto.clothingItemIds
        : [];
  return normalizeStringArray(source.map((id) => String(id)));
}

export function partitionMongoItemIds(ids: readonly string[]): {
  validObjectIds: string[];
  skippedLocalIds: string[];
} {
  const seen = new Set<string>();
  const validObjectIds: string[] = [];
  const skippedLocalIds: string[] = [];

  for (const rawId of ids) {
    const trimmed = rawId.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    if (isMongoObjectId(trimmed)) {
      validObjectIds.push(trimmed);
    } else {
      skippedLocalIds.push(trimmed);
    }
  }

  return { validObjectIds, skippedLocalIds };
}

export function mapOutfitDtoToRecord(dto: BackendOutfitDto): OutfitRecord {
  const seasonList = normalizeSeasonList(dto.season ? [dto.season] : undefined);
  const status =
    dto.status ?? (dto.wornAt ? 'worn' : dto.isFavorite ? 'saved' : 'generated');

  return {
    id: extractRecordId(dto),
    origin: 'api',
    userId: dto.userId,
    name: dto.name.trim(),
    description: dto.description ?? '',
    garmentIds: extractOutfitItemIds(dto),
    occasion: dto.occasion || 'casual',
    style: normalizeStyleTag(dto.style),
    season: seasonList[0] ?? 'all-season',
    isFavorite: Boolean(dto.isFavorite) || status === 'saved',
    status,
    colorPalette: normalizeStringArray(dto.colorPalette),
    aiGenerated: Boolean(dto.aiGenerated),
    rating: typeof dto.rating === 'number' ? dto.rating : undefined,
    notes: dto.notes ?? '',
    wornAt: dto.wornAt ? toIsoString(dto.wornAt) : undefined,
    createdAt: dto.createdAt ? toIsoString(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : undefined,
  };
}

/**
 * Serializes `OutfitRecord` -> `CreateOutfitRequestDto` matching `createOutfitSchema.strict()`.
 * Returns `dto: null` when zero valid 24-hex Mongo ObjectIds exist among `garmentIds`,
 * avoiding guaranteed HTTP 400 validation failures from guest/local IDs (`closet-1`).
 */
export function mapOutfitRecordToCreateDto(record: {
  name: string;
  garmentIds: readonly string[];
  description?: string;
  occasion?: string;
  style?: string;
  season?: string;
  colorPalette?: readonly string[];
  status?: 'generated' | 'saved' | 'worn';
  aiGenerated?: boolean;
  rating?: number;
  notes?: string;
  wornAt?: string;
}): { dto: CreateOutfitRequestDto | null; skippedLocalIds: string[] } {
  const { validObjectIds, skippedLocalIds } = partitionMongoItemIds(record.garmentIds);
  if (validObjectIds.length === 0) {
    return { dto: null, skippedLocalIds };
  }

  const season = normalizeSeasonList(record.season)[0] ?? 'all-season';
  const dto: CreateOutfitRequestDto = {
    name: record.name.trim().slice(0, 150) || 'Curated Ensemble',
    clothingItemIds: validObjectIds,
    occasion: mapOccasionToBackendEnum(record.occasion),
    style: normalizeStyleTag(record.style),
    season,
  };

  if (record.description?.trim()) {
    dto.description = record.description.trim().slice(0, 1000);
  }
  if (record.colorPalette && record.colorPalette.length > 0) {
    dto.colorPalette = normalizeStringArray(record.colorPalette).slice(0, 20);
  }
  if (record.status) {
    dto.status = record.status;
  }
  if (typeof record.aiGenerated === 'boolean') {
    dto.aiGenerated = record.aiGenerated;
  }
  if (typeof record.rating === 'number' && record.rating >= 1 && record.rating <= 5) {
    dto.rating = record.rating;
  }
  if (record.notes?.trim()) {
    dto.notes = record.notes.trim().slice(0, 1000);
  }
  if (record.wornAt) {
    dto.wornAt = toIsoString(record.wornAt);
  }

  return { dto, skippedLocalIds };
}

export function mapEnsembleToCreateOutfitDto(
  ensemble: SynthesizedOutfitEnsemble,
): { dto: CreateOutfitRequestDto | null; skippedLocalIds: string[] } {
  const collectedIds: string[] = [...ensemble.garmentIds];
  for (const slot of ensemble.slots) {
    const id = slot.backendGarmentId ?? slot.garmentId;
    if (id) collectedIds.push(id);
  }

  return mapOutfitRecordToCreateDto({
    name: ensemble.title,
    garmentIds: collectedIds,
    description: ensemble.styleAlignment,
    occasion: ensemble.occasion,
    style: ensemble.styleAlignment,
    colorPalette: ensemble.slots.map((s) => s.color),
    status: 'saved',
    aiGenerated: true,
    notes: ensemble.rationale.join(' • '),
  });
}

export function mapOutfitPatchToUpdateDto(
  patch: Partial<OutfitRecord>,
): { dto: UpdateOutfitRequestDto; skippedLocalIds: string[] } {
  const dto: UpdateOutfitRequestDto = {};
  let skippedLocalIds: string[] = [];

  if (typeof patch.name === 'string' && patch.name.trim()) {
    dto.name = patch.name.trim().slice(0, 150);
  }
  if (typeof patch.description === 'string') {
    dto.description = patch.description.trim().slice(0, 1000);
  }
  if (patch.garmentIds !== undefined) {
    const partitioned = partitionMongoItemIds(patch.garmentIds);
    skippedLocalIds = partitioned.skippedLocalIds;
    if (partitioned.validObjectIds.length > 0) {
      dto.clothingItemIds = partitioned.validObjectIds;
    }
  }
  if (patch.occasion !== undefined) {
    dto.occasion = mapOccasionToBackendEnum(patch.occasion);
  }
  if (patch.style !== undefined) {
    dto.style = normalizeStyleTag(patch.style);
  }
  if (patch.season !== undefined) {
    dto.season = normalizeSeasonList([patch.season])[0];
  }
  if (patch.colorPalette !== undefined) {
    dto.colorPalette = normalizeStringArray(patch.colorPalette).slice(0, 20);
  }
  if (patch.status !== undefined) {
    dto.status = patch.status;
  }
  if (typeof patch.aiGenerated === 'boolean') {
    dto.aiGenerated = patch.aiGenerated;
  }
  if (typeof patch.rating === 'number' && patch.rating >= 1 && patch.rating <= 5) {
    dto.rating = patch.rating;
  }
  if (typeof patch.notes === 'string') {
    dto.notes = patch.notes.trim().slice(0, 1000);
  }
  if (patch.wornAt !== undefined) {
    dto.wornAt = toIsoString(patch.wornAt);
  }

  return { dto, skippedLocalIds };
}

export function mapCriteriaToGenerateOutfitsDto(
  criteria: OutfitGenerationCriteria,
): GenerateOutfitsRequestDto {
  const { validObjectIds } = partitionMongoItemIds(criteria.excludedGarmentIds);
  const season = criteria.season ? normalizeSeasonList([criteria.season])[0] : undefined;

  return {
    occasion: mapOccasionToBackendEnum(criteria.occasion),
    requestedStyle: criteria.style ? normalizeStyleTag(criteria.style) : undefined,
    season,
    excludedItemIds: validObjectIds.length > 0 ? validObjectIds : undefined,
    preferredColor: criteria.preferredColor?.trim() || undefined,
    includeAccessories: criteria.includeAccessories ?? true,
  };
}

export function mapGenerateOutfitsResponseDtoToSummary(
  dto: GenerateOutfitsResponseDto,
): OutfitGenerationSummary {
  return {
    candidates: (dto.recommendations ?? []).map((item) => ({
      garmentIds: normalizeStringArray(item.itemIds),
      explanation: item.explanation || '',
      score: typeof item.score === 'number' ? item.score : undefined,
    })),
    total: typeof dto.total === 'number' ? dto.total : (dto.recommendations ?? []).length,
    processingTimeMs: dto.processingTimeMs ?? 0,
  };
}

export function mapOutfitHistoryDtoToWearLog(dto: BackendOutfitHistoryDto): OutfitWearLog {
  return {
    id: extractRecordId(dto),
    origin: 'api',
    outfitId: dto.outfitId,
    outfitName: dto.outfitName || 'Worn Ensemble',
    garmentIds: normalizeStringArray((dto.wardrobeItemIds ?? []).map((id) => String(id))),
    occasion: dto.occasion || 'casual',
    wornAt: toIsoString(dto.wornAt),
    notes: dto.notes ?? '',
    rating: typeof dto.rating === 'number' ? dto.rating : undefined,
    feedback: dto.feedback ?? '',
    createdAt: dto.createdAt ? toIsoString(dto.createdAt) : undefined,
  };
}

export function mapWearLogToCreateDto(log: {
  outfitId?: string;
  outfitName?: string;
  garmentIds?: readonly string[];
  occasion?: string;
  wornAt?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}): LogOutfitWearRequestDto {
  const { validObjectIds } = partitionMongoItemIds(log.garmentIds ?? []);

  return {
    outfitId: isMongoObjectId(log.outfitId) ? log.outfitId : undefined,
    outfitName: log.outfitName?.trim() || undefined,
    wardrobeItemIds: validObjectIds.length > 0 ? validObjectIds : undefined,
    occasion: mapOccasionToBackendEnum(log.occasion),
    wornAt: log.wornAt ? toIsoString(log.wornAt) : undefined,
    notes: log.notes?.trim() || undefined,
    rating: typeof log.rating === 'number' ? log.rating : undefined,
    feedback: log.feedback?.trim() || undefined,
  };
}

export function mapOutfitRatingDtoToDomain(dto: BackendOutfitRatingDto): OutfitRatingSummary {
  return {
    id: extractRecordId(dto),
    outfitId: String(dto.outfitId),
    rating: dto.rating,
    feedback: dto.feedback ?? '',
    occasion: dto.occasion || 'casual',
    wouldWearAgain: dto.wouldWearAgain,
    createdAt: dto.createdAt ? toIsoString(dto.createdAt) : undefined,
  };
}
