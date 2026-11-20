/**
 * Core HTTP & API transport types for the centralized OTD API client.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type QueryParamPrimitive = string | number | boolean;
export type QueryParamValue =
  | QueryParamPrimitive
  | readonly QueryParamPrimitive[]
  | null
  | undefined;

export type QueryParams = Record<string, QueryParamValue>;

export type ResponseParseMode = 'json' | 'text' | 'blob' | 'void';

export type ApiErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'MALFORMED_RESPONSE'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYLOAD_TOO_LARGE'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR'
  | 'API_ERROR';

export interface ApiFieldError {
  field?: string;
  message: string;
}

export interface ApiRequestOptions {
  params?: QueryParams;
  headers?: HeadersInit;
  timeoutMs?: number;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
  responseType?: ResponseParseMode;
  /** Skip automatic `Authorization: Bearer <token>` injection for this request. */
  skipAuthHeader?: boolean;
  /** Disable automatic 401 single-flight refresh & single retry for this request. */
  skipAuthRefresh?: boolean;
}

export interface ApiClientResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Matches backend `ApiResponse` (`AI-FASHION-OTD/src/utils/ApiResponse.ts`)
 * for services that consume wrapped endpoints.
 */
export interface ApiResponseEnvelope<TData = unknown, TMeta = Record<string, unknown>> {
  success: boolean;
  message?: string;
  data?: TData;
  meta?: TMeta;
}

export interface ApiPaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedApiResponseEnvelope<TItem = unknown> {
  success: boolean;
  message?: string;
  data: TItem[];
  pagination: ApiPaginationMeta;
}

export interface ApiErrorDetailInput {
  message: string;
  code: ApiErrorCode;
  statusCode?: number;
  isNetworkError?: boolean;
  isTimeout?: boolean;
  isAborted?: boolean;
  fieldErrors?: ApiFieldError[];
  rawResponse?: unknown;
  method?: HttpMethod;
  url?: string;
  cause?: unknown;
}

export interface ApiClientConfig {
  baseUrl?: string;
  defaultTimeoutMs?: number;
  refreshTimeoutMs?: number;
  defaultCredentials?: RequestCredentials;
  getAccessToken?: () => string | null;
}

