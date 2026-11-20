/**
 * Native IndexedDB Draft Storage for OTD Wardrobe Intake.
 *
 * Provides safe, scope-isolated persistent storage for in-progress garment drafts:
 * - Guest Demo drafts live in IndexedDB key `active_intake_session` and fallback
 *   localStorage key `otd_intake_draft_fallback`.
 * - Authenticated user drafts live strictly in `auth_intake_session:<userId>` and
 *   `otd_private:<userId>:intake_draft_fallback`.
 * - Unauthenticated/initializing/missing-id scopes (`{ kind: 'none' }`) perform zero storage I/O.
 *
 * Zero external dependencies. Gracefully falls back to metadata storage
 * if IndexedDB is unavailable or restricted.
 */

import type { GarmentDraft } from '../components/ClosetUploadView';
import {
  getPrivateCachePurgeGeneration,
  getScopedDraftIndexedDbKey,
  getScopedStorageKey,
  INTAKE_DRAFT_DB_NAME,
  INTAKE_DRAFT_DB_VERSION,
  INTAKE_DRAFT_STORE_NAME,
  waitForPendingPrivateDraftPurge,
  type OtdWorkspaceScope,
} from './authStorage';

export interface DraftSessionData {
  drafts: GarmentDraft[];
  stage: 'select' | 'camera' | 'library' | 'form';
  activeDraftIndex: number;
  updatedAt: number;
  storageEngine: 'indexeddb' | 'localstorage_fallback';
  imagesPreserved: boolean;
}

// In-memory simulation switch for QA verification of IndexedDB failure
let simulateIndexedDBFailure = false;

export function setSimulateIndexedDBFailure(value: boolean): void {
  simulateIndexedDBFailure = value;
}

export function getSimulateIndexedDBFailure(): boolean {
  return simulateIndexedDBFailure;
}

/**
 * Check if native IndexedDB is available and unblocked.
 */
export function isIndexedDBAvailable(): boolean {
  try {
    return (
      !simulateIndexedDBFailure &&
      typeof window !== 'undefined' &&
      'indexedDB' in window &&
      window.indexedDB !== null
    );
  } catch {
    return false;
  }
}

/**
 * Open or upgrade the native IndexedDB database.
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (simulateIndexedDBFailure || !isIndexedDBAvailable()) {
      reject(new Error('IndexedDB is unavailable or simulated as disabled.'));
      return;
    }

    const request = window.indexedDB.open(INTAKE_DRAFT_DB_NAME, INTAKE_DRAFT_DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(INTAKE_DRAFT_STORE_NAME)) {
        db.createObjectStore(INTAKE_DRAFT_STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open draft database.'));
  });
}

/**
 * Open an existing IndexedDB draft database for read/delete cleanup without
 * creating a brand-new database when none exists yet.
 */
async function openExistingDraftDatabase(): Promise<IDBDatabase | null> {
  if (simulateIndexedDBFailure || !isIndexedDBAvailable()) {
    return null;
  }

  const idb = window.indexedDB;
  if (typeof idb.databases === 'function') {
    try {
      const databases = await idb.databases();
      if (
        Array.isArray(databases) &&
        !databases.some((entry) => entry.name === INTAKE_DRAFT_DB_NAME)
      ) {
        return null;
      }
    } catch {
      // Fallback to version-guarded open below
    }
  }

  return new Promise((resolve, reject) => {
    let abortedNewDb = false;
    const request = idb.open(INTAKE_DRAFT_DB_NAME, INTAKE_DRAFT_DB_VERSION);

    request.onupgradeneeded = (event) => {
      if (event.oldVersion === 0) {
        abortedNewDb = true;
        (event.target as IDBOpenDBRequest).transaction?.abort();
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(INTAKE_DRAFT_STORE_NAME)) {
        closeDatabaseSafely(db);
        resolve(null);
        return;
      }
      resolve(db);
    };

    request.onerror = () => {
      if (abortedNewDb) {
        resolve(null);
        return;
      }
      reject(request.error || new Error('Failed to open existing draft database.'));
    };

    request.onblocked = () => resolve(null);
  });
}

function closeDatabaseSafely(db: IDBDatabase | null): void {
  if (!db) return;
  try {
    db.close();
  } catch {
    // Ignore close errors
  }
}

