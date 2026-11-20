import { normalizeAuthSuccessPayload } from '../../adapters/auth.adapter';
import type { AuthResult, AuthSession } from '../../types/domain/auth';
import {
  getAccessToken,
  getSessionEpoch,
  notifySessionInvalidated,
  runSingleFlightRefresh,
} from '../authSession';
import type {
  ApiClientConfig,
  ApiClientResponse,
  ApiRequestOptions,
  HttpMethod,
  QueryParams,
} from './api.types';
import {
  ApiError,
  createHttpApiError,
  createNetworkApiError,
  isApiError,
  isRecord,
  parseHttpResponsePayload,
} from './apiErrors';

export const DEFAULT_API_BASE_URL = '/api';
const DEFAULT_REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_REFRESH_TIMEOUT_MS = 10_000;

export function normalizeApiBaseUrl(rawUrl?: string): string {
  const candidate = (rawUrl || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  return candidate || DEFAULT_API_BASE_URL;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_BASE_URL
);

function buildUrlWithParams(
  baseUrl: string,
  path: string,
  params?: QueryParams
): string {
  const isAbsoluteTarget = /^https?:\/\//i.test(path);
  let resolvedUrl: string;

  if (isAbsoluteTarget) {
    resolvedUrl = path;
  } else {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    resolvedUrl = `${baseUrl}${cleanPath}`;
  }

  if (!params) {
    return resolvedUrl;
  }

  const searchParams = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }

    if (Array.isArray(rawValue)) {
      for (const entry of rawValue) {
        if (entry !== undefined && entry !== null) {
          searchParams.append(key, String(entry));
        }
      }
    } else {
      searchParams.append(key, String(rawValue));
    }
  }

  const queryString = searchParams.toString();
  if (!queryString) {
    return resolvedUrl;
  }

  return `${resolvedUrl}${resolvedUrl.includes('?') ? '&' : '?'}${queryString}`;
}

function isSameApiOrigin(url: string, baseUrl: string): boolean {
  if (!/^https?:\/\//i.test(url)) {
    return true;
  }

  try {
    const targetOrigin = new URL(url).origin;
    if (/^https?:\/\//i.test(baseUrl)) {
      return targetOrigin === new URL(baseUrl).origin;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
      return targetOrigin === window.location.origin;
    }
    return false;
  } catch {
    return false;
  }
}

function serializeRequestBody(
  method: HttpMethod,
  rawBody: unknown
): {
  bodyInit: BodyInit | undefined;
  shouldSetJsonContentType: boolean;
  isFormData: boolean;
} {
  if (rawBody === undefined || method === 'GET') {
    return {
      bodyInit: undefined,
      shouldSetJsonContentType: false,
      isFormData: false,
    };
  }

  if (typeof FormData !== 'undefined' && rawBody instanceof FormData) {
    return {
      bodyInit: rawBody,
      shouldSetJsonContentType: false,
      isFormData: true,
    };
  }

  if (
    (typeof URLSearchParams !== 'undefined' && rawBody instanceof URLSearchParams) ||
    (typeof Blob !== 'undefined' && rawBody instanceof Blob) ||
    rawBody instanceof ArrayBuffer ||
    ArrayBuffer.isView(rawBody)
  ) {
    return {
      bodyInit: rawBody as BodyInit,
      shouldSetJsonContentType: false,
      isFormData: false,
    };
  }

  if (typeof rawBody === 'string') {
    return {
      bodyInit: rawBody,
      shouldSetJsonContentType: false,
      isFormData: false,
    };
  }

  return {
    bodyInit: JSON.stringify(rawBody),
    shouldSetJsonContentType: true,
    isFormData: false,
  };
}

export interface RequestWithBodyConfig<TBody = unknown> extends ApiRequestOptions {
  method: HttpMethod;
  body?: TBody;
}

export interface DeleteRequestConfig<TBody = unknown> extends ApiRequestOptions {
  body?: TBody;
}

interface InternalRequestOptions extends ApiRequestOptions {
  overrideAccessToken?: string;
}

export interface ApiClient {
  getBaseUrl: () => string;
  requestWithMeta: <TResponse, TBody = unknown>(
    path: string,
    config: RequestWithBodyConfig<TBody>
  ) => Promise<ApiClientResponse<TResponse>>;
  request: <TResponse, TBody = unknown>(
    path: string,
    config: RequestWithBodyConfig<TBody>
  ) => Promise<TResponse>;
  get: <TResponse>(path: string, options?: ApiRequestOptions) => Promise<TResponse>;
  post: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions
  ) => Promise<TResponse>;
  put: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions
  ) => Promise<TResponse>;
  patch: <TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions
  ) => Promise<TResponse>;
  delete: <TResponse = void, TBody = unknown>(
    path: string,
    options?: DeleteRequestConfig<TBody>
  ) => Promise<TResponse>;
}

