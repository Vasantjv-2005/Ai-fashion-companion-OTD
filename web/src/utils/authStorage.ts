import type { AuthStatus } from '../types/domain/auth';

/**
 * Centralized OTD storage classification, workspace scoping, and cache teardown helpers.
 *
 * Keeps private user-specific caches strictly separated from Guest Demo data:
 * - Authenticated user data is strictly namespaced under `otd_private:<userId>:*` and
 *   IndexedDB key `auth_intake_session:<userId>`.
 * - Guest Demo data uses `GUEST_WORKSPACE_STORAGE_KEYS` and `active_intake_session`.
 * - Non-writable scopes (`initializing`, `unauthenticated`, `missing-user-id`) resolve
 *   to `{ kind: 'none' }` and never read/write persistent storage.
 * - Logout clears in-memory tokens (via AuthContext) + private/legacy auth cache keys
 *   and authenticated IndexedDB drafts, while preserving Guest Demo workspace data.
 * - Explicit "Reset Cache" / ErrorBoundary crash recovery clears both.
 */

export type OtdWorkspaceScopeReason =
  | 'initializing'
  | 'unauthenticated'
  | 'missing-user-id';

export type OtdWorkspaceScope =
  | { kind: 'guest' }
  | { kind: 'authenticated'; userId: string }
  | { kind: 'none'; reason: OtdWorkspaceScopeReason };

export type ScopedWorkspaceResource =
  | 'closet_items'
  | 'user_profile'
  | 'shopping_list'
  | 'saved_looks'
  | 'liked_looks'
  | 'intake_draft_fallback';

export const GUEST_WORKSPACE_STORAGE_KEYS = [
  'otd_closet_items',
  'otd_user_profile',
  'otd_shopping_list',
  'otd_saved_looks',
  'otd_liked_looks',
  'otd_intake_draft_fallback',
] as const;

const GUEST_RESOURCE_STORAGE_KEYS: Record<ScopedWorkspaceResource, string> = {
  closet_items: 'otd_closet_items',
  user_profile: 'otd_user_profile',
  shopping_list: 'otd_shopping_list',
  saved_looks: 'otd_saved_looks',
  liked_looks: 'otd_liked_looks',
  intake_draft_fallback: 'otd_intake_draft_fallback',
};

export const PRIVATE_STORAGE_NAMESPACE = 'otd_private';
export const INTAKE_DRAFT_DB_NAME = 'otd_intake_db';
export const INTAKE_DRAFT_DB_VERSION = 1;
export const INTAKE_DRAFT_STORE_NAME = 'garment_drafts';
export const GUEST_INTAKE_DRAFT_KEY = 'active_intake_session';
export const PRIVATE_INTAKE_DRAFT_KEY_PREFIX = 'auth_intake_session:';

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

let privateCachePurgeGeneration = 0;
let privateIndexedDbPurgeQueue: Promise<void> = Promise.resolve();
let activePrivateCacheOwnerId: string | null = null;

/**
 * Registers the currently active authenticated user ID in memory so same-tab
 * logout / invalidation purges only that user's private caches without blindly
 * deleting another active user's namespaced caches in another tab.
 *
 * Architectural limitation: because AuthContext / authSession cannot read
 * sibling tabs' in-memory state and session cookies are origin-shared, full
 * cross-tab session-ownership arbitrage would require a shared channel inside
 * the auth layer; within UI/storage scope we isolate writes by user namespace
 * and scope purges to the active owner when known.
 */
export function setActivePrivateCacheOwnerId(userId: string | null): void {
  activePrivateCacheOwnerId = normalizeAuthUserId(userId);
}

export function getActivePrivateCacheOwnerId(): string | null {
  return activePrivateCacheOwnerId;
}

