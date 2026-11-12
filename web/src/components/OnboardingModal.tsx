import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  X,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  User,
  Ruler,
  Scale,
  Camera,
  Upload,
  Trash2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useCloset, type WardrobeFocus } from '../context/ClosetContext';
import { useAuth } from '../hooks/useAuth';
import { getWorkspaceScopeId, resolveWorkspaceScope } from '../utils/authStorage';
import { useFocusTrap } from '../utils/focusTrap';
import { loadStoredSettings, SETTINGS_UPDATED_EVENT, type UserSettings } from './ui/SettingsModal';
import {
  convertHeightValue,
  convertWeightValue,
  formatHeightForStorage,
  formatWeightForStorage,
  normalizeHeightForSystem,
  normalizeWeightForSystem,
  parseHeightPrefill,
  parseWeightPrefill,
  validateOptionalHeight,
  validateOptionalWeight,
  type HeightUnit,
  type WeightUnit,
} from '../utils/measurementUtils';
import {
  ACCEPTED_GARMENT_IMAGE_ACCEPT,
  validateGarmentImageFile,
} from '../utils/garmentValidation';
import {
  GuestRegistrationPromptModal,
  type GuestRestrictedAction,
} from './auth/GuestRegistrationPromptModal';

export interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (destination?: 'closet' | 'home') => void;
}

const FIT_OPTIONS = [
  { id: 'Tailored / Slim', label: 'Tailored / Slim', sub: 'Clean contour' },
  { id: 'Regular Classic', label: 'Regular Classic', sub: 'Balanced comfort' },
  { id: 'Relaxed / Drape', label: 'Relaxed / Drape', sub: 'Contemporary ease' },
] as const;

const BODY_SHAPE_OPTIONS = [
  { id: 'Athletic / V-Taper', label: 'Athletic / V-Taper', sub: 'Broader shoulders' },
  { id: 'Lean / Slim', label: 'Lean / Slim', sub: 'Linear silhouette' },
  { id: 'Broad / Structured', label: 'Broad / Structured', sub: 'Substantial frame' },
  { id: 'Balanced / Regular', label: 'Balanced / Regular', sub: 'Proportional drape' },
] as const;

const STYLE_PERSONA_OPTIONS = [
  'Clean Minimalist',
  'Old Money Heritage',
  'Smart Sartorial',
  'Relaxed Contemporary',
  'Quiet Luxury',
  'Streetwear Chic',
  'Evening Haute',
  'Capsule Modular',
] as const;

function normalizeFitPreference(raw?: string): string {
  const token = (raw || '').trim().toLowerCase();
  if (!token) return 'Regular Classic';
  if (token.includes('slim') || token === 'tailored') return 'Tailored / Slim';
  if (token.includes('relaxed') || token.includes('drape') || token.includes('loose')) {
    return 'Relaxed / Drape';
  }
  return 'Regular Classic';
}

function normalizeBodyShape(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (trimmed === 'Broad / Regular') return 'Balanced / Regular';
  return trimmed;
}

