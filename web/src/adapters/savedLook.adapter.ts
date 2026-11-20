/**
 * Bidirectional Saved Looks adapters cleanly isolating local editorial slugs
 * (`saved-1`, `sug-2`, `idea-1`) from backend persisted `Outfit` ObjectIds.
 */

import type { BackendOutfitDto, CreateOutfitRequestDto } from '../types/api';
import type {
  ClosetGarment,
  LikedLookReference,
  OutfitSlotName,
  OutfitSlotPiece,
  SavedLook,
  SavedLookIdentifier,
} from '../types/domain';
import {
  extractRecordId,
  isMongoObjectId,
  mapDomainCategoryToSlot,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  toIsoString,
} from './shared.adapter';
import {
  extractOutfitItemIds,
  mapOccasionToBackendEnum,
  partitionMongoItemIds,
} from './outfit.adapter';

export const DEFAULT_EDITORIAL_LOOK_IMAGE =
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80';

const DEFAULT_TEMPLATE_LINK_MAP: Record<string, string> = {
  'smart-casual-1': 'sug-1',
  'date-night-1': 'sug-2',
  'office-ready-1': 'sug-3',
};

const VALID_SLOT_NAMES: ReadonlySet<OutfitSlotName> = new Set([
  'top',
  'outerwear',
  'bottom',
  'footwear',
  'accessory',
]);

/**
 * Resolves dual identity (`localId` vs `backendOutfitId` vs `sourceTemplateId`)
 * so callers never issue API requests with slug IDs like `'saved-1'` or `'sug-1'`.
 */
export function resolveSavedLookIdentifier(
  look: Pick<SavedLook, 'id' | 'backendOutfitId' | 'sourceTemplateId'>,
): SavedLookIdentifier {
  const candidateMongoId = isMongoObjectId(look.backendOutfitId)
    ? look.backendOutfitId
    : isMongoObjectId(look.id)
      ? look.id
      : undefined;

  return {
    localId: look.id,
    backendOutfitId: candidateMongoId,
    sourceTemplateId: look.sourceTemplateId,
    isPersistedOnBackend: Boolean(candidateMongoId),
  };
}

export function classifyLikedLookId(id: string): LikedLookReference {
  const trimmed = id.trim();
  const isMongo = isMongoObjectId(trimmed);
  const isCard = trimmed.startsWith('sug-') || trimmed.startsWith('idea-');

  return {
    id: trimmed,
    kind: isMongo ? 'api-outfit' : isCard ? 'editorial-card' : 'saved-look',
    isMongoObjectId: isMongo,
  };
}

function sanitizeSlotAssignments(
  rawAssignments?: Partial<Record<string, string>>,
): Partial<Record<OutfitSlotName, string>> | undefined {
  if (!rawAssignments) return undefined;
  const sanitized: Partial<Record<OutfitSlotName, string>> = {};
  let hasEntries = false;
  for (const [slotKey, itemId] of Object.entries(rawAssignments)) {
    if (
      VALID_SLOT_NAMES.has(slotKey as OutfitSlotName) &&
      typeof itemId === 'string' &&
      itemId.trim().length > 0
    ) {
      sanitized[slotKey as OutfitSlotName] = itemId.trim();
      hasEntries = true;
    }
  }
  return hasEntries ? sanitized : undefined;
}

export function mapBackendOutfitToSavedLook(
  dto: BackendOutfitDto,
  garmentsById?: ReadonlyMap<string, ClosetGarment>,
  fallbackImageUrl: string = DEFAULT_EDITORIAL_LOOK_IMAGE,
): SavedLook {
  const id = extractRecordId(dto);
  const itemIds = extractOutfitItemIds(dto);
  const garmentNames = itemIds.map(
    (itemId) => garmentsById?.get(itemId)?.name || `Closet Piece (${itemId.slice(-4)})`,
  );
  const firstImage = itemIds
    .map((itemId) => garmentsById?.get(itemId)?.imageUrl)
    .find((url): url is string => Boolean(url));

  const inferredSlots: Partial<Record<OutfitSlotName, string>> = {};
  if (garmentsById) {
    for (const itemId of itemIds) {
      const item = garmentsById.get(itemId);
      if (!item) continue;
      const slot = mapDomainCategoryToSlot(item.category);
      if (!inferredSlots[slot]) {
        inferredSlots[slot] = item.id;
      }
    }
  }

  const style = normalizeStyleTag(dto.style);
  const season = normalizeSeasonList(dto.season ? [dto.season] : undefined)[0] ?? 'all-season';

  return {
    id,
    backendOutfitId: isMongoObjectId(id) ? id : undefined,
    origin: 'api',
    sourceKind: 'api-outfit',
    title: dto.name.trim(),
    subtitle: dto.description?.trim() || `${dto.occasion || 'Casual'} • ${style}`,
    occasion: dto.occasion || 'casual',
    vibe: style,
    style,
    season,
    isFavorite: Boolean(dto.isFavorite) || dto.status === 'saved',
    rating: typeof dto.rating === 'number' ? dto.rating : undefined,
    weatherTag: `${season} • Curated Fit`,
    imageUrl: firstImage || fallbackImageUrl,
    tags: normalizeStringArray([dto.occasion || 'Casual', style, season]),
    garments: garmentNames,
    garmentIds: itemIds,
    slotAssignments: Object.keys(inferredSlots).length > 0 ? inferredSlots : undefined,
    colorPalette: normalizeStringArray(dto.colorPalette),
    reason: dto.notes?.trim() || dto.description?.trim() || 'Saved from your OTD Atelier wardrobe.',
    notes: dto.notes,
    savedAt: toIsoString(dto.createdAt),
    wornAt: dto.wornAt ? toIsoString(dto.wornAt) : undefined,
  };
}