export function normalizeAuthUserId(userId: string | null | undefined): string | null {
  if (typeof userId !== 'string') return null;
  const trimmed = userId.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveWorkspaceScope(
  status: AuthStatus,
  userId?: string | null
): OtdWorkspaceScope {
  if (status === 'guest') {
    return { kind: 'guest' };
  }
  if (status === 'authenticated') {
    const normalizedId = normalizeAuthUserId(userId);
    if (!normalizedId) {
      return { kind: 'none', reason: 'missing-user-id' };
    }
    return { kind: 'authenticated', userId: normalizedId };
  }
  if (status === 'initializing') {
    return { kind: 'none', reason: 'initializing' };
  }
  return { kind: 'none', reason: 'unauthenticated' };
}

export function getWorkspaceScopeId(scope: OtdWorkspaceScope): string {
  if (scope.kind === 'guest') return 'guest';
  if (scope.kind === 'authenticated') return `auth:${scope.userId}`;
  return `none:${scope.reason}`;
}

export function getScopedStorageKey(
  scope: OtdWorkspaceScope,
  resource: ScopedWorkspaceResource
): string | null {
  if (scope.kind === 'guest') {
    return GUEST_RESOURCE_STORAGE_KEYS[resource];
  }
  if (scope.kind === 'authenticated') {
    const normalizedId = normalizeAuthUserId(scope.userId);
    if (!normalizedId) return null;
    return `${PRIVATE_STORAGE_NAMESPACE}:${normalizedId}:${resource}`;
  }
  return null;
}

export function getScopedDraftIndexedDbKey(scope: OtdWorkspaceScope): string | null {
  if (scope.kind === 'guest') {
    return GUEST_INTAKE_DRAFT_KEY;
  }
  if (scope.kind === 'authenticated') {
    const normalizedId = normalizeAuthUserId(scope.userId);
    if (!normalizedId) return null;
    return `${PRIVATE_INTAKE_DRAFT_KEY_PREFIX}${normalizedId}`;
  }
  return null;
}

export function getPrivateCachePurgeGeneration(): number {
  return privateCachePurgeGeneration;
}

export function waitForPendingPrivateDraftPurge(): Promise<void> {
  return privateIndexedDbPurgeQueue;
}

function isUnscopedLegacyAuthKey(key: string): boolean {
  return (
    key.startsWith('otd_user_cache:') ||
    key.startsWith('otd_auth:') ||
    LEGACY_AUTH_AND_DRAFT_KEYS.includes(
      key as (typeof LEGACY_AUTH_AND_DRAFT_KEYS)[number]
    )
  );
}

function shouldPurgePrivateKey(
  key: string,
  targetUserId: string | null,
  allUsers: boolean
): boolean {
  if (isUnscopedLegacyAuthKey(key)) {
    return true;
  }
  if (!key.startsWith(`${PRIVATE_STORAGE_NAMESPACE}:`)) {
    return false;
  }
  if (allUsers) {
    return true;
  }
  if (targetUserId) {
    return key.startsWith(`${PRIVATE_STORAGE_NAMESPACE}:${targetUserId}:`);
  }
  return false;
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

async function clearPrivateIndexedDbDraftKeys(
  targetUserId: string | null,
  allUsers: boolean
): Promise<void> {
  if (!allUsers && !targetUserId) {
    return;
  }
  if (typeof window === 'undefined' || !('indexedDB' in window) || !window.indexedDB) {
    return;
  }

  const idb = window.indexedDB;
  if (typeof idb.databases === 'function') {
    try {
      const databases = await idb.databases();
      if (
        Array.isArray(databases) &&
        !databases.some((entry) => entry.name === INTAKE_DRAFT_DB_NAME)
      ) {
        return;
      }
    } catch {
      // Ignore databases() inspection failures and proceed safely without creating a new DB
    }
  }

  await new Promise<void>((resolve) => {
    try {
      let abortedNewDb = false;
      const openRequest = idb.open(INTAKE_DRAFT_DB_NAME, INTAKE_DRAFT_DB_VERSION);
      openRequest.onupgradeneeded = (event) => {
        if (event.oldVersion === 0) {
          abortedNewDb = true;
          (event.target as IDBOpenDBRequest).transaction?.abort();
        }
      };
      openRequest.onerror = () => {
        if (abortedNewDb) {
          resolve();
          return;
        }
        resolve();
      };
      openRequest.onblocked = () => resolve();
      openRequest.onsuccess = () => {
        const openedDb = openRequest.result;
        const finishAndClose = () => {
          try {
            openedDb.close();
          } catch {
            // Ignore close errors
          }
          resolve();
        };

        try {
          if (!openedDb.objectStoreNames.contains(INTAKE_DRAFT_STORE_NAME)) {
            finishAndClose();
            return;
          }
          const tx = openedDb.transaction([INTAKE_DRAFT_STORE_NAME], 'readwrite');
          const store = tx.objectStore(INTAKE_DRAFT_STORE_NAME);

          if (allUsers) {
            const keysRequest = store.getAllKeys();
            keysRequest.onsuccess = () => {
              const keys = keysRequest.result;
              for (const key of keys) {
                if (typeof key === 'string' && key.startsWith(PRIVATE_INTAKE_DRAFT_KEY_PREFIX)) {
                  store.delete(key);
                }
              }
            };
          } else if (targetUserId) {
            store.delete(`${PRIVATE_INTAKE_DRAFT_KEY_PREFIX}${targetUserId}`);
          }

          tx.oncomplete = finishAndClose;
          tx.onerror = finishAndClose;
          tx.onabort = finishAndClose;
        } catch {
          finishAndClose();
        }
      };
    } catch {
      resolve();
    }
  });
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
 * Clears authenticated private user caches, authenticated IndexedDB drafts, and
 * legacy auth storage keys on logout/invalidation.
 * - When scoped to the active user (`options.userId` or `activePrivateCacheOwnerId`),
 *   only that user's `otd_private:<userId>:*` and `auth_intake_session:<userId>`
 *   entries are purged, avoiding accidental deletion of another active user's keys.
 * - When `options.allUsers` is true (Reset Cache / crash recovery), all `otd_private:*`
 *   and `auth_intake_session:*` entries across users are scrubbed.
 * Deliberately preserves Guest Demo workspace keys (`otd_closet_items`, `active_intake_session`, etc.) and theme.
 */
export function clearPrivateUserCaches(options?: {
  userId?: string | null;
  allUsers?: boolean;
  preserveGuestSession?: boolean;
}): void {
  privateCachePurgeGeneration += 1;
  const allUsers = Boolean(options?.allUsers);
  const preserveGuestSession = Boolean(options?.preserveGuestSession);
  const explicitUserId = options && 'userId' in options ? normalizeAuthUserId(options.userId) : null;
  const targetUserId = allUsers ? null : explicitUserId ?? activePrivateCacheOwnerId;

  if (allUsers || (targetUserId && targetUserId === activePrivateCacheOwnerId)) {
    activePrivateCacheOwnerId = null;
  }

  try {
    if (typeof window === 'undefined') return;

    const lsKeys = collectMatchingKeys(window.localStorage, (key) =>
      shouldPurgePrivateKey(key, targetUserId, allUsers)
    );
    for (const key of lsKeys) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Ignore individual key removal errors
      }
    }

    const ssKeys = collectMatchingKeys(
      window.sessionStorage,
      (key) =>
        (!preserveGuestSession && key === GUEST_SESSION_STORAGE_KEY) ||
        shouldPurgePrivateKey(key, targetUserId, allUsers)
    );
    for (const key of ssKeys) {
      try {
        window.sessionStorage.removeItem(key);
      } catch {
        // Ignore individual key removal errors
      }
    }

    privateIndexedDbPurgeQueue = privateIndexedDbPurgeQueue.then(
      () => clearPrivateIndexedDbDraftKeys(targetUserId, allUsers),
      () => clearPrivateIndexedDbDraftKeys(targetUserId, allUsers)
    );
  } catch {
    // Ignore outer storage errors
  }
}

/**
 * Clears all OTD data stores except appearance theme (`otd_theme`).
 * Used only for explicit "Reset Cache" or crash recovery flows.
 */
export function clearAllOtdWorkspaceStorage(options?: { includeSettings?: boolean }): void {
  clearPrivateUserCaches({ allUsers: true });
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