function wasPrivateCachePurgedSince(
  scope: OtdWorkspaceScope,
  purgeGenerationAtStart: number | null
): boolean {
  return (
    scope.kind === 'authenticated' &&
    purgeGenerationAtStart !== null &&
    getPrivateCachePurgeGeneration() !== purgeGenerationAtStart
  );
}

/**
 * Sanitize draft data before storage (e.g. remove non-serializable File instances).
 */
function serializeDrafts(drafts: GarmentDraft[]): GarmentDraft[] {
  return drafts.map((draft) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { rawFile, ...serializable } = draft;
    return serializable;
  });
}

/**
 * Save the current upload session to IndexedDB with localStorage fallback for the active scope.
 * Returns information on which storage engine was used and whether photos were preserved.
 */
export async function saveDraftSession(
  drafts: GarmentDraft[],
  stage: 'select' | 'camera' | 'library' | 'form',
  activeDraftIndex = 0,
  scope: OtdWorkspaceScope
): Promise<{ storageEngine: 'indexeddb' | 'localstorage_fallback'; imagesPreserved: boolean }> {
  const idbKey = getScopedDraftIndexedDbKey(scope);
  const fallbackKey = getScopedStorageKey(scope, 'intake_draft_fallback');
  if (scope.kind === 'none' || !idbKey || !fallbackKey) {
    return { storageEngine: 'indexeddb', imagesPreserved: true };
  }

  if (!drafts || drafts.length === 0) {
    await clearDraftSession(scope);
    return { storageEngine: 'indexeddb', imagesPreserved: true };
  }

  const purgeGenerationAtStart =
    scope.kind === 'authenticated' ? getPrivateCachePurgeGeneration() : null;

  if (scope.kind === 'authenticated') {
    await waitForPendingPrivateDraftPurge();
    if (wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
      return { storageEngine: 'indexeddb', imagesPreserved: true };
    }
  }

  const cleanDrafts = serializeDrafts(drafts);
  const sessionData: DraftSessionData = {
    drafts: cleanDrafts,
    stage,
    activeDraftIndex,
    updatedAt: Date.now(),
    storageEngine: 'indexeddb',
    imagesPreserved: true,
  };

  let db: IDBDatabase | null = null;
  try {
    db = await openDatabase();
    if (wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
      return { storageEngine: 'indexeddb', imagesPreserved: true };
    }

    const activeDb = db;
    await new Promise<void>((resolve, reject) => {
      const transaction = activeDb.transaction([INTAKE_DRAFT_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(INTAKE_DRAFT_STORE_NAME);
      const request = store.put(sessionData, idbKey);

      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    if (!wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
      try {
        localStorage.removeItem(fallbackKey);
      } catch {
        // ignore
      }
    }

    return { storageEngine: 'indexeddb', imagesPreserved: true };
  } catch (idbError) {
    if (wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
      return { storageEngine: 'indexeddb', imagesPreserved: true };
    }

    console.warn('IndexedDB save failed, falling back to safe metadata-only localStorage storage:', idbError);

    // In localStorage fallback, strip heavy base64 images that would exceed quota
    let anyImageOmitted = false;
    const lightweightDrafts = cleanDrafts.map((d) => {
      if (d.imageUrl && d.imageUrl.length > 50000) {
        anyImageOmitted = true;
        return {
          ...d,
          imageUrl: undefined,
          processingStep: 'Photo attachment omitted from local storage fallback. Re-attach or catalog manually.',
        };
      }
      return d;
    });

    const fallbackSession: DraftSessionData = {
      ...sessionData,
      drafts: lightweightDrafts,
      storageEngine: 'localstorage_fallback',
      imagesPreserved: !anyImageOmitted,
    };

    try {
      localStorage.setItem(fallbackKey, JSON.stringify(fallbackSession));
      return { storageEngine: 'localstorage_fallback', imagesPreserved: !anyImageOmitted };
    } catch (lsError) {
      console.error('All draft storage engines failed:', lsError);
      throw new Error('STORAGE_QUOTA_EXCEEDED');
    }
  } finally {
    closeDatabaseSafely(db);
  }
}

/**
 * Load any existing recoverable draft session for the active scope.
 */
export async function loadDraftSession(
  scope: OtdWorkspaceScope
): Promise<DraftSessionData | null> {
  const idbKey = getScopedDraftIndexedDbKey(scope);
  const fallbackKey = getScopedStorageKey(scope, 'intake_draft_fallback');
  if (scope.kind === 'none' || !idbKey || !fallbackKey) {
    return null;
  }

  const purgeGenerationAtStart =
    scope.kind === 'authenticated' ? getPrivateCachePurgeGeneration() : null;

  if (scope.kind === 'authenticated') {
    await waitForPendingPrivateDraftPurge();
    if (wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
      return null;
    }
  }

  // Try IndexedDB first if not simulated as disabled
  if (!simulateIndexedDBFailure) {
    let db: IDBDatabase | null = null;
    try {
      db = await openExistingDraftDatabase();
      if (wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
        return null;
      }

      if (db) {
        const activeDb = db;
        const idbResult = await new Promise<DraftSessionData | null>((resolve, reject) => {
          const transaction = activeDb.transaction([INTAKE_DRAFT_STORE_NAME], 'readonly');
          const store = transaction.objectStore(INTAKE_DRAFT_STORE_NAME);
          const request = store.get(idbKey);

          request.onsuccess = () => {
            const result = request.result as DraftSessionData | undefined;
            resolve(result && Array.isArray(result.drafts) && result.drafts.length > 0 ? result : null);
          };
          request.onerror = () => reject(request.error);
        });

        if (wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
          return null;
        }

        if (idbResult) {
          return {
            ...idbResult,
            storageEngine: 'indexeddb',
            imagesPreserved: true,
          };
        }
      }
    } catch (idbError) {
      console.warn('Could not read from IndexedDB, checking localStorage fallback:', idbError);
    } finally {
      closeDatabaseSafely(db);
    }
  }

  if (wasPrivateCachePurgedSince(scope, purgeGenerationAtStart)) {
    return null;
  }

  // Fallback to scoped localStorage key
  try {
    const fallback = localStorage.getItem(fallbackKey);
    if (fallback) {
      const parsed = JSON.parse(fallback) as DraftSessionData;
      if (parsed && Array.isArray(parsed.drafts) && parsed.drafts.length > 0) {
        return {
          ...parsed,
          storageEngine: 'localstorage_fallback',
          imagesPreserved: Boolean(parsed.imagesPreserved),
        };
      }
    }
  } catch {
    // Ignore fallback read failure
  }

  return null;
}

/**
 * Clear the draft session for the active scope upon successful save or explicit discard.
 */
export async function clearDraftSession(scope: OtdWorkspaceScope): Promise<void> {
  const idbKey = getScopedDraftIndexedDbKey(scope);
  const fallbackKey = getScopedStorageKey(scope, 'intake_draft_fallback');
  if (scope.kind === 'none' || !idbKey || !fallbackKey) {
    return;
  }

  if (scope.kind === 'authenticated') {
    await waitForPendingPrivateDraftPurge();
  }

  try {
    localStorage.removeItem(fallbackKey);
  } catch {
    // Ignore localStorage cleanup error
  }

  let db: IDBDatabase | null = null;
  try {
    db = await openExistingDraftDatabase();
    if (!db) {
      return;
    }
    const activeDb = db;
    await new Promise<void>((resolve, reject) => {
      const transaction = activeDb.transaction([INTAKE_DRAFT_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(INTAKE_DRAFT_STORE_NAME);
      const request = store.delete(idbKey);

      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    // Ignore IndexedDB cleanup error
  } finally {
    closeDatabaseSafely(db);
  }
}

/**
 * Clear all draft sessions across both Guest and Authenticated keys.
 * Used exclusively by explicit Reset Cache workflows.
 */
export async function clearAllDraftSessions(): Promise<void> {
  await waitForPendingPrivateDraftPurge();

  try {
    localStorage.removeItem('otd_intake_draft_fallback');
  } catch {
    // Ignore localStorage cleanup error
  }

  let db: IDBDatabase | null = null;
  try {
    db = await openExistingDraftDatabase();
    if (!db) {
      return;
    }
    const activeDb = db;
    await new Promise<void>((resolve, reject) => {
      const transaction = activeDb.transaction([INTAKE_DRAFT_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(INTAKE_DRAFT_STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } catch {
    // Ignore IndexedDB cleanup error
  } finally {
    closeDatabaseSafely(db);
  }
}

/**
 * Format timestamp into relative or human-readable format.
 */
export function formatDraftTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
