/**
 * Guarded Saved Looks & Outfit API service built on the centralized `apiClient`
 * and WS7 adapters.
 *
 * Security & correctness invariants:
 * - Strictly checks `resolveSavedLookIdentifier(look).isPersistedOnBackend` before
 *   issuing `/:id` requests so local demo slugs (`smart-casual-1`, `local-look-*`,
 *   `sug-*`) NEVER reach `/api/outfits/:id`.
 * - Strictly gates `POST/PATCH /api/outfits` on verified MongoDB 24-hex ObjectId
 *   `clothingItemIds` via `mapSavedLookToCreateOutfitDto`.
 * - Backend `POST/PATCH /api/outfits` write sync remains disabled in UI until backend
 *   reconciles `outfits.validator.ts` (`clothingItemIds`) with `models/Outfit.ts`
 *   (`wardrobeItemIds` / `isFavorite`) and WS4 persists wardrobe Mongo ObjectIds.
 */

import {
  mapBackendOutfitToSavedLook,
  mapSavedLookToCreateOutfitDto,
  normalizePaginationMeta,
  resolveSavedLookIdentifier,
} from '../adapters';
import type {
  ApiPaginatedResponseDto,
  ApiSuccessResponseDto,
  BackendDeleteResponseDto,
  BackendOutfitDto,
  CreateOutfitRequestDto,
  OutfitListQueryDto,
} from '../types/api';
import type { ClosetGarment, PaginationSummary, SavedLook } from '../types/domain';
import { apiClient } from './api';
import type { ApiRequestOptions } from './api';

export interface FetchOutfitsSavedLooksResult {
  looks: SavedLook[];
  pagination: PaginationSummary;
}

export interface GuardedDeleteOutfitResult {
  deletedRemotely: boolean;
  skippedReason?: 'local-only';
  outfitId?: string;
}

export async function fetchOutfitsAsSavedLooks(
  query?: OutfitListQueryDto,
  garmentsById?: ReadonlyMap<string, ClosetGarment>,
  options?: ApiRequestOptions,
): Promise<FetchOutfitsSavedLooksResult> {
  const response = await apiClient.get<ApiPaginatedResponseDto<BackendOutfitDto>>('/outfits', {
    ...options,
    params: query
      ? {
          page: query.page,
          limit: query.limit,
          occasion: query.occasion,
          status: query.status,
        }
      : undefined,
  });

  const dtos = Array.isArray(response?.data) ? response.data : [];
  return {
    looks: dtos.map((dto) => mapBackendOutfitToSavedLook(dto, garmentsById)),
    pagination: normalizePaginationMeta(response?.pagination),
  };
}

/**
 * Deletes a persisted backend outfit ONLY when `resolveSavedLookIdentifier(look)`
 * confirms a real 24-hex MongoDB `backendOutfitId`. Local demo looks never trigger
 * an HTTP call.
 */
export async function deleteBackendOutfitForLook(
  look: Pick<SavedLook, 'id' | 'backendOutfitId' | 'sourceTemplateId'>,
  options?: ApiRequestOptions,
): Promise<GuardedDeleteOutfitResult> {
  const identity = resolveSavedLookIdentifier(look);
  if (!identity.isPersistedOnBackend || !identity.backendOutfitId) {
    return {
      deletedRemotely: false,
      skippedReason: 'local-only',
    };
  }

  const response = await apiClient.delete<BackendDeleteResponseDto>(
    `/outfits/${identity.backendOutfitId}`,
    options,
  );

  return {
    deletedRemotely: true,
    outfitId: response?.outfitId ?? identity.backendOutfitId,
  };
}

/**
 * Prepares a verified `CreateOutfitRequestDto` if and only if the look contains
 * valid 24-hex MongoDB garment ObjectIds (`clothingItemIds`).
 */
export function prepareCreateOutfitPayload(look: SavedLook): {
  dto: CreateOutfitRequestDto | null;
  skippedLocalIds: string[];
} {
  return mapSavedLookToCreateOutfitDto(look);
}

export async function fetchBackendOutfitByIdAsSavedLook(
  look: Pick<SavedLook, 'id' | 'backendOutfitId' | 'sourceTemplateId'>,
  garmentsById?: ReadonlyMap<string, ClosetGarment>,
  options?: ApiRequestOptions,
): Promise<SavedLook | null> {
  const identity = resolveSavedLookIdentifier(look);
  if (!identity.isPersistedOnBackend || !identity.backendOutfitId) {
    return null;
  }

  const response = await apiClient.get<ApiSuccessResponseDto<BackendOutfitDto>>(
    `/outfits/${identity.backendOutfitId}`,
    options,
  );

  if (!response?.data) {
    return null;
  }

  return mapBackendOutfitToSavedLook(response.data, garmentsById);
}

