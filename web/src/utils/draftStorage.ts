/**
 * Native IndexedDB Draft Storage for OTD Wardrobe Intake.
 *
 * Provides safe, persistent storage for in-progress garment drafts,
 * including high-resolution downscaled images that would otherwise exceed
 * the browser's ~5MB localStorage quota.
 *
 * Zero external dependencies. Gracefully falls back to metadata storage
 * if IndexedDB is unavailable or restricted.
 */

import type { GarmentDraft } from '../components/ClosetUploadView';

const DB_NAME = 'otd_intake_db';
const DB_VERSION = 1;
const STORE_NAME = 'garment_drafts';
const ACTIVE_DRAFT_KEY = 'active_intake_session';
const LOCAL_STORAGE_FALLBACK_KEY = 'otd_intake_draft_fallback';

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

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Failed to open draft database.'));
  });
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
 * Save the current upload session to IndexedDB with localStorage fallback.
 * Returns information on which storage engine was used and whether photos were preserved.
 */
export async function saveDraftSession(
  drafts: GarmentDraft[],
  stage: 'select' | 'camera' | 'library' | 'form',
  activeDraftIndex = 0
): Promise<{ storageEngine: 'indexeddb' | 'localstorage_fallback'; imagesPreserved: boolean }> {
  if (!drafts || drafts.length === 0) {
    await clearDraftSession();
    return { storageEngine: 'indexeddb', imagesPreserved: true };
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

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(sessionData, ACTIVE_DRAFT_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.onabort = () => reject(transaction.error);
    });

    // Clear any stale fallback data since primary IndexedDB succeeded
    try {
      localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY);
    } catch {
      // ignore
    }

    return { storageEngine: 'indexeddb', imagesPreserved: true };
  } catch (idbError) {
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
      localStorage.setItem(LOCAL_STORAGE_FALLBACK_KEY, JSON.stringify(fallbackSession));
      return { storageEngine: 'localstorage_fallback', imagesPreserved: !anyImageOmitted };
    } catch (lsError) {
      console.error('All draft storage engines failed:', lsError);
      throw new Error('STORAGE_QUOTA_EXCEEDED');
    }
  }
}

/**
 * Load any existing recoverable draft session.
 */
export async function loadDraftSession(): Promise<DraftSessionData | null> {
  // Try IndexedDB first if not simulated as disabled
  if (!simulateIndexedDBFailure) {
    try {
      const db = await openDatabase();
      const idbResult = await new Promise<DraftSessionData | null>((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(ACTIVE_DRAFT_KEY);

        request.onsuccess = () => {
          const result = request.result as DraftSessionData | undefined;
          resolve(result && Array.isArray(result.drafts) && result.drafts.length > 0 ? result : null);
        };
        request.onerror = () => reject(request.error);
      });

      if (idbResult) {
        return {
          ...idbResult,
          storageEngine: 'indexeddb',
          imagesPreserved: true,
        };
      }
    } catch (idbError) {
      console.warn('Could not read from IndexedDB, checking localStorage fallback:', idbError);
    }
  }

  // Fallback to localStorage
  try {
    const fallback = localStorage.getItem(LOCAL_STORAGE_FALLBACK_KEY);
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
 * Clear the draft session from all storage engines upon successful save or explicit discard.
 */
export async function clearDraftSession(): Promise<void> {
  try {
    localStorage.removeItem(LOCAL_STORAGE_FALLBACK_KEY);
  } catch {
    // Ignore localStorage cleanup error
  }

  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(ACTIVE_DRAFT_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Ignore IndexedDB cleanup error
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
