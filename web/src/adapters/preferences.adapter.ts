/**
 * Bidirectional Style Preferences & Vibes adapters.
 * Maps `BackendUserPreferenceDto` / `BackendUserVibeDto` <-> domain `StylePreferences` / `UserStyleVibe`.
 */

import type {
  BackendPresetVibeDto,
  BackendUserPreferenceDto,
  BackendUserVibeDto,
  CreateUserVibeRequestDto,
  UpdatePreferencesRequestDto,
} from '../types/api';
import type {
  MeasurementUnit,
  StudioNotificationSettings,
  StylePreferences,
  StyleVibePreset,
  UserStyleVibe,
} from '../types/domain';
import {
  extractRecordId,
  mapCategoryToBackend,
  mapFitToBackendPreference,
  mapStyleTagToBackend,
  normalizeCategoryToDomain,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  toIsoString,
} from './shared.adapter';

export function mapPreferenceDtoToDomain(
  dto: BackendUserPreferenceDto,
  localSettings?: {
    measurementUnit?: MeasurementUnit;
    notificationSettings?: Partial<StudioNotificationSettings>;
  },
): StylePreferences {
  return {
    id: extractRecordId(dto) || undefined,
    userId: dto.userId,
    origin: 'api',
    preferredStyles: (dto.preferredStyles ?? []).map((s) => normalizeStyleTag(s)),
    preferredColors: normalizeStringArray(dto.preferredColors),
    preferredSeasons: normalizeSeasonList(dto.preferredSeasons),
    preferredCategories: (dto.preferredCategories ?? []).map((c) =>
      normalizeCategoryToDomain(c),
    ),
    excludedColors: normalizeStringArray(dto.excludedColors),
    budgetMin: typeof dto.budgetMin === 'number' ? dto.budgetMin : 0,
    budgetMax: typeof dto.budgetMax === 'number' ? dto.budgetMax : undefined,
    preferredFit: dto.preferredFit ?? 'no-preference',
    recommendationSettings: {
      useWeather: dto.recommendationSettings?.useWeather ?? true,
      considerOccasion: dto.recommendationSettings?.considerOccasion ?? true,
      avoidRecentOutfits: dto.recommendationSettings?.avoidRecentOutfits ?? true,
    },
    measurementUnit: localSettings?.measurementUnit ?? 'metric',
    notificationSettings: {
      notifyWeather: localSettings?.notificationSettings?.notifyWeather ?? true,
      notifyOccasions: localSettings?.notificationSettings?.notifyOccasions ?? true,
      notifySuggestions: localSettings?.notificationSettings?.notifySuggestions ?? true,
    },
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : undefined,
  };
}

/**
 * Serializes `StylePreferences` -> `UpdatePreferencesRequestDto`.
 * Strictly omits local UI settings (`measurementUnit`, `notificationSettings`)
 * to satisfy `updatePreferencesSchema.strict()` and guards `budgetMin <= budgetMax`.
 */
export function mapPreferencesDomainToUpdateDto(
  prefs: Partial<StylePreferences>,
): UpdatePreferencesRequestDto {
  const payload: UpdatePreferencesRequestDto = {};

  if (prefs.preferredStyles && prefs.preferredStyles.length > 0) {
    payload.preferredStyles = prefs.preferredStyles
      .map((style) => mapStyleTagToBackend(style))
      .slice(0, 20);
  }
  if (prefs.preferredColors) {
    payload.preferredColors = normalizeStringArray(prefs.preferredColors).slice(0, 30);
  }
  if (prefs.preferredSeasons && prefs.preferredSeasons.length > 0) {
    payload.preferredSeasons = normalizeSeasonList(prefs.preferredSeasons);
  }
  if (prefs.preferredCategories) {
    payload.preferredCategories = prefs.preferredCategories
      .map((cat) => mapCategoryToBackend(cat))
      .slice(0, 30);
  }
  if (prefs.excludedColors) {
    payload.excludedColors = normalizeStringArray(prefs.excludedColors).slice(0, 30);
  }

  if (typeof prefs.budgetMin === 'number' && prefs.budgetMin >= 0) {
    payload.budgetMin = prefs.budgetMin;
  }
  if (typeof prefs.budgetMax === 'number' && prefs.budgetMax >= 0) {
    payload.budgetMax =
      payload.budgetMin !== undefined && prefs.budgetMax < payload.budgetMin
        ? payload.budgetMin
        : prefs.budgetMax;
  }

  if (prefs.preferredFit !== undefined) {
    payload.preferredFit = mapFitToBackendPreference(prefs.preferredFit);
  }

  if (prefs.recommendationSettings) {
    payload.recommendationSettings = {
      useWeather: prefs.recommendationSettings.useWeather,
      considerOccasion: prefs.recommendationSettings.considerOccasion,
      avoidRecentOutfits: prefs.recommendationSettings.avoidRecentOutfits,
    };
  }

  return payload;
}

export function mapUserVibeDtoToDomain(dto: BackendUserVibeDto): UserStyleVibe {
  return {
    id: extractRecordId(dto),
    origin: 'api',
    mood: dto.mood,
    preferredStyles: normalizeStringArray(dto.preferredStyles),
    preferredColors: normalizeStringArray(dto.preferredColors),
    preferredSeasons: normalizeSeasonList(dto.preferredSeasons),
    occasion: dto.occasion,
    notes: dto.notes,
    isActive: Boolean(dto.isActive),
    createdAt: dto.createdAt ? toIsoString(dto.createdAt) : undefined,
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : undefined,
  };
}

export function mapUserVibeToCreateDto(
  vibe: Pick<UserStyleVibe, 'mood'> & Partial<UserStyleVibe>,
): CreateUserVibeRequestDto {
  const payload: CreateUserVibeRequestDto = {
    mood: vibe.mood,
  };

  if (vibe.preferredStyles && vibe.preferredStyles.length > 0) {
    payload.preferredStyles = normalizeStringArray(vibe.preferredStyles);
  }
  if (vibe.preferredColors && vibe.preferredColors.length > 0) {
    payload.preferredColors = normalizeStringArray(vibe.preferredColors);
  }
  if (vibe.preferredSeasons && vibe.preferredSeasons.length > 0) {
    payload.preferredSeasons = normalizeSeasonList(vibe.preferredSeasons);
  }
  if (vibe.occasion) {
    payload.occasion = vibe.occasion;
  }
  if (vibe.notes?.trim()) {
    payload.notes = vibe.notes.trim().slice(0, 1000);
  }

  return payload;
}

export function mapPresetVibeDtoToDomain(dto: BackendPresetVibeDto): StyleVibePreset {
  return {
    name: dto.name,
    mood: dto.mood,
    description: dto.description,
    recommendedStyles: normalizeStringArray(dto.recommendedStyles),
    recommendedColors: normalizeStringArray(dto.recommendedColors),
  };
}