const OnboardingModalDialog: React.FC<Omit<OnboardingModalProps, 'isOpen'>> = ({
  onClose,
  onComplete,
}) => {
  const { isAuthenticated, enterGuestMode } = useAuth();
  const { profile, updateProfile } = useCloset();
  const [guestPromptAction, setGuestPromptAction] = useState<GuestRestrictedAction | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const activeReaderRef = useRef<FileReader | null>(null);
  const photoRequestIdRef = useRef<number>(0);

  // Stepper state: 1 (Style Focus), 2 (Measurements - Optional), 3 (Avatar Setup - Optional)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Step 1: Basic Style Profile
  const [fullName, setFullName] = useState<string>(
    profile.name && profile.name !== 'Curator' ? profile.name : ''
  );
  const [nameError, setNameError] = useState<string | null>(null);
  const [wardrobeFocus, setWardrobeFocus] = useState<WardrobeFocus>(
    profile.wardrobeFocus || 'personalize'
  );
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    profile.stylePersonas?.length
      ? profile.stylePersonas
      : ['Clean Minimalist', 'Smart Sartorial']
  );

  // Step 2: Optional Measurements & Silhouette
  const preferredUnitSystem = loadStoredSettings().measurementUnit;
  const initialHeight = parseHeightPrefill(
    normalizeHeightForSystem(profile.height, preferredUnitSystem),
    preferredUnitSystem,
  );
  const initialWeight = parseWeightPrefill(
    normalizeWeightForSystem(profile.weight, preferredUnitSystem),
    preferredUnitSystem,
  );
  const [heightValue, setHeightValue] = useState<string>(initialHeight.value);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(initialHeight.unit);
  const [weightValue, setWeightValue] = useState<string>(initialWeight.value);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(initialWeight.unit);
  const [heightError, setHeightError] = useState<string | null>(null);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [bodyShape, setBodyShape] = useState<string>(normalizeBodyShape(profile.bodyShape));
  const [fitPreference, setFitPreference] = useState<string>(
    normalizeFitPreference(profile.preferredFit)
  );
  const [selectedColours, setSelectedColours] = useState<string[]>(
    profile.palettePreferences?.length
      ? profile.palettePreferences
      : ['Black', 'Ivory', 'Camel']
  );

  // Sync Onboarding measurement units when SettingsModal dispatches updated unit preference
  useEffect(() => {
    const onSettingsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<UserSettings>).detail;
      const nextSystem = detail?.measurementUnit || loadStoredSettings().measurementUnit;
      const nextHeightUnit: HeightUnit = nextSystem === 'imperial' ? 'ft' : 'cm';
      const nextWeightUnit: WeightUnit = nextSystem === 'imperial' ? 'lbs' : 'kg';
      setHeightUnit((prevUnit) => {
        if (prevUnit !== nextHeightUnit) {
          setHeightValue((curr) => convertHeightValue(curr, prevUnit, nextHeightUnit));
          setHeightError(null);
        }
        return nextHeightUnit;
      });
      setWeightUnit((prevUnit) => {
        if (prevUnit !== nextWeightUnit) {
          setWeightValue((curr) => convertWeightValue(curr, prevUnit, nextWeightUnit));
          setWeightError(null);
        }
        return nextWeightUnit;
      });
    };
    window.addEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);
    return () => window.removeEventListener(SETTINGS_UPDATED_EVENT, onSettingsUpdated);
  }, []);

  // Step 3: Optional Avatar Setup
  const [avatarChoice, setAvatarChoice] = useState<'archetype' | 'custom_photo' | 'skipped'>(
    profile.avatarOption || 'archetype'
  );
  const [avatarArchetype, setAvatarArchetype] = useState<string>(
    profile.avatarArchetype || 'classic_tailored'
  );
  const [referencePhotoUrl, setReferencePhotoUrl] = useState<string | null>(
    profile.referencePhotoUrl || null
  );
  const [photoError, setPhotoError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      photoRequestIdRef.current += 1;
      if (activeReaderRef.current) {
        try {
          activeReaderRef.current.abort();
        } catch {
          // Ignore FileReader abort errors
        }
        activeReaderRef.current = null;
      }
    };
  }, []);

  const isGuestPromptOpen = !isAuthenticated && guestPromptAction !== null;
  const handleCloseGuestPrompt = useCallback(() => {
    setGuestPromptAction(null);
  }, []);

  // Focus trap, restoration & Escape key dismiss (paused while sibling guest registration modal is open)
  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: true,
    isPaused: isGuestPromptOpen,
    onClose,
  });

  // Toggle helper for style chips
  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      if (selectedStyles.length > 1) {
        setSelectedStyles(selectedStyles.filter((s) => s !== style));
      }
    } else {
      if (selectedStyles.length < 3) {
        setSelectedStyles([...selectedStyles, style]);
      } else {
        setSelectedStyles([...selectedStyles.slice(1), style]);
      }
    }
  };

  // Toggle helper for color palette
  const toggleColour = (col: string) => {
    if (selectedColours.includes(col)) {
      if (selectedColours.length > 1) {
        setSelectedColours(selectedColours.filter((c) => c !== col));
      }
    } else {
      if (selectedColours.length < 4) {
        setSelectedColours([...selectedColours, col]);
      }
    }
  };

  // Handle optional reference photo upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAuthenticated) {
      e.target.value = '';
      setGuestPromptAction('upload');
      return;
    }

    const validationError = validateGarmentImageFile(file);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }

    if (activeReaderRef.current) {
      try {
        activeReaderRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      activeReaderRef.current = null;
    }

    const requestId = ++photoRequestIdRef.current;
    const reader = new FileReader();
    activeReaderRef.current = reader;

    reader.onload = (ev) => {
      if (activeReaderRef.current === reader) {
        activeReaderRef.current = null;
      }
      if (!isMountedRef.current || photoRequestIdRef.current !== requestId) {
        return;
      }
      if (typeof ev.target?.result === 'string') {
        setReferencePhotoUrl(ev.target.result);
        setAvatarChoice('custom_photo');
      } else {
        setPhotoError('Failed to read image. Please try another file.');
      }
    };
    reader.onerror = () => {
      if (activeReaderRef.current === reader) {
        activeReaderRef.current = null;
      }
      if (!isMountedRef.current || photoRequestIdRef.current !== requestId) {
        return;
      }
      setPhotoError('Failed to read image. Please try another file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    photoRequestIdRef.current += 1;
    if (activeReaderRef.current) {
      try {
        activeReaderRef.current.abort();
      } catch {
        // Ignore abort errors
      }
      activeReaderRef.current = null;
    }
    setReferencePhotoUrl(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setAvatarChoice('archetype');
  };

  // Profile save helper
  const saveProfileData = (overrides?: {
    avatarChoice?: 'archetype' | 'custom_photo' | 'skipped';
  }) => {
    if (!isAuthenticated) return;
    const finalName = fullName.trim() || 'Curator';
    const finalHeight = formatHeightForStorage(heightValue, heightUnit);
    const finalWeight = formatWeightForStorage(weightValue, weightUnit);

    updateProfile({
      name: finalName,
      wardrobeFocus,
      stylePersonas: selectedStyles,
      height: finalHeight,
      weight: finalWeight,
      bodyShape,
      preferredFit: fitPreference,
      palettePreferences: selectedColours,
      avatarOption: overrides?.avatarChoice || avatarChoice,
      avatarArchetype,
      referencePhotoUrl: referencePhotoUrl || undefined,
    });
  };

  // Navigation handlers
  const handleNextFromStep1 = () => {
    if (!fullName.trim()) {
      setNameError('Please enter your preferred name so OTD can personalize your looks.');
      return;
    }
    setNameError(null);
    if (isAuthenticated) {
      saveProfileData();
    }
    setCurrentStep(2);
  };

  const handleSkipMeasurements = () => {
    setHeightError(null);
    setWeightError(null);
    if (isAuthenticated) {
      saveProfileData();
    }
    setCurrentStep(3);
  };

  const handleNextFromStep2 = () => {
    const nextHeightError = validateOptionalHeight(heightValue, heightUnit);
    const nextWeightError = validateOptionalWeight(weightValue, weightUnit);
    setHeightError(nextHeightError);
    setWeightError(nextWeightError);
    if (nextHeightError || nextWeightError) {
      return;
    }
    if (isAuthenticated) {
      saveProfileData();
    }
    setCurrentStep(3);
  };

  const handleSkipAvatar = () => {
    if (!isAuthenticated) {
      setGuestPromptAction('profile');
      return;
    }
    saveProfileData({ avatarChoice: 'skipped' });
    if (onComplete) {
      onComplete('closet');
    } else {
      onClose();
    }
  };

  const handleFinish = () => {
    if (!isAuthenticated) {
      setGuestPromptAction('profile');
      return;
    }
    saveProfileData();
    if (onComplete) {
      onComplete('closet');
    } else {
      onClose();
    }
  };

  const handleSkipDirectlyToCloset = () => {
    if (!isAuthenticated) {
      enterGuestMode();
      if (onComplete) {
        onComplete('closet');
      } else {
        onClose();
      }
      return;
    }
    saveProfileData({ avatarChoice: 'skipped' });
    if (onComplete) {
      onComplete('closet');
    } else {
      onClose();
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-hidden={isGuestPromptOpen ? true : undefined}
        aria-labelledby="onboarding-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        onClick={(e) => {
          if (!isGuestPromptOpen && e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
      <div ref={modalRef} className="relative w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl bg-[var(--bg-card)] text-[var(--text-body)] border border-[var(--border-card)] flex flex-col lg:flex-row my-auto max-h-[94vh]">
        
        {/* Top-Right Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-[var(--pill-bg)] text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close onboarding modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ========================================================================= */}
        {/* LEFT COLUMN: Editorial Brand Presence (Desktop ≥ 1024px) */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex w-72 xl:w-80 bg-[var(--bg-canvas-subtle)] border-r border-[var(--border-card)] p-7 flex-col justify-between shrink-0 select-none">
          <div className="space-y-6">
            
            {/* OTD Official Wordmark & Monogram */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-12 rounded-lg border border-[var(--border-gold)] bg-[#FAF5ED] p-1 flex items-center justify-center shadow-xs">
                <img
                  src="/otd_logo.png"
                  alt="OTD"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-cinzel text-lg font-bold tracking-[0.22em] text-[var(--text-heading)] block leading-none">
                  OTD
                </span>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold-primary)] font-mono font-semibold block mt-1">
                  OUTFIT OF THE DAY
                </span>
              </div>
            </div>

            {/* Editorial Visual Composition */}
            <div className="rounded-2xl overflow-hidden border border-[var(--border-card)] shadow-sm relative aspect-[4/5] bg-neutral-900 group">
              <img
                src={
                  wardrobeFocus === 'women'
                    ? 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
                    : wardrobeFocus === 'men'
                    ? 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80'
                    : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80'
                }
                alt="OTD Style Concierge"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                <span className="text-[10px] font-mono tracking-widest uppercase text-[#E5D5BC]">
                  AI FASHION COMPANION
                </span>
                <p className="font-serif-luxury text-xl font-light leading-tight mt-0.5">
                  Your style. Every place.
                </p>
              </div>
            </div>

            {/* Four Editorial Pillars */}
            <div className="space-y-3 text-xs text-[var(--text-muted)]">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-xs text-[var(--gold-primary)]">
                  🚪
                </span>
                <span className="text-[var(--text-heading)] font-medium">Digital Closet First</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-xs text-[var(--gold-primary)]">
                  ✦
                </span>
                <span className="text-[var(--text-heading)] font-medium">Proportional Silhouette Balancing</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-xs text-[var(--gold-primary)]">
                  📍
                </span>
                <span className="text-[var(--text-heading)] font-medium">Destination & Dress-Code Aware</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-[var(--pill-bg)] border border-[var(--border-card)] flex items-center justify-center text-xs text-[var(--gold-primary)]">
                  🔒
                </span>
                <span className="text-[var(--text-heading)] font-medium">Privacy-First & User Controlled</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-card)] text-[10px] text-[var(--text-muted)] flex items-center justify-between">
            <span>OTD Sartorial Engine v2.4</span>
            <span className="text-[var(--gold-primary)] font-mono">Bespoke</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Interactive Multi-Step Journey Body */}
        {/* ========================================================================= */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto p-5 sm:p-7 md:p-8 bg-[var(--bg-card)]">
          
          {/* Top Bar: Stepper Progress & Fast Skip Link */}
          <div className="pb-5 border-b border-[var(--border-card)]">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-3 pr-9">
              <span className="text-[10px] uppercase font-mono tracking-widest text-[var(--gold-primary)] font-semibold">
                Step {currentStep} of 3 ·{' '}
                {currentStep === 1 && 'Basic Style Focus'}
                {currentStep === 2 && 'Measurements (Optional)'}
                {currentStep === 3 && 'Style Avatar (Optional)'}
              </span>

              {/* Fast Skip Link directly to Digital Closet */}
              <button
                type="button"
                onClick={handleSkipDirectlyToCloset}
                className="text-[11px] font-semibold text-[var(--gold-primary)] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                title="Bypass all remaining setup and open your wardrobe immediately"
              >
                <span>Skip to Closet</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Stepper Indicator Bars */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { step: 1, label: 'Style Focus' },
                { step: 2, label: 'Measurements (Opt)' },
                { step: 3, label: 'Avatar (Opt)' },
              ].map((s) => (
                <div key={s.step} className="space-y-1">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      currentStep === s.step
                        ? 'bg-[var(--gold-primary)]'
                        : currentStep > s.step
                        ? 'bg-black dark:bg-white'
                        : 'bg-[var(--pill-bg)]'
                    }`}
                  />
                  <span
                    className={`text-[9px] uppercase tracking-wider block font-mono ${
                      currentStep === s.step
                        ? 'text-[var(--text-heading)] font-bold'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ======================================================================= */}
          {/* STEP 1: BASIC STYLE PROFILE (Women / Men / Personalize) */}
          {/* ======================================================================= */}
          {currentStep === 1 && (
            <div className="py-5 space-y-6 animate-in fade-in duration-200">
              <div>
                <h2
                  id="onboarding-modal-title"
                  className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[var(--text-heading)] leading-tight"
                >
                  Welcome to OTD.
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-1 font-light">
                  Let's calibrate your personal wardrobe focus. Everything here can be refined or adjusted later.
                </p>
              </div>

              {/* Preferred Name Field */}
              <div className="space-y-1.5">
                <label
                  htmlFor="onboarding-name"
                  className="block text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold"
                >
                  What should OTD call you? <span className="text-[var(--gold-primary)]">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    id="onboarding-name"
                    type="text"
                    maxLength={100}
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    placeholder="e.g. Eleanor or Julian"
                    className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-[var(--bg-card-inner)] border text-xs sm:text-sm text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] font-medium transition-all ${
                      nameError
                        ? 'border-rose-400 focus:border-rose-500 ring-1 ring-rose-200'
                        : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                    }`}
                  />
                </div>
                {nameError && (
                  <p className="text-[11px] text-rose-500 font-medium">{nameError}</p>
                )}
              </div>

              {/* Wardrobe Styling Focus (Women / Men / Personalize) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold">
                    Select Your Wardrobe Styling Focus <span className="text-[var(--gold-primary)]">*</span>
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">
                    Wardrobe Personalization
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'women' as const,
                      title: "Women's Wardrobe",
                      badge: 'Capsule & Fluid',
                      icon: '👗',
                      desc: 'Dresses, skirts, fluid tailoring, blouses, and feminine silhouettes.',
                    },
                    {
                      id: 'men' as const,
                      title: "Men's Wardrobe",
                      badge: 'Sartorial & Structured',
                      icon: '👔',
                      desc: 'Tailored suits, shirts, trousers, casual staples, and modern menswear.',
                    },
                    {
                      id: 'personalize' as const,
                      title: 'Personalize / Fluid',
                      badge: 'Bespoke & Mixed',
                      icon: '✦',
                      desc: 'Cross-category garments, gender-fluid aesthetics, and custom piece curation.',
                    },
                  ].map((card) => {
                    const isSelected = wardrobeFocus === card.id;
                    return (
                      <button
                        key={card.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setWardrobeFocus(card.id)}
                        className={`w-full p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                          isSelected
                            ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] shadow-sm ring-1 ring-[var(--gold-primary)]'
                            : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] hover:border-[var(--border-gold)]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-2xl">{card.icon}</span>
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-all ${
                              isSelected
                                ? 'bg-[var(--gold-primary)] text-black font-bold'
                                : 'border border-[var(--border-card)]'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <h3 className="font-semibold text-xs text-[var(--text-heading)]">
                              {card.title}
                            </h3>
                          </div>
                          <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--gold-dark)] dark:text-[var(--gold-primary)] block font-semibold mb-1">
                            {card.badge}
                          </span>
                          <p className="text-[11px] text-[var(--text-muted)] leading-snug">
                            {card.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[10px] text-[var(--text-muted)] font-light leading-relaxed pt-1">
                  💡 This personalizes default categories and sizing. It is not an exclusive declaration—you can mix categories or change this anytime in Profile Settings.
                </p>
              </div>

              {/* Personal Style Personas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold">
                    Primary Style Personas (Select 1 to 3)
                  </span>
                  <span className="text-[10px] text-[var(--gold-primary)] font-mono">
                    {selectedStyles.length}/3 selected
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STYLE_PERSONA_OPTIONS.map((style) => {
                    const isSelected = selectedStyles.includes(style);
                    return (
                      <button
                        key={style}
                        type="button"
                        onClick={() => toggleStyle(style)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[var(--gold-primary)] text-black shadow-xs font-bold'
                            : 'bg-[var(--bg-card-inner)] border border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--gold-primary)] hover:text-[var(--text-heading)]'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{style}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* STEP 2: OPTIONAL MEASUREMENTS & PROPORTIONS (100% Skippable) */}
          {/* ======================================================================= */}
          {currentStep === 2 && (
            <div className="py-5 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-card)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                      100% Optional
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      Can be added or edited later
                    </span>
                  </div>
                  <h2
                    id="onboarding-modal-title"
                    className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[var(--text-heading)] leading-tight"
                  >
                    Silhouette & Fit Proportions
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleSkipMeasurements}
                  className="text-xs font-semibold text-[var(--gold-primary)] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Skip Measurements →
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed">
                OTD uses golden-ratio proportions (such as balancing 1/3 torso against 2/3 trouser drop) to advise on silhouette draping. If you prefer not to enter measurements now, simply skip.
              </p>

              {/* Height and Weight (Both optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Height */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label
                      htmlFor="onboarding-height"
                      className="text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-1.5"
                    >
                      <Ruler className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                      <span>Height (Optional)</span>
                    </label>
                    <div className="flex bg-[var(--pill-bg)] p-0.5 rounded-lg border border-[var(--border-card)] shrink-0">
                      <button
                        type="button"
                        aria-pressed={heightUnit === 'cm'}
                        onClick={() => {
                          if (heightUnit !== 'cm') {
                            setHeightValue((v) => convertHeightValue(v, heightUnit, 'cm'));
                            setHeightUnit('cm');
                            setHeightError(null);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          heightUnit === 'cm'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        cm
                      </button>
                      <button
                        type="button"
                        aria-pressed={heightUnit === 'ft'}
                        onClick={() => {
                          if (heightUnit !== 'ft') {
                            setHeightValue((v) => convertHeightValue(v, heightUnit, 'ft'));
                            setHeightUnit('ft');
                            setHeightError(null);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          heightUnit === 'ft'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        ft/in
                      </button>
                    </div>
                  </div>
                  <input
                    id="onboarding-height"
                    type="text"
                    maxLength={20}
                    value={heightValue}
                    onChange={(e) => {
                      setHeightValue(e.target.value);
                      if (heightError) setHeightError(null);
                    }}
                    aria-invalid={Boolean(heightError)}
                    placeholder={heightUnit === 'cm' ? 'e.g. 178' : `e.g. 5'10"`}
                    className={`w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-[var(--bg-card-inner)] border text-xs text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                      heightError
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                    }`}
                  />
                  {heightError && (
                    <p className="text-[11px] text-rose-500 font-medium leading-snug">{heightError}</p>
                  )}
                </div>

                {/* Weight */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <label
                      htmlFor="onboarding-weight"
                      className="text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-1.5"
                    >
                      <Scale className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                      <span>Weight (Optional)</span>
                    </label>
                    <div className="flex bg-[var(--pill-bg)] p-0.5 rounded-lg border border-[var(--border-card)] shrink-0">
                      <button
                        type="button"
                        aria-pressed={weightUnit === 'kg'}
                        onClick={() => {
                          if (weightUnit !== 'kg') {
                            setWeightValue((v) => convertWeightValue(v, weightUnit, 'kg'));
                            setWeightUnit('kg');
                            setWeightError(null);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          weightUnit === 'kg'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        kg
                      </button>
                      <button
                        type="button"
                        aria-pressed={weightUnit === 'lbs'}
                        onClick={() => {
                          if (weightUnit !== 'lbs') {
                            setWeightValue((v) => convertWeightValue(v, weightUnit, 'lbs'));
                            setWeightUnit('lbs');
                            setWeightError(null);
                          }
                        }}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          weightUnit === 'lbs'
                            ? 'bg-black text-white dark:bg-white dark:text-black'
                            : 'text-[var(--text-muted)]'
                        }`}
                      >
                        lbs
                      </button>
                    </div>
                  </div>
                  <input
                    id="onboarding-weight"
                    type="text"
                    maxLength={20}
                    value={weightValue}
                    onChange={(e) => {
                      setWeightValue(e.target.value);
                      if (weightError) setWeightError(null);
                    }}
                    aria-invalid={Boolean(weightError)}
                    placeholder={weightUnit === 'kg' ? 'e.g. 68' : 'e.g. 150'}
                    className={`w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-[var(--bg-card-inner)] border text-xs text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                      weightError
                        ? 'border-rose-400 focus:border-rose-500'
                        : 'border-[var(--border-card)] focus:border-[var(--gold-primary)]'
                    }`}
                  />
                  {weightError && (
                    <p className="text-[11px] text-rose-500 font-medium leading-snug">{weightError}</p>
                  )}
                </div>
              </div>

              {/* Body Silhouette Proportions */}
              <div className="space-y-2">
                <span className="block text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold">
                  Silhouette Archetype (Optional)
                </span>
                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {BODY_SHAPE_OPTIONS.map((shape) => {
                    const isSelected = bodyShape === shape.id;
                    return (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => setBodyShape(shape.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] text-[var(--text-heading)] font-semibold'
                            : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:border-[var(--gold-primary)]'
                        }`}
                      >
                        <span className="text-xs font-semibold block text-[var(--text-heading)]">
                          {shape.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                          {shape.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Preferred Fit */}
              <div className="space-y-2">
                <span className="block text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold">
                  Preferred Garment Cut & Fit
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {FIT_OPTIONS.map((fit) => {
                    const isSelected = fitPreference === fit.id;
                    return (
                      <button
                        key={fit.id}
                        type="button"
                        onClick={() => setFitPreference(fit.id)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] text-[var(--text-heading)] font-semibold'
                            : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] text-[var(--text-muted)] hover:border-[var(--gold-primary)]'
                        }`}
                      >
                        <span className="text-xs font-semibold block text-[var(--text-heading)]">
                          {fit.label}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                          {fit.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Palette Preferences */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="block text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold">
                    Palette Preferences (Optional, Choose up to 4)
                  </span>
                  <span className="text-[10px] text-[var(--gold-primary)] font-mono">
                    {selectedColours.length}/4 selected
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Black', hex: '#111113' },
                    { name: 'Ivory', hex: '#FAF5ED' },
                    { name: 'Camel', hex: '#C19A6B' },
                    { name: 'Navy', hex: '#1B263B' },
                    { name: 'Olive', hex: '#556B2F' },
                    { name: 'Charcoal', hex: '#36454F' },
                    { name: 'Burgundy', hex: '#800020' },
                    { name: 'White', hex: '#FFFFFF' },
                  ].map((color) => {
                    const isSelected = selectedColours.includes(color.name);
                    return (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => toggleColour(color.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                          isSelected
                            ? 'bg-[var(--gold-primary)] text-black shadow-xs font-bold'
                            : 'bg-[var(--bg-card-inner)] border border-[var(--border-card)] text-[var(--text-muted)] hover:border-[var(--gold-primary)] hover:text-[var(--text-heading)]'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20 dark:border-white/20 shrink-0"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span>{color.name}</span>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Privacy Notice Box */}
              <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[var(--gold-primary)] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-[var(--text-heading)] block mb-0.5">
                    Privacy Guarantee
                  </strong>
                  Your measurements stay in this workspace&apos;s browser storage for proportional fit math until account cloud sync is active, are never shared with third-party ad networks, and can be edited or cleared anytime in Settings.
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* STEP 3: OPTIONAL AVATAR SETUP (Honest, Transparent & Skippable) */}
          {/* ======================================================================= */}
          {currentStep === 3 && (
            <div className="py-5 space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[var(--border-card)]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20">
                      Optional Visual Preview
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      Phase 1 Preview Mode
                    </span>
                  </div>
                  <h2
                    id="onboarding-modal-title"
                    className="font-serif-luxury text-2xl sm:text-3xl font-bold text-[var(--text-heading)] leading-tight"
                  >
                    Style Avatar Preview
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={handleSkipAvatar}
                  className="text-xs font-semibold text-[var(--gold-primary)] hover:underline self-start sm:self-auto cursor-pointer"
                >
                  Skip Avatar →
                </button>
              </div>

              <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed">
                An avatar helps you preview how garments interact in three dimensions. Real-time 3D neural mesh draping is in development for Phase 2. Choose a clean mannequin archetype today, or skip straight to your digital closet.
              </p>

              {/* Avatar Archetype Choices */}
              <div className="space-y-3">
                <span className="block text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold">
                  Select a Mannequin Archetype (Optional)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'classic_tailored',
                      title: 'Tailored Classic',
                      subtitle: 'Structured shoulders & classic waist drop',
                      icon: '📐',
                    },
                    {
                      id: 'modern_minimal',
                      title: 'Contemporary Minimal',
                      subtitle: 'Softer lines with relaxed silhouette drape',
                      icon: '✦',
                    },
                    {
                      id: 'fluid_editorial',
                      title: 'Fluid Editorial',
                      subtitle: 'Unstructured flow for draped garments',
                      icon: '✨',
                    },
                  ].map((arch) => {
                    const isSelected =
                      avatarChoice === 'archetype' && avatarArchetype === arch.id;
                    return (
                      <button
                        key={arch.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => {
                          setAvatarChoice('archetype');
                          setAvatarArchetype(arch.id);
                        }}
                        className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all duration-200 flex flex-col justify-between space-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                          isSelected
                            ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]'
                            : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] hover:border-[var(--border-gold)]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xl">{arch.icon}</span>
                          {isSelected && (
                            <span className="text-xs text-[var(--gold-primary)] font-bold">
                              ✓ Selected
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-[var(--text-heading)]">
                            {arch.title}
                          </h4>
                          <p className="text-[10px] text-[var(--text-muted)] mt-0.5 leading-snug">
                            {arch.subtitle}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference Photo Upload (Optional) */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase font-mono tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                    <span>Reference Fit or Profile Photo (Optional)</span>
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] font-mono">Max 5MB</span>
                </div>

                {referencePhotoUrl ? (
                  <div className="p-3 rounded-2xl bg-[var(--bg-card-inner)] border border-[var(--border-card)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-[var(--border-gold)] bg-neutral-900">
                        <img
                          src={referencePhotoUrl}
                          alt="Reference preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-[var(--text-heading)] block">
                          Reference Photo Attached
                        </span>
                        <span className="text-[10px] text-emerald-500 font-mono">
                          Stored locally in this browser workspace
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove photo"
                      aria-label="Remove reference photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          setGuestPromptAction('upload');
                          return;
                        }
                        fileInputRef.current?.click();
                      }}
                      className="w-full p-4 rounded-2xl border border-dashed border-[var(--border-card)] hover:border-[var(--gold-primary)] bg-[var(--bg-card-inner)]/50 text-center cursor-pointer transition-colors space-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                    >
                      <Upload className="w-5 h-5 mx-auto text-[var(--gold-primary)]" />
                      <span className="block text-xs font-semibold text-[var(--text-heading)]">
                        Click to upload an optional reference photo
                      </span>
                      <span className="block text-[10px] text-[var(--text-muted)]">
                        PNG, JPEG, or WebP (up to 5MB). This is strictly optional and can be skipped.
                      </span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      aria-label="Upload optional reference photo"
                      accept={ACCEPTED_GARMENT_IMAGE_ACCEPT}
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </>
                )}
                {photoError && (
                  <p className="text-[11px] text-rose-500 font-medium">{photoError}</p>
                )}
              </div>

              {/* Direct Skip Option Card */}
              <button
                type="button"
                aria-pressed={avatarChoice === 'skipped'}
                onClick={() => setAvatarChoice('skipped')}
                className={`w-full p-3.5 rounded-2xl border text-left cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                  avatarChoice === 'skipped'
                    ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]'
                    : 'border-[var(--border-card)] bg-[var(--bg-card-inner)] hover:border-[var(--border-gold)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🧥</span>
                    <span className="text-xs font-semibold text-[var(--text-heading)]">
                      I prefer styling with direct garment flat-lays (No avatar)
                    </span>
                  </div>
                  {avatarChoice === 'skipped' && (
                    <span className="text-xs text-[var(--gold-primary)] font-bold">✓ Selected</span>
                  )}
                </div>
              </button>

              {/* AI Transparency Box */}
              <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[var(--gold-primary)] shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-[var(--text-heading)] block mb-0.5">
                    Transparent Architecture
                  </strong>
                  OTD never fabricates third-party biometric profiles. In this preview, avatar preferences and optional reference photos stay in your browser&apos;s local workspace storage, and sync only to your OTD account when cloud sync is active. You can edit, remove, or use flat-lays anytime.
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* BOTTOM ACTIONS BAR (Back / Skip / Next / Finish) */}
          {/* ======================================================================= */}
          <div className="pt-5 border-t border-[var(--border-card)] flex flex-wrap items-center justify-between gap-3">
            {/* Left Button: Back or Skip to Closet */}
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-4 py-2.5 rounded-full border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkipDirectlyToCloset}
                className="text-xs font-semibold text-[var(--gold-primary)] hover:underline cursor-pointer"
              >
                Skip Setup & Open Closet →
              </button>
            )}

            {/* Right Buttons: Skip Step / Next / Finish */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 ml-auto">
              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span>Continue to Measurements</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              )}

              {currentStep === 2 && (
                <>
                  <button
                    type="button"
                    onClick={handleSkipMeasurements}
                    className="px-4 py-2.5 rounded-full border border-[var(--border-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                  >
                    Skip Measurements
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <span>Continue to Avatar</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </>
              )}

              {currentStep === 3 && (
                <>
                  <button
                    type="button"
                    onClick={handleSkipAvatar}
                    className="px-4 py-2.5 rounded-full border border-[var(--border-card)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                  >
                    Skip Avatar
                  </button>
                  <button
                    type="button"
                    onClick={handleFinish}
                    className="px-7 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shadow-xl"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                    <span>Finish & Open My Closet</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
        </div>
      </div>

      <GuestRegistrationPromptModal
        isOpen={isGuestPromptOpen}
        action={guestPromptAction || 'profile'}
        redirectTo="/closet"
        onClose={handleCloseGuestPrompt}
      />
    </>
  );
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { status, user } = useAuth();
  if (!isOpen) return null;

  const workspaceScopeId = getWorkspaceScopeId(resolveWorkspaceScope(status, user?.id));
  return (
    <OnboardingModalDialog
      key={workspaceScopeId}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
};
