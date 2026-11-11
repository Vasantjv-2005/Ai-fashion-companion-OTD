/**
 * Backend API DTO contracts for User Preferences & Aesthetic Vibes.
 * Mirrors AI-FASHION-OTD/src/models/UserPreference.ts, modules/preferences/*,
 * AI-FASHION-OTD/src/models/UserVibe.ts, and modules/vibes/*.
 */

import type { MongoRecordDto, ObjectIdString } from './common.dto';
import type { BackendProfileSeasonDto, BackendProfileStyleDto } from './profile.dto';
import type { BackendClothingCategoryDto } from './wardrobe.dto';

export type BackendPreferenceFitDto =
  | 'slim'
  | 'regular'
  | 'relaxed'
  | 'oversized'
  | 'no-preference';

export interface BackendRecommendationSettingsDto {
  useWeather: boolean;
  considerOccasion: boolean;
  avoidRecentOutfits: boolean;
}

/** Returned by GET /api/preferences, PUT /api/preferences, PATCH /api/preferences, POST /api/preferences/reset. */
export interface BackendUserPreferenceDto extends MongoRecordDto {
  userId: ObjectIdString;
  preferredStyles: BackendProfileStyleDto[];
  preferredColors: string[];
  preferredSeasons: BackendProfileSeasonDto[];
  preferredCategories: BackendClothingCategoryDto[];
  excludedColors: string[];
  budgetMin: number;
  budgetMax?: number;
  preferredFit: BackendPreferenceFitDto;
  recommendationSettings: BackendRecommendationSettingsDto;
}

/** Validated by `updatePreferencesSchema.strict()` in preferences.validator.ts. */
export interface UpdatePreferencesRequestDto {
  preferredStyles?: BackendProfileStyleDto[];
  preferredColors?: string[];
  preferredSeasons?: BackendProfileSeasonDto[];
  preferredCategories?: BackendClothingCategoryDto[];
  excludedColors?: string[];
  budgetMin?: number;
  budgetMax?: number;
  preferredFit?: BackendPreferenceFitDto;
  recommendationSettings?: Partial<BackendRecommendationSettingsDto>;
}

export type BackendUserVibeMoodDto =
  | 'casual'
  | 'confident'
  | 'elegant'
  | 'sporty'
  | 'minimalist'
  | 'streetwear'
  | 'romantic'
  | 'professional'
  | 'creative'
  | 'adventurous';

export type BackendUserVibeOccasionDto =
  | 'daily'
  | 'work'
  | 'college'
  | 'party'
  | 'date'
  | 'wedding'
  | 'travel'
  | 'fitness'
  | 'special_event';

/** Returned by GET /api/vibes, GET /api/vibes/active, POST /api/vibes. */
export interface BackendUserVibeDto extends MongoRecordDto {
  userId: ObjectIdString;
  mood: BackendUserVibeMoodDto;
  preferredStyles: string[];
  preferredColors: string[];
  preferredSeasons: string[];
  occasion?: BackendUserVibeOccasionDto;
  notes?: string;
  isActive: boolean;
}

export interface CreateUserVibeRequestDto {
  mood: BackendUserVibeMoodDto;
  preferredStyles?: string[];
  preferredColors?: string[];
  preferredSeasons?: string[];
  occasion?: BackendUserVibeOccasionDto;
  notes?: string;
}

/** Returned by GET /api/vibes/presets (public). */
export interface BackendPresetVibeDto {
  name: string;
  mood: BackendUserVibeMoodDto;
  description: string;
  recommendedStyles: string[];
  recommendedColors: string[];
}

