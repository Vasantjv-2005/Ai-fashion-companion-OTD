import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, User, Check, Sparkles } from 'lucide-react';
import { useCloset, type WardrobeFocus } from '../context/ClosetContext';
import { useAuth } from '../hooks/useAuth';
import { getWorkspaceScopeId, resolveWorkspaceScope } from '../utils/authStorage';
import { useFocusTrap } from '../utils/focusTrap';
import { GuestRegistrationPromptModal } from './auth/GuestRegistrationPromptModal';
import {
  loadStoredSettings,
  SETTINGS_UPDATED_EVENT,
  type UserSettings,
} from './ui/SettingsModal';
import {
  formatHeightForStorage,
  formatWeightForStorage,
  normalizeHeightForSystem,
  normalizeWeightForSystem,
  parseHeightPrefill,
  parseWeightPrefill,
  validateOptionalHeight,
  validateOptionalWeight,
} from '../utils/measurementUtils';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PROFILE_BODY_SHAPES = [
  'Athletic / V-Taper',
  'Lean / Slim',
  'Broad / Structured',
  'Balanced / Regular',
] as const;

const PROFILE_STYLE_PERSONAS = [
  'Clean Minimalist',
  'Old Money Heritage',
  'Smart Sartorial',
  'Relaxed Contemporary',
  'Quiet Luxury',
  'Streetwear Chic',
  'Evening Haute',
  'Capsule Modular',
] as const;

const PROFILE_FIT_OPTIONS = [
  'Tailored / Slim',
  'Regular Classic',
  'Relaxed / Drape',
] as const;

function normalizeProfileBodyShape(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (trimmed === 'Broad / Regular') return 'Balanced / Regular';
  return trimmed;
}

function normalizeProfileFit(raw?: string): string {
  const token = (raw || '').trim().toLowerCase();
  if (!token) return 'Regular Classic';
  if (token.includes('slim') || token === 'tailored') return 'Tailored / Slim';
  if (token.includes('relaxed') || token.includes('drape') || token.includes('loose')) {
    return 'Relaxed / Drape';
  }
  return 'Regular Classic';
}

