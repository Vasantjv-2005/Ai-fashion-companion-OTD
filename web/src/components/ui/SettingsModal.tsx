import React, { useEffect, useRef, useState } from 'react';
import { X, Moon, Sun, Ruler, Bell, RotateCcw, LogOut, Check, Sliders, AlertTriangle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import {
  clearAllOtdWorkspaceStorage,
  waitForPendingPrivateDraftPurge,
} from '../../utils/authStorage';
import { clearAllDraftSessions } from '../../utils/draftStorage';
import { useFocusTrap } from '../../utils/focusTrap';

export interface UserSettings {
  measurementUnit: 'metric' | 'imperial';
  notifyWeather: boolean;
  notifyOccasions: boolean;
  notifySuggestions: boolean;
}

const SETTINGS_STORAGE_KEY = 'otd_user_settings';
export const SETTINGS_UPDATED_EVENT = 'otd:settings-updated';

const DEFAULT_SETTINGS: UserSettings = {
  measurementUnit: 'metric',
  notifyWeather: true,
  notifyOccasions: true,
  notifySuggestions: true,
};

export function loadStoredSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        measurementUnit: parsed.measurementUnit === 'imperial' ? 'imperial' : 'metric',
        notifyWeather: typeof parsed.notifyWeather === 'boolean' ? parsed.notifyWeather : true,
        notifyOccasions: typeof parsed.notifyOccasions === 'boolean' ? parsed.notifyOccasions : true,
        notifySuggestions: typeof parsed.notifySuggestions === 'boolean' ? parsed.notifySuggestions : true,
      };
    }
  } catch (err) {
    console.warn('Failed to parse otd_user_settings from localStorage:', err);
  }
  return DEFAULT_SETTINGS;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut?: () => Promise<void> | void;
  signOutLabel?: string;
}