export function mapSavedLookToCreateOutfitDto(
  look: SavedLook,
): { dto: CreateOutfitRequestDto | null; skippedLocalIds: string[] } {
  const { validObjectIds, skippedLocalIds } = partitionMongoItemIds(look.garmentIds);
  if (validObjectIds.length === 0) {
    return { dto: null, skippedLocalIds };
  }

  return {
    dto: {
      name: look.title.trim().slice(0, 150) || 'Saved Ensemble',
      description: look.subtitle?.trim().slice(0, 1000) || undefined,
      clothingItemIds: validObjectIds,
      occasion: mapOccasionToBackendEnum(look.occasion),
      style: normalizeStyleTag(look.style ?? look.vibe),
      season: normalizeSeasonList(look.season ? [look.season] : undefined)[0] ?? 'all-season',
      colorPalette:
        look.colorPalette.length > 0 ? normalizeStringArray(look.colorPalette).slice(0, 20) : undefined,
      status: look.wornAt ? 'worn' : 'saved',
      rating: typeof look.rating === 'number' ? look.rating : undefined,
      notes: (look.notes || look.reason)?.trim().slice(0, 1000) || undefined,
      wornAt: look.wornAt ? toIsoString(look.wornAt) : undefined,
    },
    skippedLocalIds,
  };
}

export interface LegacySavedLookInput {
  id: string;
  backendOutfitId?: string;
  sourceTemplateId?: string;
  title?: string;
  subtitle?: string;
  occasion?: string;
  venue?: string;
  vibe?: string;
  style?: string;
  season?: string;
  isFavorite?: boolean;
  weatherTag?: string;
  weather?: string;
  imageUrl?: string;
  img?: string;
  tags?: string[];
  garments?: string[];
  piecesSummary?: string;
  garmentIds?: string[];
  slotAssignments?: Partial<Record<string, string>>;
  slots?: OutfitSlotPiece[];
  variationIndex?: number;
  colorPalette?: string[];
  reason?: string;
  notes?: string;
  savedAt?: string;
  date?: string;
  wornAt?: string;
  isCustom?: boolean;
}

/** Converts an existing legacy `AppStudio.SavedLookItem` or partial record into normalized domain `SavedLook`. */
export function mapLegacySavedLookToDomain(legacy: LegacySavedLookInput): SavedLook {
  const cleanId = legacy.id.trim();
  const explicitMongo = isMongoObjectId(legacy.backendOutfitId)
    ? legacy.backendOutfitId
    : isMongoObjectId(cleanId)
      ? cleanId
      : undefined;

  const isCuratedDefault =
    cleanId.startsWith('saved-') ||
    cleanId in DEFAULT_TEMPLATE_LINK_MAP ||
    legacy.isCustom === false;

  const parsedGarments =
    Array.isArray(legacy.garments) && legacy.garments.length > 0
      ? normalizeStringArray(legacy.garments)
      : typeof legacy.piecesSummary === 'string' && legacy.piecesSummary.trim()
        ? normalizeStringArray(legacy.piecesSummary.split(','))
        : [];

  const resolvedOccasion = (legacy.occasion || 'Casual').trim();
  const resolvedVibe = (legacy.vibe || legacy.style || 'Refined').trim();
  const resolvedWeather = (legacy.weatherTag || legacy.weather || 'Mild • All-Season').trim();
  const resolvedImage =
    (legacy.imageUrl || legacy.img || '').trim() || DEFAULT_EDITORIAL_LOOK_IMAGE;
  const resolvedTimestamp = legacy.savedAt
    ? toIsoString(legacy.savedAt)
    : new Date().toISOString();

  return {
    id: cleanId,
    backendOutfitId: explicitMongo,
    sourceTemplateId: legacy.sourceTemplateId || DEFAULT_TEMPLATE_LINK_MAP[cleanId],
    origin: explicitMongo ? 'hybrid' : 'local',
    sourceKind: isCuratedDefault ? 'curated-default' : 'stylist-generated',
    title: (legacy.title || 'Saved Ensemble').trim(),
    subtitle: (legacy.subtitle || `${resolvedOccasion} Ensemble`).trim(),
    occasion: resolvedOccasion,
    venue: legacy.venue?.trim() || undefined,
    vibe: resolvedVibe,
    style: normalizeStyleTag(legacy.style || resolvedVibe),
    season: normalizeSeasonList(legacy.season)[0] ?? 'all-season',
    isFavorite: typeof legacy.isFavorite === 'boolean' ? legacy.isFavorite : true,
    weatherTag: resolvedWeather,
    imageUrl: resolvedImage,
    tags:
      Array.isArray(legacy.tags) && legacy.tags.length > 0
        ? normalizeStringArray(legacy.tags)
        : normalizeStringArray([resolvedOccasion, resolvedVibe]),
    garments: parsedGarments,
    garmentIds: normalizeStringArray(legacy.garmentIds),
    slotAssignments: sanitizeSlotAssignments(legacy.slotAssignments),
    slots: Array.isArray(legacy.slots) && legacy.slots.length > 0 ? legacy.slots : undefined,
    variationIndex: typeof legacy.variationIndex === 'number' ? legacy.variationIndex : undefined,
    colorPalette: normalizeStringArray(legacy.colorPalette),
    reason: (legacy.reason || legacy.subtitle || 'Saved ensemble from your OTD Studio.').trim(),
    notes: legacy.notes?.trim() || undefined,
    savedAt: resolvedTimestamp,
    wornAt: legacy.wornAt ? toIsoString(legacy.wornAt) : undefined,
  };
}

