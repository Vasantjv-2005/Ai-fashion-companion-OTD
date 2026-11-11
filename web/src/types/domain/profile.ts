/**
 * Frontend domain models for User Style Profile, Biometrics, and Avatar configuration.
 * Preserves existing UI profile fields (`wardrobeFocus`, `stylePersonas`, `heightDisplay`, etc.)
 * while modeling backend-syncable Profile & Avatar attributes cleanly.
 */

import type {
  EntityOrigin,
  GarmentCategory,
  GarmentFit,
  GarmentSeason,
  GarmentStyleTag,
} from './common';

export type WardrobeFocus = 'menswear' | 'womenswear' | 'unisex';

export interface BiometricMeasurements {
  heightDisplay: string;
  heightCm?: number;
  weightDisplay: string;
  weightKg?: number;
  bodyType?: string;
}

export interface AvatarConfig {
  id?: string;
  origin: EntityOrigin;
  source: 'upload' | 'generated' | 'preset';
  presetId?: string;
  avatarFileId?: string;
  imageUrl?: string;
  displayName: string;
  archetype?: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface UserStyleProfile {
  id?: string;
  userId?: string;
  origin: EntityOrigin;
  displayName: string;
  email?: string;
  bio?: string;
  wardrobeFocus: WardrobeFocus;
  /** Display string shown in UI (`"5'11\" (180 cm)"`). */
  heightDisplay: string;
  /** Parsed or backend-supplied height in cm (`50..300`) sent on `PATCH /api/profile`. */
  heightCm?: number;
  /** Local UI display string (`"168 lbs"`). Not persisted by current backend `Profile`. */
  weightDisplay: string;
  /** Optional local biometric weight in kg; client-only until backend adds weight column. */
  weightKg?: number;
  /** Display label from UI controls (e.g. `'Regular Classic'`, `'Slim Fit'`). */
  preferredFit: string;
  normalizedFit: GarmentFit;
  bodyType?: string;
  /** Editorial style personas shown in UI cards & onboarding (`'Clean Minimalist'`, `'Old Money Heritage'`). */
  stylePersonas: string[];
  /** Backend-validated style tokens derived from or synced with `preferredStyles`. */
  normalizedStyles: GarmentStyleTag[];
  preferredColors: string[];
  preferredSeasons: GarmentSeason[];
  preferredCategories: GarmentCategory[];
  fashionGoals: string[];
  /** Preset avatar selection ID (`'silhouette-1'`). */
  avatarOption: string;
  avatarArchetype: string;
  avatarFileId?: string;
  referencePhotoUrl?: string;
  isProfileComplete: boolean;
  updatedAt?: string;
}

