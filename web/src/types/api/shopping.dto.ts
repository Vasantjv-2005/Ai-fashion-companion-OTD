/**
 * Backend API DTO contracts for Shopping Recommendations & Wardrobe Gap Intelligence.
 * Mirrors AI-FASHION-OTD/src/models/{ShoppingRecommendation,WardrobeGap}.ts,
 * modules/shopping/*, and modules/wardrobe-intelligence/*.
 */

import type { IsoDateString, MongoRecordDto, ObjectIdString } from './common.dto';

export type BackendShoppingRecommendationStatusDto =
  | 'suggested'
  | 'viewed'
  | 'saved'
  | 'purchased'
  | 'dismissed';

export type BackendShoppingRecommendationSourceDto =
  | 'ai'
  | 'wardrobe_gap'
  | 'fashion_trend'
  | 'manual';

export interface BackendShoppingRecommendationDto extends MongoRecordDto {
  userId: ObjectIdString;
  productName: string;
  brand?: string;
  description?: string;
  category: string;
  color?: string;
  style?: string;
  season?: string;
  productUrl: string;
  imageUrl?: string;
  price?: number;
  currency: string;
  source: BackendShoppingRecommendationSourceDto;
  status: BackendShoppingRecommendationStatusDto;
  recommendationReason?: string;
  relatedWardrobeItemIds: ObjectIdString[];
  relatedTrendId?: ObjectIdString;
  rating?: number;
  expiresAt?: IsoDateString;
}

export interface CreateShoppingRecommendationRequestDto {
  productName: string;
  brand?: string;
  description?: string;
  category: string;
  color?: string;
  style?: string;
  season?: string;
  productUrl: string;
  imageUrl?: string;
  price?: number;
  currency?: string;
  source?: BackendShoppingRecommendationSourceDto;
  recommendationReason?: string;
  relatedWardrobeItemIds?: ObjectIdString[];
}

export interface UpdateShoppingRecommendationStatusRequestDto {
  status: BackendShoppingRecommendationStatusDto;
}

export interface ShoppingQueryDto {
  category?: string;
  status?: BackendShoppingRecommendationStatusDto;
  source?: BackendShoppingRecommendationSourceDto;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export type BackendWardrobeGapPriorityDto = 'low' | 'medium' | 'high';

export type BackendWardrobeGapStatusDto =
  | 'identified'
  | 'recommended'
  | 'resolved'
  | 'dismissed';

export interface BackendWardrobeGapDto extends MongoRecordDto {
  userId: ObjectIdString;
  category: string;
  title: string;
  description: string;
  reason: string;
  priority: BackendWardrobeGapPriorityDto;
  status: BackendWardrobeGapStatusDto;
  suggestedColors: string[];
  suggestedStyles: string[];
  suggestedSeasons: string[];
  suggestedItemTypes: string[];
  relatedEventId?: ObjectIdString;
  relatedTrendId?: ObjectIdString;
  lastAnalyzedAt: IsoDateString;
}

export interface UpdateWardrobeGapStatusRequestDto {
  status: BackendWardrobeGapStatusDto;
}

export interface WardrobeGapQueryDto {
  status?: BackendWardrobeGapStatusDto;
  priority?: BackendWardrobeGapPriorityDto;
  category?: string;
}

export interface BackendWardrobeAnalyticsDto {
  totalItems: number;
  categories: Record<string, number>;
  styles: Record<string, number>;
  colors: Record<string, number>;
  seasons: Record<string, number>;
  neglectedItemsCount: number;
  mostWornItems: Array<{
    itemId: ObjectIdString;
    name: string;
    wearCount: number;
    lastWorn?: IsoDateString;
  }>;
  unwornItems: Array<{
    itemId: ObjectIdString;
    name: string;
    category: string;
    createdAt: IsoDateString;
  }>;
}

export type BackendWardrobeUsageOccasionDto =
  | 'daily'
  | 'work'
  | 'college'
  | 'party'
  | 'date'
  | 'wedding'
  | 'travel'
  | 'fitness'
  | 'special_event';

export interface LogWardrobeUsageRequestDto {
  wardrobeItemId: ObjectIdString;
  outfitId?: ObjectIdString;
  eventId?: ObjectIdString;
  occasion?: BackendWardrobeUsageOccasionDto;
  usedAt?: IsoDateString;
  notes?: string;
}

export interface BackendWardrobeUsageRecordDto extends MongoRecordDto {
  userId: ObjectIdString;
  wardrobeItemId: ObjectIdString;
  outfitId?: ObjectIdString;
  eventId?: ObjectIdString;
  occasion: BackendWardrobeUsageOccasionDto;
  usedAt: IsoDateString;
  notes?: string;
}

export interface BackendItemUsageStatisticsDto {
  itemId: ObjectIdString;
  totalWears: number;
  occasions: Record<string, number>;
  firstWorn?: IsoDateString;
  lastWorn?: IsoDateString;
}