const UserProfileModalDialog: React.FC<Omit<UserProfileModalProps, 'isOpen'>> = ({ onClose }) => {
  const { isAuthenticated } = useAuth();
  const { profile, updateProfile } = useCloset();
  const initialUnitSystem = loadStoredSettings().measurementUnit;
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(initialUnitSystem);
  const [name, setName] = useState(profile.name);
  const [wardrobeFocus, setWardrobeFocus] = useState<WardrobeFocus>(profile.wardrobeFocus || 'personalize');
  const [height, setHeight] = useState(() =>
    parseHeightPrefill(normalizeHeightForSystem(profile.height, initialUnitSystem), initialUnitSystem).value
  );
  const [weight, setWeight] = useState(() =>
    parseWeightPrefill(normalizeWeightForSystem(profile.weight, initialUnitSystem), initialUnitSystem).value
  );
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [bodyShape, setBodyShape] = useState(normalizeProfileBodyShape(profile.bodyShape));
  const [selectedStyles, setSelectedStyles] = useState<string[]>(profile.stylePersonas);
  const [fit, setFit] = useState(normalizeProfileFit(profile.preferredFit));
  const [saved, setSaved] = useState(false);
  const [isGuestPromptOpen, setIsGuestPromptOpen] = useState(false);

  useEffect(() => {
    const onSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<UserSettings>).detail;
      const nextSystem = detail?.measurementUnit || loadStoredSettings().measurementUnit;
      setUnitSystem((prevSystem) => {
        if (prevSystem === nextSystem) return prevSystem;
        setHeight((curr) =>
          curr.trim()
            ? parseHeightPrefill(normalizeHeightForSystem(curr, nextSystem), nextSystem).value
            : curr
        );
        setWeight((curr) =>
          curr.trim()
            ? parseWeightPrefill(
                normalizeWeightForSystem(
                  /\b(kg|lbs?)\b/i.test(curr) ? curr : `${curr} ${prevSystem === 'imperial' ? 'lbs' : 'kg'}`,
                  nextSystem
                ),
                nextSystem
              ).value
            : curr
        );
        setHeightError(null);
        setWeightError(null);
        return nextSystem;
      });
    };
    window.addEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);
  }, []);

  const isMountedRef = useRef(true);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, []);

  // Focus trap, restoration & Escape key dismiss (paused while sibling guest registration modal is open)
  const isActiveGuestPromptOpen = !isAuthenticated && isGuestPromptOpen;
  const handleCloseGuestPrompt = useCallback(() => {
    setIsGuestPromptOpen(false);
  }, []);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: true,
    isPaused: isActiveGuestPromptOpen,
    onClose,
  });

  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      if (selectedStyles.length > 1) {
        setSelectedStyles(selectedStyles.filter((s) => s !== style));
      }
    } else if (selectedStyles.length < 3) {
      setSelectedStyles([...selectedStyles, style]);
    } else {
      setSelectedStyles([...selectedStyles.slice(1), style]);
    }
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      setIsGuestPromptOpen(true);
      return;
    }

    const activeHeightUnit = unitSystem === 'imperial' ? 'ft' : 'cm';
    const activeWeightUnit = unitSystem === 'imperial' ? 'lbs' : 'kg';
    const nextHeightError = validateOptionalHeight(height, activeHeightUnit);
    const nextWeightError = validateOptionalWeight(weight, activeWeightUnit);
    setHeightError(nextHeightError);
    setWeightError(nextWeightError);
    if (nextHeightError || nextWeightError) {
      return;
    }

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    updateProfile({
      name,
      wardrobeFocus,
      height: formatHeightForStorage(height, activeHeightUnit),
      weight: formatWeightForStorage(weight, activeWeightUnit),
      bodyShape,
      stylePersonas: selectedStyles,
      preferredFit: fit
    });
    setSaved(true);
    saveTimerRef.current = window.setTimeout(() => {
      saveTimerRef.current = null;
      if (!isMountedRef.current) return;
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={isActiveGuestPromptOpen ? true : undefined}
        aria-labelledby="user-profile-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
        onClick={(e) => {
          if (!isActiveGuestPromptOpen && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg glass-card rounded-3xl p-4 sm:p-8 border border-[var(--border-gold)] shadow-2xl bg-[var(--bg-card-elevated)] text-[var(--text-body)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 id="user-profile-title" className="font-serif-luxury text-2xl font-bold text-[var(--text-heading)]">
              Your Style DNA & Profile
            </h3>
            <p className="text-xs text-[var(--text-muted)] font-medium">Calibrate your personal styling rules for OTD</p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="mb-5 p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)]/50 text-xs text-[var(--text-body)]">
            <span className="font-semibold text-[var(--gold-primary)]">Guest Demo Preview:</span>{' '}
            Explore how Style DNA calibration works below. Create a free account or sign in to save your profile preferences.
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-5 text-xs">
          
          {/* Wardrobe Styling Focus (Women / Men / Personalize) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Wardrobe Styling Focus
              </span>
              <span className="text-[10px] text-[var(--gold-primary)] font-mono">Editable Anytime</span>
            </div>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2">
              {[
                { id: 'women' as const, label: 'Women', badge: 'Capsule & Fluid', icon: '👗' },
                { id: 'men' as const, label: 'Men', badge: 'Sartorial & Tailored', icon: '👔' },
                { id: 'personalize' as const, label: 'Personalize', badge: 'Mixed / Fluid', icon: '✦' },
              ].map(opt => {
                const isSelected = wardrobeFocus === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setWardrobeFocus(opt.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                      isSelected
                        ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] text-[var(--text-heading)] ring-1 ring-[var(--gold-primary)] shadow-sm'
                        : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] text-[var(--text-body)] hover:border-[var(--gold-primary)]'
                    }`}
                  >
                    <span className="text-xl">{opt.icon}</span>
                    <span className="font-semibold text-xs text-[var(--text-heading)] flex items-center gap-1">
                      {isSelected && <Check className="w-3 h-3 text-[var(--gold-dark)] dark:text-[var(--gold-primary)] stroke-[3]" />}
                      <span>{opt.label}</span>
                    </span>
                    <span className="text-[9px] font-mono text-[var(--gold-dark)] dark:text-[var(--gold-primary)] tracking-tight font-semibold">
                      {opt.badge}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-snug">
              Calibrates your default closet categories, sizing formulas, and silhouette proportion guides.
            </p>
          </div>

          {/* Biometrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-3">
              <label
                htmlFor="profile-name-input"
                className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1"
              >
                Preferred Name
              </label>
              <input
                id="profile-name-input"
                type="text"
                maxLength={100}
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full min-w-0 bg-[var(--bg-card-inner)] border border-[var(--border-card)] rounded-xl px-3 py-2.5 text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] font-medium"
              />
            </div>
            <div className="sm:col-span-1 min-[360px]:col-span-1">
              <label
                htmlFor="profile-height-input"
                className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1"
              >
                Height ({unitSystem === 'imperial' ? 'ft/in' : 'cm'})
              </label>
              <input
                id="profile-height-input"
                type="text"
                maxLength={20}
                value={height}
                placeholder={unitSystem === 'imperial' ? `e.g. 5'10"` : 'e.g. 178 cm'}
                onChange={(e) => {
                  setHeight(e.target.value);
                  if (heightError) setHeightError(null);
                }}
                aria-invalid={Boolean(heightError)}
                className={`w-full min-w-0 bg-[var(--bg-card-inner)] border rounded-xl px-3 py-2.5 text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] font-medium ${
                  heightError
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                }`}
              />
              {heightError && (
                <p className="text-[10px] text-rose-500 font-medium mt-1 leading-snug">{heightError}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="profile-weight-input"
                className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-1"
              >
                Weight ({unitSystem === 'imperial' ? 'lbs' : 'kg'}) <span className="font-normal opacity-75">· Optional</span>
              </label>
              <input
                id="profile-weight-input"
                type="text"
                maxLength={20}
                value={weight}
                placeholder={unitSystem === 'imperial' ? 'e.g. 154 lbs' : 'e.g. 70 kg'}
                onChange={(e) => {
                  setWeight(e.target.value);
                  if (weightError) setWeightError(null);
                }}
                aria-invalid={Boolean(weightError)}
                className={`w-full min-w-0 bg-[var(--bg-card-inner)] border rounded-xl px-3 py-2.5 text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] font-medium ${
                  weightError
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                }`}
              />
              {weightError && (
                <p className="text-[10px] text-rose-500 font-medium mt-1 leading-snug">{weightError}</p>
              )}
            </div>
          </div>

          {/* Body Shape */}
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
              Body Silhouette
            </span>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2">
              {PROFILE_BODY_SHAPES.map(shape => (
                <button
                  key={shape}
                  type="button"
                  aria-pressed={bodyShape === shape}
                  onClick={() => setBodyShape(shape)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                    bodyShape === shape
                      ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] text-[var(--text-heading)] ring-1 ring-[var(--gold-primary)] font-semibold'
                      : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] text-[var(--text-body)] hover:border-[var(--gold-primary)]'
                  }`}
                >
                  {bodyShape === shape && <Check className="w-3 h-3 text-[var(--gold-dark)] dark:text-[var(--gold-primary)] stroke-[3] shrink-0" />}
                  <span>{shape}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Style Personas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Personal Style DNA (Choose 1–3)
              </span>
              <span className="text-[10px] text-[var(--gold-dark)] dark:text-[var(--gold-primary)] font-mono font-semibold">
                {selectedStyles.length}/3 selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROFILE_STYLE_PERSONAS.map(style => {
                const isSelected = selectedStyles.includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggleStyle(style)}
                    className={`px-3 py-2 rounded-full border text-xs transition-all cursor-pointer flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                      isSelected
                        ? 'border-[var(--gold-dark)] bg-[var(--gold-dark)] text-white dark:border-[var(--gold-primary)] dark:bg-[var(--gold-primary)] dark:text-black font-semibold shadow-xs ring-1 ring-[var(--gold-primary)]'
                        : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] text-[var(--text-body)] hover:border-[var(--gold-primary)]'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    <span>{style}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fit Preferences */}
          <div>
            <span className="block text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-2">
              Preferred Silhouette Fit
            </span>
            <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2">
              {PROFILE_FIT_OPTIONS.map(fitOption => (
                <button
                  key={fitOption}
                  type="button"
                  aria-pressed={fit === fitOption}
                  onClick={() => setFit(fitOption)}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                    fit === fitOption
                      ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] text-[var(--text-heading)] ring-1 ring-[var(--gold-primary)] font-semibold'
                      : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] text-[var(--text-body)] hover:border-[var(--gold-primary)]'
                  }`}
                >
                  {fit === fitOption && <Check className="w-3 h-3 text-[var(--gold-dark)] dark:text-[var(--gold-primary)] stroke-[3] shrink-0" />}
                  <span>{fitOption}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1">
            Privacy: In this preview, profile preferences stay in your browser&apos;s local workspace storage and sync only to your OTD account when cloud sync is active. You can edit or clear them anytime in Settings.
          </p>

        </div>

        {/* Action Button */}
        <div className="mt-8 pt-4 border-t border-[var(--border-card)]">
          <button
            type="button"
            onClick={handleSave}
            className="gold-btn w-full py-3.5 rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300 dark:text-emerald-700 stroke-[3]" />
                <span>Profile Calibrated & Saved!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Style Preferences</span>
              </>
            )}
          </button>
        </div>
        </div>
      </div>

      <GuestRegistrationPromptModal
        isOpen={isActiveGuestPromptOpen}
        action="profile"
        redirectTo="/profile"
        onClose={handleCloseGuestPrompt}
      />
    </>
  );
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { status, user } = useAuth();
  if (!isOpen) return null;

  const workspaceScopeId = getWorkspaceScopeId(resolveWorkspaceScope(status, user?.id));
  return <UserProfileModalDialog key={workspaceScopeId} onClose={onClose} />;
};
