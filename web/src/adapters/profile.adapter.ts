/**
 * Bidirectional Profile & Avatar adapters decoupling frontend UI models (`UserStyleProfile`, `AvatarConfig`)
 * from backend Profile & Avatar DTOs (`BackendProfileDto`, `UpdateProfileRequestDto`, `BackendAvatarDto`).
 */

import type {
  BackendAvatarDto,
  BackendProfileDto,
  BackendProfileStyleDto,
  CreateOrUpdateAvatarRequestDto,
  UpdateProfileRequestDto,
} from '../types/api';
import type {
  AvatarConfig,
  MeasurementUnit,
  UserStyleProfile,
  WardrobeFocus,
} from '../types/domain';
import {
  extractRecordId,
  normalizeCategoryToDomain,
  normalizeFitToDomain,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  toIsoString,
} from './shared.adapter';

const PERSONA_TO_BACKEND_STYLE: Readonly<Record<string, BackendProfileStyleDto>> = {
  'old money heritage': 'smart-casual',
  'clean minimalist': 'minimalist',
  'smart sartorial': 'formal',
  'relaxed contemporary': 'casual',
  'streetwear chic': 'streetwear',
  'quiet luxury': 'minimalist',
  'evening haute': 'party',
  'capsule modular': 'smart-casual',
};

const BACKEND_STYLE_TO_PERSONA: Readonly<Record<BackendProfileStyleDto, string>> = {
  casual: 'Relaxed Contemporary',
  formal: 'Smart Sartorial',
  'smart-casual': 'Old Money Heritage',
  streetwear: 'Streetwear Chic',
  sporty: 'Athletic Tailored',
  traditional: 'Heritage Classic',
  party: 'Evening Haute',
  minimalist: 'Clean Minimalist',
  other: 'Personal Bespoke',
};

/**
 * Extracts numeric height in centimeters (`50..300`) from flexible UI strings
 * such as `"5'11\" (180 cm)"`, `"180 cm"`, `"5'10\""`, or `"5 ft 11 in"`.
 */
