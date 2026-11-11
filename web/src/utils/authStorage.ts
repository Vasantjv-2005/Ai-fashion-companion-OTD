/**
 * Centralized OTD storage classification and cache teardown helpers.
 *
 * Keeps private user-specific caches strictly separated from Guest Demo data:
 * - Logout clears in-memory tokens (via AuthContext) + private/legacy auth cache keys,
 *   while preserving Guest Demo workspace data so user demo items are not deleted unnecessarily.
 * - Explicit "Reset Cache" / ErrorBoundary crash recovery clears both.
 */

export const GUEST_WORKSPACE_STORAGE_KEYS = [
  'otd_closet_items',
  'otd_user_profile',
  'otd_shopping_list',
  'otd_saved_looks',
  'otd_liked_looks',
  'otd_intake_draft_fallback',
] as const;

export const PREFERENCE_STORAGE_KEYS = [
  'otd_theme',
  'otd_user_settings',
] as const;

/** Prefixes reserved for authenticated user-scoped cached payloads. */
export const PRIVATE_AUTH_KEY_PREFIXES = [
  'otd_private:',
  'otd_user_cache:',
  'otd_auth:',
] as const;

/** Legacy / superseded keys that must always be scrubbed on logout or reset. */
export const LEGACY_AUTH_AND_DRAFT_KEYS = [
  'otd_auth_token',
  'otd_auth_user',
  'otd_refresh_token',
  'otd_closet_upload_draft',
] as const;

export const GUEST_SESSION_STORAGE_KEY = 'otd_guest_demo_active';

function isPrivateAuthKey(key: string): boolean {
  return (
    PRIVATE_AUTH_KEY_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    LEGACY_AUTH_AND_DRAFT_KEYS.includes(
      key as (typeof LEGACY_AUTH_AND_DRAFT_KEYS)[number]
    )
  );
}

function collectMatchingKeys(storage: Storage, predicate: (key: string) => boolean): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key && predicate(key)) {
      keys.push(key);
    }
  }
  return keys;
}

export function isGuestDemoSessionActive(): boolean {
  try {
    return (
      typeof window !== 'undefined' &&
      window.sessionStorage.getItem(GUEST_SESSION_STORAGE_KEY) === '1'
    );
  } catch {
    return false;
  }
}

export function setGuestDemoSessionActive(active: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    if (active) {
      window.sessionStorage.setItem(GUEST_SESSION_STORAGE_KEY, '1');
    } else {
      window.sessionStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access errors (e.g. private browsing restrictions)
  }
}

/**
 * Clears authenticated private user caches and legacy auth storage keys on logout.
 * Deliberately preserves Guest Demo workspace keys (`otd_closet_items`, etc.) and theme.
 */
export function clearPrivateUserCaches(): void {
  try {
    if (typeof window === 'undefined') return;

    const lsKeys = collectMatchingKeys(window.localStorage, isPrivateAuthKey);
    for (const key of lsKeys) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore individual key removal errors
      }
    }

    const ssKeys = collectMatchingKeys(
      window.sessionStorage,
      (key) => key === GUEST_SESSION_STORAGE_KEY || isPrivateAuthKey(key)
    );
    for (const key of ssKeys) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Ignore individual key removal errors
      }
    }
  } catch {
    // Ignore outer storage errors
  }
}

/**
 * Clears all OTD data stores except appearance theme (`otd_theme`).
 * Used only for explicit "Reset Cache" or crash recovery flows.
 */
export function clearAllOtdWorkspaceStorage(options?: { includeSettings?: boolean }): void {
  clearPrivateUserCaches();
  try {
    if (typeof window === 'undefined') return;
    for (const key of GUEST_WORKSPACE_STORAGE_KEYS) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore individual key removal errors
      }
    }
    if (options?.includeSettings) {
      try {
        window.localStorage.removeItem('otd_user_settings');
      } catch {
        // Ignore
      }
    }
  } catch {
    // Ignore
  }
}

