import {
  normalizeAuthErrorMessage,
  normalizeAuthSuccessPayload,
  type AuthErrorOperation,
} from '../adapters/auth.adapter';
import type {
  BackendLoginRequestDto,
  BackendRegisterRequestDto,
} from '../types/api/auth.dto';
import type {
  AuthResult,
  AuthSession,
  LoginCredentials,
  RegisterCredentials,
} from '../types/domain/auth';
import { API_BASE_URL, apiClient, isApiError } from './api';
import {
  applyAuthenticatedSessionToMemory,
  clearMemoryAuthSession,
  runBootstrapRefreshOnce,
  runSingleFlightRefresh,
} from './authSession';

export { API_BASE_URL };

const AUTH_REQUEST_TIMEOUT_MS = 10_000;

function mapSessionAuthError<T>(
  err: unknown,
  operation: Exclude<AuthErrorOperation, 'logout'>
): AuthResult<T> {
  if (isApiError(err)) {
    if (err.isNetworkError || err.isTimeout) {
      return {
        success: false,
        statusCode: err.statusCode,
        error: `Authentication server unreachable (${API_BASE_URL}). ${err.message}`,
        isNetworkError: true,
      };
    }

    if (err.code === 'MALFORMED_RESPONSE') {
      return {
        success: false,
        statusCode: err.statusCode,
        error: 'Authentication response was incomplete or malformed.',
      };
    }

    return {
      success: false,
      statusCode: err.statusCode,
      error: normalizeAuthErrorMessage(
        err.statusCode ?? 500,
        err.rawResponse,
        operation
      ),
    };
  }

  return {
    success: false,
    error: err instanceof Error ? err.message : 'Network connection failure',
    isNetworkError: true,
  };
}

async function executeSessionAuthRequest(
  path: string,
  operation: Exclude<AuthErrorOperation, 'logout'>,
  body?: unknown
): Promise<AuthResult<AuthSession>> {
  try {
    const response = await apiClient.requestWithMeta<unknown, unknown>(path, {
      method: 'POST',
      body,
      timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
      credentials: 'include',
      skipAuthHeader: true,
      skipAuthRefresh: true,
    });

    const { session, message } = normalizeAuthSuccessPayload(response.data);
    if (!session) {
      return {
        success: false,
        statusCode: response.status,
        error: 'Authentication response was incomplete. Missing user or access token.',
      };
    }

    return {
      success: true,
      statusCode: response.status,
      message,
      data: session,
    };
  } catch (err: unknown) {
    return mapSessionAuthError(err, operation);
  }
}

/**
 * Authentication HTTP service decoupled from UI presentation components.
 * Targets mounted backend routes under `/api/auth/*` via the shared `apiClient`.
 */
export const authService = {
  /**
   * Sign in existing user via `POST /api/auth/login`.
   */
  async login(credentials: LoginCredentials): Promise<AuthResult<AuthSession>> {
    const payload: BackendLoginRequestDto = {
      email: credentials.email.trim(),
      password: credentials.password,
    };

    const result = await executeSessionAuthRequest('/auth/login', 'login', payload);
    if (result.success && result.data) {
      applyAuthenticatedSessionToMemory(result.data.accessToken);
    }
    return result;
  },

  /**
   * Register new user via `POST /api/auth/register`.
   */
  async register(credentials: RegisterCredentials): Promise<AuthResult<AuthSession>> {
    const payload: BackendRegisterRequestDto = {
      name: credentials.name.trim(),
      email: credentials.email.trim(),
      password: credentials.password,
    };

    const result = await executeSessionAuthRequest('/auth/register', 'register', payload);
    if (result.success && result.data) {
      applyAuthenticatedSessionToMemory(result.data.accessToken);
    }
    return result;
  },

  /**
   * Restore or rotate session via `POST /api/auth/refresh` using HttpOnly refresh cookie.
   * Deduplicated across concurrent callers so rotating refresh tokens are never reused.
   */
  async refresh(): Promise<AuthResult<AuthSession>> {
    return runSingleFlightRefresh(() =>
      executeSessionAuthRequest('/auth/refresh', 'refresh')
    );
  },

  /**
   * Initial mount bootstrap helper shared cleanly across React StrictMode mounts.
   */
  async bootstrapRefresh(): Promise<AuthResult<AuthSession>> {
    return runBootstrapRefreshOnce(() =>
      executeSessionAuthRequest('/auth/refresh', 'refresh')
    );
  },

  /**
   * Revoke server refresh cookie & session via `POST /api/auth/logout`.
   * Always clears local in-memory credentials even if the network call fails.
   */
  async logout(): Promise<AuthResult<void>> {
    try {
      const response = await apiClient.requestWithMeta<unknown>('/auth/logout', {
        method: 'POST',
        timeoutMs: AUTH_REQUEST_TIMEOUT_MS,
        credentials: 'include',
        skipAuthHeader: true,
        skipAuthRefresh: true,
      });

      return {
        success: true,
        statusCode: response.status,
      };
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.isNetworkError || err.isTimeout) {
          return {
            success: false,
            statusCode: err.statusCode,
            error: err.message,
            isNetworkError: true,
          };
        }

        return {
          success: false,
          statusCode: err.statusCode,
          error: normalizeAuthErrorMessage(
            err.statusCode ?? 500,
            err.rawResponse,
            'logout'
          ),
        };
      }

      return {
        success: false,
        error: err instanceof Error ? err.message : 'Logout request could not reach server.',
        isNetworkError: true,
      };
    } finally {
      clearMemoryAuthSession();
    }
  },
};
