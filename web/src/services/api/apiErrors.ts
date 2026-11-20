import type {
  ApiErrorCode,
  ApiErrorDetailInput,
  ApiFieldError,
  HttpMethod,
} from './api.types';

/**
 * Typed error raised by `apiClient` across HTTP, proxy, timeout, abort,
 * network, and malformed-response failures.
 *
 * Uses standard field declarations to comply with `erasableSyntaxOnly: true`.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode: number | undefined;
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;
  readonly isAborted: boolean;
  readonly fieldErrors: ApiFieldError[];
  readonly rawResponse: unknown;
  readonly method: HttpMethod | undefined;
  readonly url: string | undefined;

  constructor(details: ApiErrorDetailInput) {
    super(details.message, details.cause !== undefined ? { cause: details.cause } : undefined);
    this.name = 'ApiError';
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.isNetworkError = Boolean(details.isNetworkError);
    this.isTimeout = Boolean(details.isTimeout);
    this.isAborted = Boolean(details.isAborted);
    this.fieldErrors = details.fieldErrors ?? [];
    this.rawResponse = details.rawResponse;
    this.method = details.method;
    this.url = details.url;
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export interface ParsedHttpPayload {
  data: unknown;
  isJson: boolean;
  malformedJson: boolean;
  parseError?: unknown;
}

/**
 * Safely parses HTTP response payloads across JSON, 204 No Content,
 * empty responses, plain text, HTML proxy errors, and malformed JSON.
 */
export async function parseHttpResponsePayload(
  response: Response,
  responseType: 'json' | 'text' | 'blob' | 'void' = 'json'
): Promise<ParsedHttpPayload> {
  if (response.status === 204 || response.status === 205 || responseType === 'void') {
    return {
      data: undefined,
      isJson: false,
      malformedJson: false,
    };
  }

  if (responseType === 'blob') {
    const blob = await response.blob();
    return {
      data: blob,
      isJson: false,
      malformedJson: false,
    };
  }

  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  const text = await response.text().catch(() => '');

  if (!text.trim()) {
    return {
      data: responseType === 'text' ? '' : undefined,
      isJson: contentType.includes('application/json'),
      malformedJson: false,
    };
  }

  if (responseType === 'text' && response.ok) {
    return {
      data: text,
      isJson: false,
      malformedJson: false,
    };
  }

  const trimmed = text.trim();
  const looksLikeJson =
    contentType.includes('application/json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  if (!looksLikeJson) {
    return {
      data: text,
      isJson: false,
      malformedJson: false,
    };
  }

  try {
    return {
      data: JSON.parse(text) as unknown,
      isJson: true,
      malformedJson: false,
    };
  } catch (parseError: unknown) {
    return {
      data: text,
      isJson: false,
      malformedJson: true,
      parseError,
    };
  }
}

export function extractFieldErrors(raw: unknown): ApiFieldError[] {
  if (!isRecord(raw) || !Array.isArray(raw.errors)) {
    return [];
  }

  const normalized: ApiFieldError[] = [];
  for (const item of raw.errors) {
    if (typeof item === 'string' && item.trim()) {
      normalized.push({ message: item.trim() });
    } else if (isRecord(item) && typeof item.message === 'string' && item.message.trim()) {
      normalized.push({
        field: typeof item.field === 'string' && item.field.trim() ? item.field.trim() : undefined,
        message: item.message.trim(),
      });
    }
  }
  return normalized;
}

export function extractServerMessage(raw: unknown): string | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.message === 'string' && raw.message.trim()) {
    return raw.message.trim();
  }
  if (typeof raw.error === 'string' && raw.error.trim()) {
    return raw.error.trim();
  }
  return null;
}

