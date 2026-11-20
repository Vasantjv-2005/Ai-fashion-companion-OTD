/**
 * Backend API DTO contracts for User Profile & Avatar.
 * Mirrors AI-FASHION-OTD/src/models/Profile.ts, modules/profile/*,
 * AI-FASHION-OTD/src/models/Avatar.ts, and modules/avatar/*.
 */

import type { IsoDateString, MongoRecordDto, ObjectIdString } from './common.dto';

export type BackendProfileStyleDto =
  | 'casual'
  | 'formal'
  | 'smart-casual'
  | 'streetwear'
  | 'sporty'
  | 'traditional'
  | 'party'
  | 'minimalist'
  | 'other';

export type BackendProfileSeasonDto =
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'winter'
  | 'all-season';

/**
 * Raw document returned by GET /api/profile, PUT /api/profile, PATCH /api/profile.
 * Note: `profile.service.ts` returns raw `.lean()` / `.toObject()` documents with `_id`.
 */
export interface BackendProfileDto extends MongoRecordDto {
  userId: ObjectIdString;
  displayName?: string;
  bio?: string;
  avatarFileId?: ObjectIdString;
  preferredStyles: BackendProfileStyleDto[];
  preferredColors: string[];
  preferredSeasons: BackendProfileSeasonDto[];
  preferredCategories: string[];
  bodyType?: string;
  heightCm?: number;
  fashionGoals: string[];
  isProfileComplete: boolean;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
}

/**
 * Validated by `updateProfileSchema.strict()` in AI-FASHION-OTD/src/modules/profile/profile.validator.ts.
 * Unsupported frontend fields (`wardrobeFocus`, `weight`, `height`, `stylePersonas`,
 * `avatarOption`, `referencePhotoUrl`) MUST be stripped or transformed before sending.
 */
export interface UpdateProfileRequestDto {
  displayName?: string;
  bio?: string;
  avatarFileId?: ObjectIdString;
  preferredStyles?: BackendProfileStyleDto[];
  preferredColors?: string[];
  preferredSeasons?: BackendProfileSeasonDto[];
  preferredCategories?: string[];
  bodyType?: string;
  heightCm?: number;
  fashionGoals?: string[];
}

export type BackendAvatarSourceDto = 'upload' | 'generated' | 'preset';

/** Raw document returned by GET/POST/PUT /api/avatar and POST /api/avatar/upload. */
export interface BackendAvatarDto extends MongoRecordDto {
  userId: ObjectIdString;
  imageFileId?: ObjectIdString;
  imageUrl?: string;
  source: BackendAvatarSourceDto;
  displayName: string;
  metadata?: Record<string, unknown>;
  isActive: boolean;
}

export interface CreateOrUpdateAvatarRequestDto {
  displayName?: string;
  source?: BackendAvatarSourceDto;
  imageUrl?: string;
  imageFileId?: ObjectIdString;
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