/**
 * Factory creating a reusable centralized HTTP client.
 * - Attaches in-memory Bearer access tokens to API-origin requests.
 * - Coordinates 401 recovery through single-flight `POST /auth/refresh` (with
 *   `credentials: 'include'`), retrying the failed request at most once.
 * - Never treats 403 as an expired session or recursively refreshes `/auth/refresh`.
 */
export function createApiClient(config?: ApiClientConfig): ApiClient {
  const baseUrl = normalizeApiBaseUrl(config?.baseUrl ?? API_BASE_URL);
  const defaultTimeoutMs = config?.defaultTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const refreshTimeoutMs = config?.refreshTimeoutMs ?? DEFAULT_REFRESH_TIMEOUT_MS;
  const defaultCredentials = config?.defaultCredentials ?? 'include';
  const readAccessToken = config?.getAccessToken ?? getAccessToken;

  async function executeSingleAttempt<TResponse, TBody>(
    method: HttpMethod,
    path: string,
    body: TBody | undefined,
    options: InternalRequestOptions | undefined
  ): Promise<ApiClientResponse<TResponse>> {
    const url = buildUrlWithParams(baseUrl, path, options?.params);
    const timeoutMs = options?.timeoutMs ?? defaultTimeoutMs;
    const responseType = options?.responseType ?? 'json';
    const callerSignal = options?.signal;

    if (callerSignal?.aborted) {
      throw createNetworkApiError({
        error: callerSignal.reason ?? new DOMException('Aborted', 'AbortError'),
        didTimeout: false,
        didCallerAbort: true,
        baseUrl,
        method,
        url,
      });
    }

    const { bodyInit, shouldSetJsonContentType, isFormData } = serializeRequestBody(
      method,
      body
    );

    const headers = new Headers(options?.headers);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    if (isFormData) {
      // Allow browser/Fetch to assign the multipart boundary automatically
      headers.delete('Content-Type');
    } else if (shouldSetJsonContentType && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (!options?.skipAuthHeader) {
      const accessToken = options?.overrideAccessToken ?? readAccessToken();
      if (accessToken && isSameApiOrigin(url, baseUrl) && (!headers.has('Authorization') || options?.overrideAccessToken)) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }

    const controller = new AbortController();
    let didTimeout = false;
    let didCallerAbort = false;

    const handleCallerAbort = () => {
      didCallerAbort = true;
      controller.abort(callerSignal?.reason);
    };

    if (callerSignal) {
      callerSignal.addEventListener('abort', handleCallerAbort, { once: true });
    }

    const timeoutId =
      timeoutMs > 0
        ? globalThis.setTimeout(() => {
            didTimeout = true;
            controller.abort();
          }, timeoutMs)
        : undefined;

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: bodyInit,
        credentials: options?.credentials ?? defaultCredentials,
        signal: controller.signal,
      });
    } catch (error: unknown) {
      throw createNetworkApiError({
        error,
        didTimeout,
        didCallerAbort,
        baseUrl,
        method,
        url,
      });
    } finally {
      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
      }
      if (callerSignal) {
        callerSignal.removeEventListener('abort', handleCallerAbort);
      }
    }

    const parsed = await parseHttpResponsePayload(response, responseType);

    if (!response.ok) {
      throw createHttpApiError({
        statusCode: response.status,
        parsed,
        baseUrl,
        method,
        url,
      });
    }

    if (parsed.malformedJson && responseType === 'json') {
      throw new ApiError({
        message: 'Received malformed JSON response from the server.',
        code: 'MALFORMED_RESPONSE',
        statusCode: response.status,
        rawResponse: parsed.data,
        method,
        url,
        cause: parsed.parseError,
      });
    }

    // Defensive check in case a 2xx response explicitly signals `{ success: false }`
    if (parsed.isJson && isRecord(parsed.data) && parsed.data.success === false) {
      throw createHttpApiError({
        statusCode: response.status,
        parsed,
        baseUrl,
        method,
        url,
      });
    }

    return {
      data: parsed.data as TResponse,
      status: response.status,
      headers: response.headers,
    };
  }

  async function refreshSessionViaCookie(): Promise<AuthResult<AuthSession>> {
    return runSingleFlightRefresh(async () => {
      try {
        const result = await executeSingleAttempt<unknown, undefined>(
          'POST',
          '/auth/refresh',
          undefined,
          {
            credentials: 'include',
            timeoutMs: refreshTimeoutMs,
            skipAuthHeader: true,
            skipAuthRefresh: true,
          }
        );

        const { session, message } = normalizeAuthSuccessPayload(result.data);
        if (!session) {
          return {
            success: false,
            statusCode: result.status,
            error: 'Authentication response was incomplete. Missing user or access token.',
          };
        }

        return {
          success: true,
          statusCode: result.status,
          message,
          data: session,
        };
      } catch (err: unknown) {
        if (isApiError(err)) {
          return {
            success: false,
            statusCode: err.statusCode,
            error: err.message,
            isNetworkError: err.isNetworkError,
          };
        }
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Session restoration failed.',
          isNetworkError: true,
        };
      }
    });
  }

  async function executeWithAuthRecovery<TResponse, TBody>(
    method: HttpMethod,
    path: string,
    body: TBody | undefined,
    options: InternalRequestOptions | undefined,
    hasRetried: boolean
  ): Promise<ApiClientResponse<TResponse>> {
    const epochAtDispatch = getSessionEpoch();

    try {
      return await executeSingleAttempt<TResponse, TBody>(method, path, body, options);
    } catch (error: unknown) {
      const canAttemptRefresh =
        isApiError(error) &&
        error.statusCode === 401 &&
        !options?.skipAuthRefresh &&
        !hasRetried &&
        !options?.signal?.aborted &&
        epochAtDispatch === getSessionEpoch();

      if (!canAttemptRefresh) {
        throw error;
      }

      const refreshResult = await refreshSessionViaCookie();

      if (!refreshResult.success || !refreshResult.data?.accessToken) {
        const isTerminalAuthRejection =
          !refreshResult.isNetworkError &&
          (refreshResult.statusCode === 400 ||
            refreshResult.statusCode === 401 ||
            refreshResult.statusCode === 403);

        if (isTerminalAuthRejection && epochAtDispatch === getSessionEpoch()) {
          notifySessionInvalidated();
        }

        // Preserve original 401 error when refresh fails
        throw error;
      }

      // If logout/login/guest switch happened while request or refresh was in flight, do not replay
      if (epochAtDispatch !== getSessionEpoch()) {
        throw error;
      }

      return executeWithAuthRecovery<TResponse, TBody>(
        method,
        path,
        body,
        {
          ...options,
          overrideAccessToken: refreshResult.data.accessToken,
        },
        true
      );
    }
  }

  function requestWithMeta<TResponse, TBody = unknown>(
    path: string,
    requestConfig: RequestWithBodyConfig<TBody>
  ): Promise<ApiClientResponse<TResponse>> {
    const { method, body, ...options } = requestConfig;
    return executeWithAuthRecovery<TResponse, TBody>(
      method,
      path,
      body,
      options,
      false
    );
  }

  async function request<TResponse, TBody = unknown>(
    path: string,
    requestConfig: RequestWithBodyConfig<TBody>
  ): Promise<TResponse> {
    const response = await requestWithMeta<TResponse, TBody>(path, requestConfig);
    return response.data;
  }

  return {
    getBaseUrl: () => baseUrl,
    requestWithMeta,
    request,
    get: <TResponse>(path: string, options?: ApiRequestOptions) =>
      request<TResponse>(path, { ...options, method: 'GET' }),
    post: <TResponse, TBody = unknown>(
      path: string,
      body?: TBody,
      options?: ApiRequestOptions
    ) => request<TResponse, TBody>(path, { ...options, method: 'POST', body }),
    put: <TResponse, TBody = unknown>(
      path: string,
      body?: TBody,
      options?: ApiRequestOptions
    ) => request<TResponse, TBody>(path, { ...options, method: 'PUT', body }),
    patch: <TResponse, TBody = unknown>(
      path: string,
      body?: TBody,
      options?: ApiRequestOptions
    ) => request<TResponse, TBody>(path, { ...options, method: 'PATCH', body }),
    delete: <TResponse = void, TBody = unknown>(
      path: string,
      options?: DeleteRequestConfig<TBody>
    ) => request<TResponse, TBody>(path, { ...options, method: 'DELETE' }),
  };
}

export const apiClient = createApiClient();