export function mapStatusToErrorCode(statusCode: number): ApiErrorCode {
  if (statusCode === 400) return 'BAD_REQUEST';
  if (statusCode === 401) return 'UNAUTHORIZED';
  if (statusCode === 403) return 'FORBIDDEN';
  if (statusCode === 404) return 'NOT_FOUND';
  if (statusCode === 409) return 'CONFLICT';
  if (statusCode === 413) return 'PAYLOAD_TOO_LARGE';
  if (statusCode === 415) return 'UNSUPPORTED_MEDIA_TYPE';
  if (statusCode === 422) return 'VALIDATION_ERROR';
  if (statusCode === 429) return 'RATE_LIMITED';
  if (statusCode >= 500) return 'SERVER_ERROR';
  return 'API_ERROR';
}

export function defaultMessageForStatus(statusCode: number): string {
  if (statusCode === 400) return 'Request could not be processed. Please check your input.';
  if (statusCode === 401) return 'Authentication is required or your session has expired.';
  if (statusCode === 403) return 'You do not have permission to perform this action.';
  if (statusCode === 404) return 'The requested resource could not be found.';
  if (statusCode === 409) return 'This request conflicts with existing data.';
  if (statusCode === 413) return 'The uploaded payload exceeds the allowed size limit.';
  if (statusCode === 415) return 'Unsupported file or content format.';
  if (statusCode === 422) return 'Validation failed. Please review the highlighted fields.';
  if (statusCode === 429) return 'Too many requests. Please wait a moment and try again.';
  if (statusCode >= 500) return 'The server encountered an unexpected error. Please try again shortly.';
  return `Request failed with status ${statusCode}.`;
}

/**
 * Vite dev proxy returns HTTP 500/502/504 without JSON when the Express upstream
 * is offline or unreachable.
 */
export function isProxyOrGatewayFailure(statusCode: number, isJson: boolean): boolean {
  return statusCode >= 502 || (!isJson && statusCode >= 500);
}

export function createHttpApiError(params: {
  statusCode: number;
  parsed: ParsedHttpPayload;
  baseUrl: string;
  method: HttpMethod;
  url: string;
}): ApiError {
  const { statusCode, parsed, baseUrl, method, url } = params;

  if (isProxyOrGatewayFailure(statusCode, parsed.isJson)) {
    return new ApiError({
      message: `API server unreachable (${baseUrl}). Backend service may be offline or unavailable.`,
      code: 'NETWORK_ERROR',
      statusCode,
      isNetworkError: true,
      rawResponse: parsed.data,
      method,
      url,
    });
  }

  const serverMessage = extractServerMessage(parsed.data);
  const fieldErrors = extractFieldErrors(parsed.data);

  return new ApiError({
    message: serverMessage || defaultMessageForStatus(statusCode),
    code:
      fieldErrors.length > 0 && statusCode === 400
        ? 'VALIDATION_ERROR'
        : mapStatusToErrorCode(statusCode),
    statusCode,
    isNetworkError: false,
    fieldErrors,
    rawResponse: parsed.data,
    method,
    url,
  });
}

export function createNetworkApiError(params: {
  error: unknown;
  didTimeout: boolean;
  didCallerAbort: boolean;
  baseUrl: string;
  method: HttpMethod;
  url: string;
}): ApiError {
  const { error, didTimeout, didCallerAbort, baseUrl, method, url } = params;

  if (didCallerAbort) {
    return new ApiError({
      message: 'Request was cancelled.',
      code: 'ABORTED',
      isAborted: true,
      isNetworkError: false,
      method,
      url,
      cause: error,
    });
  }

  if (didTimeout) {
    return new ApiError({
      message: `API request timed out (${baseUrl}). Please verify connectivity and try again.`,
      code: 'TIMEOUT',
      isTimeout: true,
      isNetworkError: true,
      method,
      url,
      cause: error,
    });
  }

  const detail = error instanceof Error && error.message ? error.message : 'Network connection failure';
  return new ApiError({
    message: `Unable to reach API server (${baseUrl}): ${detail}`,
    code: 'NETWORK_ERROR',
    isNetworkError: true,
    method,
    url,
    cause: error,
  });
}

