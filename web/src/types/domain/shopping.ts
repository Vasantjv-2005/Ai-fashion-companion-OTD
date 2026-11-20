/**
 * Frontend domain models for Shopping / Acquisition Wishlist,
 * Ownership Deduplication, Wardrobe Gap Intelligence, and Usage Analytics.
 */

import type {
  EntityOrigin,
  GarmentCategory,
  GarmentSeason,
  GarmentStyleTag,
} from './common';
import type { ClosetGarment } from './wardrobe';

export type WishlistSource = 'outfit-slot' | 'manual' | 'gap-analysis' | 'ai-recommendation';

export type WishlistOwnershipStatus =
  | 'missing'
  | 'already-owned'
  | 'similar-owned';

export type WishlistStatus =
  | 'suggested'
  | 'viewed'
  | 'saved'
  | 'purchased'
  | 'dismissed';

export type WishlistCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';

export interface WishlistItem {
  id: string;
  backendId?: string;
  origin: EntityOrigin;
  name: string;
  brand?: string;
  description?: string;
  category: GarmentCategory;
  color?: string;
  style?: GarmentStyleTag;
  season?: GarmentSeason;
  reason: string;
  price?: number;
  priceDisplay: string;
  currency: WishlistCurrency;
  source: WishlistSource;
  status: WishlistStatus;
  ownershipStatus?: WishlistOwnershipStatus;
  productUrl?: string;
  imageUrl?: string;
  relatedGarmentIds?: string[];
  rating?: number;
  addedAt: string;
}

export interface WishlistOwnedAlternative {
  garment: ClosetGarment;
  matchScore: number;
  matchReasons: string[];
}

export interface WishlistOwnershipMatch {
  hasExactOrStrongMatch: boolean;
  hasSimilarMatch: boolean;
  matches: WishlistOwnedAlternative[];
}

export type WardrobeGapPriority = 'high' | 'medium' | 'low';

export type WardrobeGapStatus =
  | 'identified'
  | 'recommended'
  | 'resolved'
  | 'dismissed';

export interface WardrobeGapItem {
  id: string;
  origin: EntityOrigin;
  category: GarmentCategory | 'formal' | 'neutrals';
  title: string;
  description: string;
  reason: string;
  priority: WardrobeGapPriority;
  status: WardrobeGapStatus;
  suggestedColors: string[];
  suggestedStyles: string[];
  suggestedSeasons: string[];
  suggestedItemTypes: string[];
  relatedEventId?: string;
  lastAnalyzedAt?: string;
}

export interface WardrobeAnalyticsSummary {
  totalItems: number;
  categories: Record<string, number>;
  styles: Record<string, number>;
  colors: Record<string, number>;
  seasons: Record<string, number>;
  neglectedItemsCount: number;
  mostWornItems: Array<{
    garmentId: string;
    name: string;
    wearCount: number;
    lastWorn?: string;
  }>;
  unwornItems: Array<{
    garmentId: string;
    name: string;
    category: GarmentCategory;
    createdAt?: string;
  }>;
}

export interface ItemUsageSummary {
  garmentId: string;
  totalWears: number;
  occasions: Record<string, number>;
  firstWorn?: string;
  lastWorn?: string;
}

