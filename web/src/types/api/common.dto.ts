/**
 * Common API Data Transfer Object (DTO) contracts mirroring AI-FASHION-OTD Express responses.
 *
 * Wire quirks verified directly in AI-FASHION-OTD:
 * 1. Some modules (`wardrobe`, `events`) map `_id` -> `id`, while others (`profile`, `preferences`,
 *    `outfits`, `shopping`, `venues`, `vibes`, `avatar`, `ai`, `wardrobe-intelligence`) return raw
 *    Mongoose `.lean()` / `.toObject()` documents containing `_id`.
 * 2. List endpoints split between `pagination.totalItems` (`wardrobe`, `events`) and
 *    `pagination.total` (`outfits`, `shopping`, `venues`, `outfits/history`).
 */

export type ObjectIdString = string;

export type IsoDateString = string;

/** Base shape tolerating both explicitly serialized `id` and raw Mongoose `_id`. */
export interface MongoRecordDto {
  id?: ObjectIdString;
  _id?: ObjectIdString;
  createdAt?: IsoDateString;
  updatedAt?: IsoDateString;
}

export interface ApiValidationFieldErrorDto {
  field?: string;
  message: string;
}

export interface ApiErrorResponseDto {
  success: false;
  message: string;
  errors?: ApiValidationFieldErrorDto[] | Record<string, unknown>;
}

export interface ApiSuccessResponseDto<TData = unknown> {
  success: boolean;
  message?: string;
  data: TData;
}

export interface BackendPaginationMetaDto {
  page: number;
  limit: number;
  total?: number;
  totalItems?: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiPaginatedResponseDto<TItem = unknown> {
  success: boolean;
  message?: string;
  data: TItem[];
  pagination: BackendPaginationMetaDto;
}

export interface BackendDeleteResponseDto {
  success?: boolean;
  message: string;
  outfitId?: ObjectIdString;
}

