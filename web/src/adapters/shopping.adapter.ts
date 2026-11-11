/**
 * Bidirectional Shopping Wishlist, Wardrobe Gap Intelligence, and Analytics adapters.
 */

import type {
  BackendItemUsageStatisticsDto,
  BackendShoppingRecommendationDto,
  BackendShoppingRecommendationSourceDto,
  BackendWardrobeAnalyticsDto,
  BackendWardrobeGapDto,
  CreateShoppingRecommendationRequestDto,
} from '../types/api';
import type {
  ItemUsageSummary,
  WardrobeAnalyticsSummary,
  WardrobeGapItem,
  WishlistCurrency,
  WishlistItem,
  WishlistOwnershipStatus,
  WishlistSource,
} from '../types/domain';
import {
  extractRecordId,
  isMongoObjectId,
  mapCategoryToBackend,
  normalizeCategoryToDomain,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  toIsoString,
} from './shared.adapter';

export function formatWishlistPrice(
  price?: number,
  currency: WishlistCurrency = 'INR',
): string {
  if (typeof price !== 'number' || !Number.isFinite(price) || price < 0) {
    return currency === 'INR' ? '₹2,999' : `${currency} 49`;
  }
  if (currency === 'INR') {
    return `₹${Math.round(price).toLocaleString('en-IN')}`;
  }
  return `${currency} ${price.toLocaleString('en-US')}`;
}

