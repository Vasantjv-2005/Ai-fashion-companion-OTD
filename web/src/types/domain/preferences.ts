/**
 * Frontend domain models for Style Preferences, Recommendation Rules, and Aesthetic Vibes.
 */

import type {
  EntityOrigin,
  GarmentCategory,
  GarmentFit,
  GarmentSeason,
  GarmentStyleTag,
  MeasurementUnit,
} from './common';

export type StyleVibeMood =
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

export type StyleVibeOccasion =
  | 'daily'
  | 'work'
  | 'college'
  | 'party'
  | 'date'
  | 'wedding'
  | 'travel'
  | 'fitness'
  | 'special_event';

export interface RecommendationRuleSettings {
  useWeather: boolean;
  considerOccasion: boolean;
  avoidRecentOutfits: boolean;
}

export interface StudioNotificationSettings {
  notifyWeather: boolean;
  notifyOccasions: boolean;
  notifySuggestions: boolean;
}

export interface StylePreferences {
  id?: string;
  userId?: string;
  origin: EntityOrigin;
  preferredStyles: GarmentStyleTag[];
  preferredColors: string[];
  preferredSeasons: GarmentSeason[];
  preferredCategories: GarmentCategory[];
  excludedColors: string[];
  budgetMin: number;
  budgetMax?: number;
  preferredFit: GarmentFit;
  recommendationSettings: RecommendationRuleSettings;
  measurementUnit: MeasurementUnit;
  notificationSettings: StudioNotificationSettings;
  updatedAt?: string;
}

export interface UserStyleVibe {
  id: string;
  origin: EntityOrigin;
  mood: StyleVibeMood;
  preferredStyles: string[];
  preferredColors: string[];
  preferredSeasons: GarmentSeason[];
  occasion?: StyleVibeOccasion;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface StyleVibePreset {
  name: string;
  mood: StyleVibeMood;
  description: string;
  recommendedStyles: string[];
  recommendedColors: string[];
}

