/**
 * Frontend domain models for Outfit Synthesis, Backend Outfit Records,
 * AI Stylist Chat/Pipeline, Wear History, and Ratings.
 */

import type {
  EntityOrigin,
  GarmentCategory,
  GarmentSeason,
  GarmentStyleTag,
  OutfitSlotName,
} from './common';

export type OutfitSlotStatus = 'owned' | 'missing' | 'unverified';

export interface OutfitSlotPiece {
  slot: OutfitSlotName;
  slotLabel: string;
  garmentId?: string;
  backendGarmentId?: string;
  name: string;
  color: string;
  colorHex: string;
  status: OutfitSlotStatus;
  category: GarmentCategory;
  subType?: string;
  brand?: string;
  fit?: string;
  formality?: number;
  isOptional?: boolean;
  estimatedPrice?: string;
  reason: string;
  icon: string;
  imageUrl?: string;
}

export interface OutfitRationaleBreakdown {
  rationalePoints: string[];
  colorHarmony: string;
  styleAlignment: string;
  dressCodeNote: string;
  weatherNote: string;
}

export interface SynthesizedOutfitEnsemble {
  id?: string;
  backendOutfitId?: string;
  origin: EntityOrigin;
  title: string;
  occasion: string;
  weatherSummary: string;
  venueSummary: string;
  slots: OutfitSlotPiece[];
  garmentIds: string[];
  ownedCount: number;
  totalCount: number;
  rationale: string[];
  colorHarmony: string;
  styleAlignment: string;
  dressCodeNote: string;
  weatherNote: string;
  score?: number;
}

export type OutfitLifecycleStatus = 'generated' | 'saved' | 'worn';

export interface OutfitRecord {
  id: string;
  origin: EntityOrigin;
  userId?: string;
  name: string;
  description: string;
  /** Unified garment reference IDs resolving backend `wardrobeItemIds` & `clothingItemIds`. */
  garmentIds: string[];
  occasion: string;
  style: GarmentStyleTag | string;
  season: GarmentSeason;
  isFavorite: boolean;
  status: OutfitLifecycleStatus;
  colorPalette: string[];
  aiGenerated: boolean;
  rating?: number;
  notes: string;
  wornAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OutfitGenerationCriteria {
  occasion: string;
  style?: GarmentStyleTag | string;
  season?: GarmentSeason;
  venueName?: string;
  venueCategory?: string;
  locationLabel?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  weatherCondition?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  moods: string[];
  preferences: string[];
  preferredColor?: string;
  mustIncludeNames: string[];
  avoidNames: string[];
  excludedGarmentIds: string[];
  slotOverrides?: Partial<Record<OutfitSlotName, string>>;
  includeAccessories?: boolean;
  variationSeed?: number;
}

export interface OutfitGenerationCandidate {
  garmentIds: string[];
  explanation: string;
  score?: number;
}

export interface OutfitGenerationSummary {
  candidates: OutfitGenerationCandidate[];
  total: number;
  processingTimeMs: number;
  weatherContext?: {
    temperatureC?: number;
    condition?: string;
    description?: string;
  };
  pipelineSteps?: {
    totalWardrobeItems: number;
    candidatesEvaluated: number;
    validatedOutfits: number;
    processingTimeMs: number;
  };
}

export interface OutfitWearLog {
  id: string;
  origin: EntityOrigin;
  outfitId?: string;
  outfitName: string;
  garmentIds: string[];
  occasion: string;
  wornAt: string;
  notes: string;
  rating?: number;
  feedback: string;
  createdAt?: string;
}

export interface OutfitRatingSummary {
  id: string;
  outfitId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  feedback: string;
  occasion: string;
  wouldWearAgain?: boolean;
  createdAt?: string;
}

export type StylistChatRole = 'user' | 'assistant' | 'system';

export interface StylistChatMessage {
  id: string;
  conversationId?: string;
  origin: EntityOrigin;
  role: StylistChatRole;
  content: string;
  aiProvider?: string;
  modelName?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface StylistConversationThread {
  id: string;
  origin: EntityOrigin;
  title: string;
  status: 'active' | 'archived';
  lastMessageAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface StylistAdviceResult {
  reply: string;
  conversationId: string;
  candidates: OutfitGenerationCandidate[];
  detectedPreferences?: {
    styles: string[];
    colors: string[];
  };
}