const SettingsModalDialog: React.FC<Omit<SettingsModalProps, 'isOpen'>> = ({
  onClose,
  onSignOut,
  signOutLabel = 'Sign Out',
}) => {
  const { theme, toggleTheme } = useTheme();
  const initialSettings = loadStoredSettings();
  const [measurementUnit, setMeasurementUnit] = useState<'metric' | 'imperial'>(initialSettings.measurementUnit);
  const [notifyWeather, setNotifyWeather] = useState(initialSettings.notifyWeather);
  const [notifyOccasions, setNotifyOccasions] = useState(initialSettings.notifyOccasions);
  const [notifySuggestions, setNotifySuggestions] = useState(initialSettings.notifySuggestions);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const isMountedRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);
  const reloadTimerRef = useRef<number | null>(null);
  const deleteFallbackTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      if (reloadTimerRef.current !== null) {
        window.clearTimeout(reloadTimerRef.current);
        reloadTimerRef.current = null;
      }
      if (deleteFallbackTimerRef.current !== null) {
        window.clearTimeout(deleteFallbackTimerRef.current);
        deleteFallbackTimerRef.current = null;
      }
    };
  }, []);

  // Focus trap, restoration & Escape key dismissal with confirmation shield
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: true,
    onClose: () => {
      if (isResetting) return;
      if (isResetConfirmOpen) {
        setIsResetConfirmOpen(false);
      } else {
        onClose();
      }
    },
  });

  const handleExecuteReset = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      // 1. Purge all OTD-owned client-side storage keys explicitly (preserve otd_theme and unrelated storage)
      clearAllOtdWorkspaceStorage({ includeSettings: true });

      // 2. Wait for any queued private IndexedDB draft purge before clearing or deleting the DB
      await waitForPendingPrivateDraftPurge();

      // 3. Clear IndexedDB wardrobe drafts via draftStorage without re-creating a missing DB
      await clearAllDraftSessions();

      // 4. Delete native IndexedDB database with explicit event status monitoring
      let idbStatus: 'cleared' | 'blocked' | 'failed' = 'cleared';
      if ('indexedDB' in window && window.indexedDB) {
        idbStatus = await new Promise<'cleared' | 'blocked' | 'failed'>((resolve) => {
          let settled = false;
          const finish = (status: 'cleared' | 'blocked' | 'failed') => {
            if (settled) return;
            settled = true;
            if (deleteFallbackTimerRef.current !== null) {
              window.clearTimeout(deleteFallbackTimerRef.current);
              deleteFallbackTimerRef.current = null;
            }
            resolve(status);
          };

          try {
            const req = window.indexedDB.deleteDatabase('otd_intake_db');
            req.onsuccess = () => finish('cleared');
            req.onerror = () => {
              console.warn('IndexedDB deletion error:', req.error);
              finish('failed');
            };
            req.onblocked = () => {
              console.warn('IndexedDB deletion blocked by an open connection in another tab.');
              finish('blocked');
            };
            // Fallback timeout in case browser does not dispatch event
            deleteFallbackTimerRef.current = window.setTimeout(() => finish('cleared'), 600);
          } catch (idbErr) {
            console.warn('Error initiating IndexedDB deletion:', idbErr);
            finish('failed');
          }
        });
      }

      if (!isMountedRef.current) return;

      // Honest advisory feedback without falsely reporting success
      if (idbStatus === 'blocked') {
        setStatusMessage('Local data cleared. Notice: IndexedDB deletion is blocked by another tab and will complete when closed. Reloading defaults...');
      } else if (idbStatus === 'failed') {
        setStatusMessage('Local storage reset. Notice: IndexedDB could not be fully deleted. Reloading defaults...');
      } else {
        setStatusMessage('All wardrobe, profile, and draft caches cleared. Reloading defaults...');
      }

      reloadTimerRef.current = window.setTimeout(() => {
        reloadTimerRef.current = null;
        if (!isMountedRef.current) return;
        window.location.reload();
      }, 1100);
    } catch (err) {
      console.error('Reset cache error:', err);
      if (!isMountedRef.current) return;
      setStatusMessage('Notice: Cache reset encountered an unexpected issue. Reloading defaults...');
      reloadTimerRef.current = window.setTimeout(() => {
        reloadTimerRef.current = null;
        if (!isMountedRef.current) return;
        window.location.reload();
      }, 1100);
    }
  };

  const handleSave = () => {
    const toSave: UserSettings = {
      measurementUnit,
      notifyWeather,
      notifyOccasions,
      notifySuggestions,
    };
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(toSave));
      window.dispatchEvent(new CustomEvent<UserSettings>(SETTINGS_UPDATED_EVENT, { detail: toSave }));
      setStatusMessage('Preferences saved successfully.');
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        if (!isMountedRef.current) return;
        setStatusMessage(null);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Failed to save settings to localStorage:', err);
      setStatusMessage('Error writing settings to local storage.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          if (isResetting) return;
          if (isResetConfirmOpen) {
            setIsResetConfirmOpen(false);
            return;
          }
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] shadow-2xl p-6 sm:p-7 text-[var(--text-body)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-card)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="font-playfair text-xl font-bold text-[var(--text-heading)]">
                Studio Settings
              </h3>
              <p className="text-xs text-[var(--text-muted)]">
                Calibrate appearance, smart alerts, and account preferences
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--pill-bg)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message banner */}
        {statusMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <Check className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Settings options list */}
        <div className="py-4 space-y-5 text-xs max-h-[60vh] overflow-y-auto pr-1">
          {/* Appearance / Theme */}
          <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-2.5">
            <div className="min-w-0">
              <h4 className="font-semibold text-[var(--text-heading)] text-sm">
                Appearance Mode
              </h4>
              <p className="text-[11px] text-[var(--text-muted)]">
                Toggle between Haute Light and Obsidian Dark luxury themes
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="self-start min-[380px]:self-auto shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] hover:border-[var(--gold-primary)] text-xs font-semibold cursor-pointer transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span>Dark Theme</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Theme</span>
                </>
              )}
            </button>
          </div>

          {/* Measurement Units */}
          <div className="flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-2.5 pt-3 border-t border-[var(--border-card)]">
            <div className="min-w-0">
              <h4 className="font-semibold text-[var(--text-heading)] text-sm flex items-center gap-1.5">
                <Ruler className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Measurement Units</span>
              </h4>
              <p className="text-[11px] text-[var(--text-muted)]">
                Used for garment dimensions and style avatar calibration
              </p>
            </div>
            <div className="self-start min-[420px]:self-auto inline-flex flex-wrap rounded-xl p-0.5 border border-[var(--border-card)] bg-[var(--pill-bg)] shrink-0">
              <button
                type="button"
                aria-pressed={measurementUnit === 'metric'}
                onClick={() => setMeasurementUnit('metric')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  measurementUnit === 'metric'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Metric (cm/kg)
              </button>
              <button
                type="button"
                aria-pressed={measurementUnit === 'imperial'}
                onClick={() => setMeasurementUnit('imperial')}
                className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  measurementUnit === 'imperial'
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                Imperial (ft/lbs)
              </button>
            </div>
          </div>

          {/* Smart Alerts & Notification Preferences */}
          <div className="space-y-3 pt-3 border-t border-[var(--border-card)]">
            <h4 className="font-semibold text-[var(--text-heading)] text-sm flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-[var(--gold-primary)]" />
              <span>Smart Alerts & Notifications</span>
            </h4>
            <div className="space-y-2">
              <label htmlFor="settings-notify-weather" className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-[var(--text-body)]">Weather & climate adaptation alerts</span>
                <input
                  id="settings-notify-weather"
                  type="checkbox"
                  checked={notifyWeather}
                  onChange={(e) => setNotifyWeather(e.target.checked)}
                  className="rounded text-[var(--gold-primary)] focus:ring-[var(--gold-primary)] cursor-pointer"
                />
              </label>
              <label htmlFor="settings-notify-occasions" className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-[var(--text-body)]">Upcoming occasion outfit reminders</span>
                <input
                  id="settings-notify-occasions"
                  type="checkbox"
                  checked={notifyOccasions}
                  onChange={(e) => setNotifyOccasions(e.target.checked)}
                  className="rounded text-[var(--gold-primary)] focus:ring-[var(--gold-primary)] cursor-pointer"
                />
              </label>
              <label htmlFor="settings-notify-suggestions" className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-[var(--text-body)]">Wardrobe synergy & recommendation tips</span>
                <input
                  id="settings-notify-suggestions"
                  type="checkbox"
                  checked={notifySuggestions}
                  onChange={(e) => setNotifySuggestions(e.target.checked)}
                  className="rounded text-[var(--gold-primary)] focus:ring-[var(--gold-primary)] cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Data Reset & Cache Cleanup */}
          <div className="pt-3 border-t border-[var(--border-card)] space-y-3">
            <div className="flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <h4 className="font-semibold text-[var(--text-heading)] text-sm">
                  Reset Local Data
                </h4>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Purge local wardrobe items, saved looks, and drafts
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(!isResetConfirmOpen)}
                className="self-start min-[380px]:self-auto shrink-0 px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cache</span>
              </button>
            </div>

            {/* Explicit Confirmation Dialog Box */}
            {isResetConfirmOpen && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs space-y-3 animate-in fade-in duration-150">
                <div className="flex items-start gap-2 text-rose-800 dark:text-rose-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="space-y-1">
                    <p className="font-bold">Are you sure you want to reset your local data?</p>
                    <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                      This will permanently delete your locally added wardrobe garments, user biometrics, shopping list entries, saved looks, and in-progress upload drafts. Default sample items will be restored. Your appearance theme is preserved.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsResetConfirmOpen(false)}
                    className="px-3 py-1.5 rounded-xl border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isResetting}
                    onClick={handleExecuteReset}
                    className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {isResetting ? 'Resetting...' : 'Confirm Reset & Reload'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-4 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
          {onSignOut ? (
            <button
              type="button"
              disabled={isSigningOut}
              onClick={async () => {
                if (isSigningOut) return;
                setIsSigningOut(true);
                try {
                  await onSignOut();
                } finally {
                  if (isMountedRef.current) {
                    setIsSigningOut(false);
                  }
                }
              }}
              className="text-xs font-bold text-[var(--text-muted)] hover:text-rose-600 flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isSigningOut ? 'Signing Out...' : signOutLabel}</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex flex-wrap gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-md"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSignOut,
  signOutLabel,
}) => {
  if (!isOpen) return null;
  return (
    <SettingsModalDialog
      onClose={onClose}
      onSignOut={onSignOut}
      signOutLabel={signOutLabel}
    />
  );
};