export function parseWishlistPriceNumber(rawPrice?: string | number): number | undefined {
  if (typeof rawPrice === 'number' && Number.isFinite(rawPrice) && rawPrice >= 0) {
    return rawPrice;
  }
  if (typeof rawPrice !== 'string') return undefined;
  const cleaned = rawPrice.replace(/[^0-9.]/g, '');
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function mapBackendShoppingSourceToDomain(
  source: BackendShoppingRecommendationSourceDto,
): WishlistSource {
  switch (source) {
    case 'wardrobe_gap':
      return 'gap-analysis';
    case 'manual':
      return 'manual';
    default:
      return 'ai-recommendation';
  }
}

function mapDomainSourceToBackend(source: WishlistSource): BackendShoppingRecommendationSourceDto {
  switch (source) {
    case 'gap-analysis':
      return 'wardrobe_gap';
    case 'manual':
      return 'manual';
    default:
      return 'ai';
  }
}

function normalizeCurrency(raw?: string): WishlistCurrency {
  const token = (raw || 'INR').trim().toUpperCase();
  if (token === 'USD' || token === 'EUR' || token === 'GBP' || token === 'INR') {
    return token;
  }
  return 'INR';
}

export function mapShoppingDtoToWishlistItem(
  dto: BackendShoppingRecommendationDto,
): WishlistItem {
  const id = extractRecordId(dto);
  const currency = normalizeCurrency(dto.currency);

  return {
    id,
    backendId: isMongoObjectId(id) ? id : undefined,
    origin: 'api',
    name: dto.productName.trim(),
    brand: dto.brand?.trim() || undefined,
    description: dto.description?.trim() || undefined,
    category: normalizeCategoryToDomain(dto.category),
    color: dto.color?.trim() || undefined,
    style: dto.style ? normalizeStyleTag(dto.style) : undefined,
    season: dto.season ? normalizeSeasonList([dto.season])[0] : undefined,
    reason:
      dto.recommendationReason?.trim() ||
      dto.description?.trim() ||
      'Recommended wardrobe addition',
    price: dto.price,
    priceDisplay: formatWishlistPrice(dto.price, currency),
    currency,
    source: mapBackendShoppingSourceToDomain(dto.source),
    status: dto.status,
    ownershipStatus: 'missing',
    productUrl: dto.productUrl,
    imageUrl: dto.imageUrl,
    relatedGarmentIds: normalizeStringArray((dto.relatedWardrobeItemIds ?? []).map(String)),
    rating: typeof dto.rating === 'number' ? dto.rating : undefined,
    addedAt: toIsoString(dto.createdAt),
  };
}

/**
 * Serializes domain `WishlistItem` -> `CreateShoppingRecommendationRequestDto`.
 * Note: Backend requires a valid `productUrl` URL (`z.string().url()`).
 * Uses `item.productUrl` when valid HTTP(S), or constructs a safe HTTPS search reference URL when absent.
 */
export function mapWishlistItemToCreateDto(
  item: Pick<WishlistItem, 'name' | 'category' | 'reason' | 'source'> & Partial<WishlistItem>,
): CreateShoppingRecommendationRequestDto {
  const rawUrl = item.productUrl?.trim();
  const validProductUrl =
    rawUrl && /^https?:\/\/.+/i.test(rawUrl)
      ? rawUrl
      : `https://otd-stylist.local/search?q=${encodeURIComponent(item.name.trim())}`;

  const parsedPrice = item.price ?? parseWishlistPriceNumber(item.priceDisplay);
  const relatedIds = (item.relatedGarmentIds ?? []).filter((id) => isMongoObjectId(id));

  const dto: CreateShoppingRecommendationRequestDto = {
    productName: item.name.trim().slice(0, 200) || 'Curated Piece',
    category: mapCategoryToBackend(item.category),
    productUrl: validProductUrl.slice(0, 2048),
    currency: item.currency ?? 'INR',
    source: mapDomainSourceToBackend(item.source),
    recommendationReason: item.reason?.trim().slice(0, 1000) || undefined,
    relatedWardrobeItemIds: relatedIds,
  };

  if (item.brand?.trim()) dto.brand = item.brand.trim().slice(0, 100);
  if (item.description?.trim()) dto.description = item.description.trim().slice(0, 2000);
  if (item.color?.trim()) dto.color = item.color.trim().slice(0, 50);
  if (item.style) dto.style = item.style;
  if (item.season) dto.season = item.season;
  if (parsedPrice !== undefined) dto.price = parsedPrice;
  if (item.imageUrl && /^https?:\/\/.+/i.test(item.imageUrl)) {
    dto.imageUrl = item.imageUrl;
  }

  return dto;
}

/** Converts legacy `ClosetContext.ShoppingListItem` into normalized domain `WishlistItem`. */
export function mapLegacyShoppingItemToDomain(legacy: {
  id: string;
  name: string;
  category: string;
  reason: string;
  estimatedPrice: string;
  addedAt: string;
  source?: 'outfit-slot' | 'manual' | 'gap-analysis';
  ownershipStatus?: WishlistOwnershipStatus;
}): WishlistItem {
  return {
    id: legacy.id,
    backendId: isMongoObjectId(legacy.id) ? legacy.id : undefined,
    origin: isMongoObjectId(legacy.id) ? 'hybrid' : 'local',
    name: legacy.name,
    category: normalizeCategoryToDomain(legacy.category),
    reason: legacy.reason,
    price: parseWishlistPriceNumber(legacy.estimatedPrice),
    priceDisplay: legacy.estimatedPrice,
    currency: 'INR',
    source: legacy.source ?? 'manual',
    status: 'saved',
    ownershipStatus: legacy.ownershipStatus ?? 'missing',
    addedAt: legacy.addedAt,
  };
}

export function mapWardrobeGapDtoToDomain(dto: BackendWardrobeGapDto): WardrobeGapItem {
  const rawCat = dto.category.trim().toLowerCase();
  const mappedCategory =
    rawCat === 'formal' || rawCat === 'neutrals'
      ? rawCat
      : normalizeCategoryToDomain(rawCat);

  return {
    id: extractRecordId(dto),
    origin: 'api',
    category: mappedCategory,
    title: dto.title.trim(),
    description: dto.description.trim(),
    reason: dto.reason.trim(),
    priority: dto.priority,
    status: dto.status,
    suggestedColors: normalizeStringArray(dto.suggestedColors),
    suggestedStyles: normalizeStringArray(dto.suggestedStyles),
    suggestedSeasons: normalizeStringArray(dto.suggestedSeasons),
    suggestedItemTypes: normalizeStringArray(dto.suggestedItemTypes),
    relatedEventId: dto.relatedEventId ? String(dto.relatedEventId) : undefined,
    lastAnalyzedAt: dto.lastAnalyzedAt ? toIsoString(dto.lastAnalyzedAt) : undefined,
  };
}

export function mapWardrobeAnalyticsDtoToSummary(
  dto: BackendWardrobeAnalyticsDto,
): WardrobeAnalyticsSummary {
  const normalizedCategories: Record<string, number> = {};
  for (const [cat, count] of Object.entries(dto.categories ?? {})) {
    const key = cat.toLowerCase() === 'shoes' ? 'footwear' : cat.toLowerCase();
    normalizedCategories[key] = (normalizedCategories[key] ?? 0) + count;
  }

  return {
    totalItems: dto.totalItems,
    categories: normalizedCategories,
    styles: { ...(dto.styles ?? {}) },
    colors: { ...(dto.colors ?? {}) },
    seasons: { ...(dto.seasons ?? {}) },
    neglectedItemsCount: dto.neglectedItemsCount,
    mostWornItems: (dto.mostWornItems ?? []).map((item) => ({
      garmentId: item.itemId,
      name: item.name,
      wearCount: item.wearCount,
      lastWorn: item.lastWorn ? toIsoString(item.lastWorn) : undefined,
    })),
    unwornItems: (dto.unwornItems ?? []).map((item) => ({
      garmentId: item.itemId,
      name: item.name,
      category: normalizeCategoryToDomain(item.category),
      createdAt: item.createdAt ? toIsoString(item.createdAt) : undefined,
    })),
  };
}

export function mapUsageStatsDtoToSummary(
  dto: BackendItemUsageStatisticsDto,
): ItemUsageSummary {
  return {
    garmentId: dto.itemId,
    totalWears: dto.totalWears,
    occasions: { ...(dto.occasions ?? {}) },
    firstWorn: dto.firstWorn ? toIsoString(dto.firstWorn) : undefined,
    lastWorn: dto.lastWorn ? toIsoString(dto.lastWorn) : undefined,
  };
}