export function parseHeightToCm(heightInput?: string): number | undefined {
  if (!heightInput || !heightInput.trim()) return undefined;
  const trimmed = heightInput.trim();

  // 1. Explicit cm match (e.g., "5'11\" (180 cm)" or "178cm")
  const cmMatch = trimmed.match(/(\d{2,3}(?:\.\d+)?)\s*cm/i);
  if (cmMatch?.[1]) {
    const cm = Math.round(Number(cmMatch[1]));
    if (cm >= 50 && cm <= 300) return cm;
  }

  // 2. Imperial feet + inches match (e.g., `5'11"`, `5'10`, `5 ft 11 in`)
  const imperialMatch = trimmed.match(/(\d)\s*(?:'|ft)\s*(\d{1,2})?/i);
  if (imperialMatch?.[1]) {
    const feet = Number(imperialMatch[1]);
    const inches = imperialMatch[2] ? Number(imperialMatch[2]) : 0;
    if (feet >= 3 && feet <= 8 && inches >= 0 && inches < 12) {
      const cm = Math.round((feet * 12 + inches) * 2.54);
      if (cm >= 50 && cm <= 300) return cm;
    }
  }

  // 3. Bare numeric string assumed to be cm if within backend range
  if (/^\d{2,3}(\.\d+)?$/.test(trimmed)) {
    const cm = Math.round(Number(trimmed));
    if (cm >= 50 && cm <= 300) return cm;
  }

  return undefined;
}

export function formatCmToHeightDisplay(
  heightCm?: number,
  unit: MeasurementUnit = 'imperial',
): string {
  if (typeof heightCm !== 'number' || !Number.isFinite(heightCm) || heightCm < 50 || heightCm > 300) {
    return "5'11\" (180 cm)";
  }

  const roundedCm = Math.round(heightCm);
  if (unit === 'metric') {
    return `${roundedCm} cm`;
  }

  const totalInches = Math.round(roundedCm / 2.54);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'${inches}" (${roundedCm} cm)`;
}

export function mapStylePersonasToBackendStyles(
  personas: readonly string[],
): BackendProfileStyleDto[] {
  const mapped: BackendProfileStyleDto[] = [];
  const seen = new Set<BackendProfileStyleDto>();

  for (const persona of personas) {
    const key = persona.trim().toLowerCase();
    const token = PERSONA_TO_BACKEND_STYLE[key] ?? normalizeStyleTag(key);
    if (!seen.has(token)) {
      seen.add(token);
      mapped.push(token);
    }
  }

  return mapped;
}

export function mapBackendStylesToPersonas(
  styles: readonly BackendProfileStyleDto[],
): string[] {
  return styles.map((style) => BACKEND_STYLE_TO_PERSONA[style] ?? style);
}

/**
 * Maps backend `BackendProfileDto` -> `UserStyleProfile`, preserving existing local-only atelier fields
 * when merging against a guest/local profile snapshot.
 */
export function mapProfileDtoToDomain(
  dto: BackendProfileDto,
  localFallback?: Partial<UserStyleProfile>,
  measurementUnit: MeasurementUnit = 'imperial',
): UserStyleProfile {
  const preferredStyles = Array.isArray(dto.preferredStyles) ? dto.preferredStyles : [];
  const derivedPersonas =
    localFallback?.stylePersonas && localFallback.stylePersonas.length > 0 && preferredStyles.length === 0
      ? localFallback.stylePersonas
      : preferredStyles.length > 0
        ? mapBackendStylesToPersonas(preferredStyles)
        : ['Old Money Heritage', 'Clean Minimalist'];

  const heightCm = typeof dto.heightCm === 'number' ? dto.heightCm : localFallback?.heightCm;
  const preferredFit = localFallback?.preferredFit || 'Regular Classic';

  return {
    id: extractRecordId(dto) || localFallback?.id,
    userId: dto.userId || localFallback?.userId,
    origin: 'api',
    displayName: dto.displayName?.trim() || localFallback?.displayName || 'Style Enthusiast',
    email: localFallback?.email,
    bio: dto.bio ?? localFallback?.bio,
    wardrobeFocus: localFallback?.wardrobeFocus ?? 'menswear',
    heightCm,
    heightDisplay:
      heightCm !== undefined
        ? formatCmToHeightDisplay(heightCm, measurementUnit)
        : localFallback?.heightDisplay || "5'11\" (180 cm)",
    weightDisplay: localFallback?.weightDisplay || '168 lbs',
    weightKg: localFallback?.weightKg,
    preferredFit,
    normalizedFit: normalizeFitToDomain(preferredFit),
    bodyType: dto.bodyType ?? localFallback?.bodyType,
    stylePersonas: derivedPersonas,
    normalizedStyles:
      preferredStyles.length > 0
        ? preferredStyles
        : mapStylePersonasToBackendStyles(derivedPersonas),
    preferredColors: normalizeStringArray(dto.preferredColors),
    preferredSeasons: normalizeSeasonList(dto.preferredSeasons),
    preferredCategories: (dto.preferredCategories ?? []).map((cat) =>
      normalizeCategoryToDomain(cat),
    ),
    fashionGoals: normalizeStringArray(dto.fashionGoals),
    avatarOption: localFallback?.avatarOption || 'silhouette-1',
    avatarArchetype: localFallback?.avatarArchetype || 'Classic',
    avatarFileId: dto.avatarFileId ?? localFallback?.avatarFileId,
    referencePhotoUrl: localFallback?.referencePhotoUrl,
    isProfileComplete: Boolean(dto.isProfileComplete),
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : localFallback?.updatedAt,
  };
}

/**
 * Serializes `UserStyleProfile` -> `UpdateProfileRequestDto`.
 * Strictly enforces `updateProfileSchema.strict()` allowlist by stripping local-only fields
 * (`wardrobeFocus`, `weightDisplay`, `avatarOption`, `avatarArchetype`, `referencePhotoUrl`, `preferredFit`).
 */
export function mapProfileDomainToUpdateDto(
  profile: Partial<UserStyleProfile> & {
    /** Accepts legacy UI `height` & `weight` fields safely during gradual migration. */
    height?: string;
    name?: string;
  },
): UpdateProfileRequestDto {
  const payload: UpdateProfileRequestDto = {};

  const displayName = (profile.displayName ?? profile.name)?.trim();
  if (displayName && displayName.length >= 2) {
    payload.displayName = displayName.slice(0, 100);
  }

  if (typeof profile.bio === 'string' && profile.bio.trim()) {
    payload.bio = profile.bio.trim().slice(0, 500);
  }

  if (profile.avatarFileId && /^[0-9a-fA-F]{24}$/.test(profile.avatarFileId)) {
    payload.avatarFileId = profile.avatarFileId;
  }

  const derivedStyles =
    profile.normalizedStyles && profile.normalizedStyles.length > 0
      ? profile.normalizedStyles
      : profile.stylePersonas && profile.stylePersonas.length > 0
        ? mapStylePersonasToBackendStyles(profile.stylePersonas)
        : undefined;
  if (derivedStyles && derivedStyles.length > 0) {
    payload.preferredStyles = derivedStyles.slice(0, 20);
  }

  if (profile.preferredColors && profile.preferredColors.length > 0) {
    payload.preferredColors = normalizeStringArray(profile.preferredColors).slice(0, 30);
  }

  if (profile.preferredSeasons && profile.preferredSeasons.length > 0) {
    payload.preferredSeasons = normalizeSeasonList(profile.preferredSeasons);
  }

  if (profile.preferredCategories && profile.preferredCategories.length > 0) {
    payload.preferredCategories = profile.preferredCategories.map((c) => c).slice(0, 30);
  }

  if (typeof profile.bodyType === 'string' && profile.bodyType.trim()) {
    payload.bodyType = profile.bodyType.trim().slice(0, 50);
  }

  const resolvedHeightCm =
    typeof profile.heightCm === 'number' && profile.heightCm >= 50 && profile.heightCm <= 300
      ? Math.round(profile.heightCm)
      : parseHeightToCm(profile.heightDisplay ?? profile.height);
  if (resolvedHeightCm !== undefined) {
    payload.heightCm = resolvedHeightCm;
  }

  if (profile.fashionGoals && profile.fashionGoals.length > 0) {
    payload.fashionGoals = normalizeStringArray(profile.fashionGoals).slice(0, 20);
  }

  return payload;
}

export function mapAvatarDtoToConfig(
  dto: BackendAvatarDto,
  fallbackArchetype?: string,
): AvatarConfig {
  const presetMeta =
    dto.metadata && typeof dto.metadata.presetId === 'string'
      ? dto.metadata.presetId
      : undefined;
  const archetypeMeta =
    dto.metadata && typeof dto.metadata.archetype === 'string'
      ? dto.metadata.archetype
      : fallbackArchetype;

  return {
    id: extractRecordId(dto) || undefined,
    origin: 'api',
    source: dto.source,
    presetId: presetMeta,
    avatarFileId: dto.imageFileId,
    imageUrl: dto.imageUrl,
    displayName: dto.displayName || '',
    archetype: archetypeMeta,
    isActive: dto.isActive,
    updatedAt: dto.updatedAt ? toIsoString(dto.updatedAt) : undefined,
  };
}

export function mapAvatarConfigToRequestDto(
  config: Partial<AvatarConfig>,
): CreateOrUpdateAvatarRequestDto {
  const metadata: Record<string, unknown> = {};
  if (config.presetId) metadata.presetId = config.presetId;
  if (config.archetype) metadata.archetype = config.archetype;

  const dto: CreateOrUpdateAvatarRequestDto = {
    source: config.source ?? 'preset',
    displayName: config.displayName?.trim() || '',
    isActive: config.isActive ?? true,
  };

  if (config.imageUrl && /^https?:\/\//i.test(config.imageUrl)) {
    dto.imageUrl = config.imageUrl;
  }
  if (config.avatarFileId && /^[0-9a-fA-F]{24}$/.test(config.avatarFileId)) {
    dto.imageFileId = config.avatarFileId;
  }
  if (Object.keys(metadata).length > 0) {
    dto.metadata = metadata;
  }

  return dto;
}

/** Helper to bridge existing legacy `UserProfile` objects from `ClosetContext` into `UserStyleProfile`. */
export function mapLegacyProfileToDomain(legacy: {
  name: string;
  email: string;
  wardrobeFocus: WardrobeFocus;
  height: string;
  weight: string;
  preferredFit: string;
  stylePersonas: string[];
  avatarOption: string;
  avatarArchetype?: string;
  referencePhotoUrl?: string;
}): UserStyleProfile {
  return {
    origin: 'local',
    displayName: legacy.name,
    email: legacy.email,
    wardrobeFocus: legacy.wardrobeFocus,
    heightDisplay: legacy.height,
    heightCm: parseHeightToCm(legacy.height),
    weightDisplay: legacy.weight,
    preferredFit: legacy.preferredFit,
    normalizedFit: normalizeFitToDomain(legacy.preferredFit),
    stylePersonas: [...legacy.stylePersonas],
    normalizedStyles: mapStylePersonasToBackendStyles(legacy.stylePersonas),
    preferredColors: [],
    preferredSeasons: ['all-season'],
    preferredCategories: [],
    fashionGoals: [],
    avatarOption: legacy.avatarOption,
    avatarArchetype: legacy.avatarArchetype || 'Classic',
    referencePhotoUrl: legacy.referencePhotoUrl,
    isProfileComplete: Boolean(legacy.name.trim() && legacy.stylePersonas.length > 0),
  };
}
