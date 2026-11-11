import type { AuthResult, AuthSession } from '../types/domain/auth';

/**
 * Pure in-memory session token and single-flight refresh coordinator.
 *
 * Security invariants:
 * - Access tokens live strictly in module memory (never localStorage/sessionStorage).
 * - Refresh tokens are managed via HttpOnly cookies on the backend and are never accessed in JS.
 * - Concurrent / React StrictMode refresh calls share a single in-flight request to avoid
 *   rotating refresh token collisions.
 */

let accessTokenMemory: string | null = null;
let sessionEpoch = 0;

let inFlightRefreshPromise: Promise<AuthResult<AuthSession>> | null = null;
let bootstrapPromise: Promise<AuthResult<AuthSession>> | null = null;

export interface AuthSessionEventListener {
  onSessionRefreshed?: (session: AuthSession) => void;
  onSessionInvalidated?: () => void;
}

const sessionListeners = new Set<AuthSessionEventListener>();

export function subscribeAuthSessionEvents(
  listener: AuthSessionEventListener
): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

export function notifySessionRefreshed(session: AuthSession): void {
  for (const listener of sessionListeners) {
    listener.onSessionRefreshed?.(session);
  }
}

export function notifySessionInvalidated(): void {
  for (const listener of sessionListeners) {
    listener.onSessionInvalidated?.();
  }
}

export function getAccessToken(): string | null {
  return accessTokenMemory;
}

export function setAccessToken(token: string | null): void {
  accessTokenMemory = token && token.trim() ? token.trim() : null;
}

export function getSessionEpoch(): number {
  return sessionEpoch;
}

export function advanceSessionEpoch(): number {
  sessionEpoch += 1;
  return sessionEpoch;
}

export function clearMemoryAuthSession(): void {
  sessionEpoch += 1;
  accessTokenMemory = null;
  inFlightRefreshPromise = null;
  bootstrapPromise = null;
}

export function applyAuthenticatedSessionToMemory(token: string): void {
  sessionEpoch += 1;
  accessTokenMemory = token.trim();
  bootstrapPromise = null;
}

export async function runSingleFlightRefresh(
  fetcher: () => Promise<AuthResult<AuthSession>>
): Promise<AuthResult<AuthSession>> {
  if (inFlightRefreshPromise) {
    return inFlightRefreshPromise;
  }

  const epochAtStart = sessionEpoch;

  const promise = fetcher()
    .then((result) => {
      // Only commit token if logout/login/guest switch didn't supersede this refresh while in flight
      if (epochAtStart !== sessionEpoch) {
        return {
          success: false,
          error: 'Authentication session changed while refresh was in flight.',
        } as AuthResult<AuthSession>;
      }

      if (result.success && result.data?.accessToken) {
        accessTokenMemory = result.data.accessToken;
        notifySessionRefreshed(result.data);
      } else {
        accessTokenMemory = null;
      }
      return result;
    })
    .finally(() => {
      if (inFlightRefreshPromise === promise) {
        inFlightRefreshPromise = null;
      }
    });

  inFlightRefreshPromise = promise;
  return promise;
}

/**
 * Coordinates the initial mount session restoration (`POST /api/auth/refresh`) so React 19
 * StrictMode double-mounts reuse the same bootstrap attempt without firing duplicate
 * rotating refresh requests.
 */
export async function runBootstrapRefreshOnce(
  fetcher: () => Promise<AuthResult<AuthSession>>
): Promise<AuthResult<AuthSession>> {
  if (!bootstrapPromise) {
    bootstrapPromise = runSingleFlightRefresh(fetcher);
  }
  return bootstrapPromise;
}

