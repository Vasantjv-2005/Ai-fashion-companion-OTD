import React, { useState, useMemo, useEffect, useLayoutEffect, useRef, lazy, Suspense } from 'react';
import {
  Home,
  Shirt,
  Sparkles,
  Compass,
  Calendar,
  Bookmark,
  User,
  Settings,
  HelpCircle,
  Search,
  Bell,
  ChevronDown,
  Sun,
  Moon,
  CloudSun,
  CloudRain,
  Wind,
  Snowflake,
  Thermometer,
  Heart,
  ArrowRight,
  Send,
  Plus,
  Check,
  X,
  MapPin,
  Clock,
  Camera,
  Eye,
  Trash2,
  Edit,
  Layers,
  Umbrella,
  Building,
  MoreHorizontal,
  LocateFixed,
  Archive,
  ArchiveRestore,
  ArrowUpDown,
  AlertCircle,
  ShoppingBag,
  Lock
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCloset, type ClosetItem } from '../context/ClosetContext';
import { useAuth } from '../hooks/useAuth';
import { NotificationPopover } from './ui/NotificationPopover';
import { SettingsModal } from './ui/SettingsModal';
import { MobileBottomNav } from './ui/MobileBottomNav';
import { EditPieceModal } from './EditPieceModal';
import { OccasionModal } from './ui/OccasionModal';
import { VenueCategoryModal } from './ui/VenueCategoryModal';
import { GarmentConstraintsSection } from './ui/GarmentConstraintsSection';
import { StylistReviewSummary } from './ui/StylistReviewSummary';
import { OutfitResultHeader } from './ui/OutfitResultHeader';
import { AvatarOutfitCanvas, type OutfitSlotItem } from './ui/AvatarOutfitCanvas';
import { OutfitSlotsList } from './ui/OutfitSlotsList';
import { OutfitRationaleCard } from './ui/OutfitRationaleCard';
import { OutfitActionToolbar } from './ui/OutfitActionToolbar';
import { OutfitGenerationLoader } from './ui/OutfitGenerationLoader';
import { GarmentSwapModal } from './ui/GarmentSwapModal';
import { synthesizeOutfitResult } from '../utils/outfitSynthesizer';
const ClosetUploadView = lazy(() =>
  import('./ClosetUploadView').then((module) => ({ default: module.ClosetUploadView }))
);
const ShoppingListView = lazy(() =>
  import('./ShoppingListView').then((module) => ({ default: module.ShoppingListView }))
);
import {
  GuestRegistrationPromptModal,
  type GuestRestrictedAction,
} from './auth/GuestRegistrationPromptModal';
import { useFocusTrap } from '../utils/focusTrap';
import {
  CLOSET_SEARCH_MAX_LENGTH,
  formatGarmentMetaParts,
} from '../utils/garmentValidation';
import type { SavedLook } from '../types/domain';
import { resolveSavedLookIdentifier } from '../adapters';
import { deleteBackendOutfitForLook } from '../services/outfits.service';
import {
  getWorkspaceScopeId,
  resolveWorkspaceScope,
} from '../utils/authStorage';
import {
  HOME_SUGGESTION_TEMPLATES,
  SAFE_LOOK_FALLBACK_IMAGE,
  buildSavedLookFromEnsemble,
  createSavedLookFromTemplate,
  deleteSavedLookById,
  deriveSyncedLikedLookIds,
  extractOwnedSlotGarmentIds,
  extractSlotAssignments,
  findDuplicateSavedLook,
  formatSavedLookDateLabel,
  formatSavedLookPiecesSummary,
  isTemplateFavorited,
  loadStoredSavedLooks,
  persistSavedLooks,
  restoreSavedLookSlots,
  toggleSavedLookFavorite,
  toggleTemplateCardFavorite,
  type HomeSuggestionTemplate,
} from '../utils/savedLooksStorage';

export interface AppStudioProps {
  onOpenAddPiece: () => void;
  onOpenProfile: () => void;
  onOpenAuth?: () => void;
  onBackToLanding?: () => void;
  activeTab?: StudioTab;
  onTabChange?: (tab: StudioTab) => void;
  isUploadRoute?: boolean;
  onNavigateToUpload?: () => void;
  onBackFromUpload?: () => void;
}

export type StudioTab =
  | 'home'
  | 'closet'
  | 'stylist'
  | 'shopping'
  | 'ideas'
  | 'tryon'
  | 'destinations'
  | 'calendar'
  | 'saved';

interface Venue {
  id: string;
  name: string;
  location: string;
  category: string;
  img: string;
  ambience: string;
  vibe: string;
  crowd: string;
  dressCode: string;
  isIndoor: boolean;
  tempRange: string;
  description: string;
}

const CURATED_VENUES: Venue[] = [
  {
    id: 'lamore',
    name: "L'amore",
    location: 'Banjara Hills, Hyderabad',
    category: 'Restaurant',
    img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    ambience: 'Fine Dining',
    vibe: 'Romantic',
    crowd: 'Upscale',
    dressCode: 'Smart Casual',
    isIndoor: true,
    tempRange: '26-30°C',
    description: "L'amore is a fine dining restaurant known for its elegant ambience, warm lighting and modern aesthetic. It's a popular spot for date nights, special occasions and upscale dinners.",
  },
  {
    id: 'olive',
    name: 'Olive Bistro',
    location: 'Jubilee Hills, Hyderabad',
    category: 'Restaurant',
    img: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    ambience: 'Mediterranean Terrace',
    vibe: 'Chic & Breezy',
    crowd: 'Sartorial Socialites',
    dressCode: 'Resort Smart Casual',
    isIndoor: false,
    tempRange: '24-28°C',
    description: 'Picturesque hilltop bistro overlooking Durgam Cheruvu lake. White-washed walls, floral bougainvillea, and candle-lit alfresco seating perfect for relaxed conversations.',
  },
  {
    id: 'aer',
    name: 'Aer Lounge',
    location: 'Worli, Mumbai',
    category: 'Bar / Club',
    img: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=800&q=80',
    ambience: 'Rooftop Sky Lounge',
    vibe: 'Electrifying & Alluring',
    crowd: 'Nightlife Connoisseurs',
    dressCode: 'Cocktail Tailored',
    isIndoor: false,
    tempRange: '27-29°C',
    description: 'High-altitude open-air lounge offering panoramic Arabian Sea vistas, house beats, and dramatic city skyline night views requiring sleek tailoring.',
  },
  {
    id: 'soho',
    name: 'Soho House Lounge',
    location: 'Juhu Beach, Mumbai',
    category: 'Café',
    img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    ambience: 'Private Club & Library',
    vibe: 'Minimalist & Creative',
    crowd: 'Artists & Executives',
    dressCode: 'Casual Luxury',
    isIndoor: true,
    tempRange: '23-25°C',
    description: 'Understated beachside member enclave boasting vintage velvet armchairs, teak finishes, and art collections suitable for elevated relaxed pieces.',
  },
];

function getDynamicDateOptions(): string[] {
  const now = new Date();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const format = (d: Date) => `${d.getDate()} ${months[d.getMonth()]}`;

  const today = new Date(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const weekend = new Date(now);
  const dayOfWeek = now.getDay();
  const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  weekend.setDate(now.getDate() + daysUntilSaturday);

  return [
    `Today, ${format(today)}`,
    `Tomorrow, ${format(tomorrow)}`,
    `Saturday, ${format(weekend)}`,
  ];
}

export interface WeekScheduleDay {
  name: string;
  occasion: string;
  planned: boolean;
  img?: string;
  key: string;
  day: string;
  month: string;
  isToday: boolean;
}

function computeWeekScheduleDays(): WeekScheduleDay[] {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + distToMon);

  const templateOccasions = [
    { name: 'Mon', occasion: "Dinner at Bistro", planned: true, img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=300&q=80' },
    { name: 'Tue', occasion: 'Office Presentation', planned: true, img: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80' },
    { name: 'Wed', occasion: 'Client Lunch', planned: false },
    { name: 'Thu', occasion: 'Art Gallery Opening', planned: true, img: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=300&q=80' },
    { name: 'Fri', occasion: 'Casual Friday & Drinks', planned: false },
    { name: 'Sat', occasion: 'Rooftop Lounge Gathering', planned: true, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80' },
    { name: 'Sun', occasion: 'Weekend Brunch', planned: false },
  ];

  return templateOccasions.map((template, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const isToday = d.toDateString() === now.toDateString();
    const dayNum = d.getDate();
    const monthShort = d.toLocaleDateString('en-US', { month: 'short' });
    return {
      ...template,
      key: `week-day-${idx}-${dayNum}-${monthShort}`,
      day: dayNum.toString(),
      month: monthShort,
      isToday,
    };
  });
}

interface ScopedSavedLooksState {
  scopeId: string;
  looks: SavedLook[];
}

const EMPTY_SLOT_OVERRIDES: Partial<Record<OutfitSlotItem['slot'], ClosetItem>> = {};

function createInitialConciergeMessages(): Array<{
  sender: 'user' | 'ai';
  text: string;
  time: string;
}> {
  return [
    {
      sender: 'ai',
      text: "Welcome to your AI Stylist Concierge. Ask me to refine silhouettes, adapt garments to weather shifts, or optimize formality for your venue.",
      time: 'Just now',
    },
  ];
}

export const AppStudio: React.FC<AppStudioProps> = ({
  onOpenAddPiece,
  onOpenProfile,
  onOpenAuth,
  onBackToLanding,
  activeTab: controlledActiveTab,
  onTabChange,
  isUploadRoute,
  onNavigateToUpload,
  onBackFromUpload,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { status, isAuthenticated, isGuest, user, logout, exitGuestMode } = useAuth();
  const {
    closet,
    profile,
    deleteClosetItem,
    updateClosetItem,
    archiveClosetItem,
    restoreClosetItem,
    shoppingList,
    checkItemOwnership
  } = useCloset();

  const workspaceScope = useMemo(
    () => resolveWorkspaceScope(status, user?.id),
    [status, user?.id]
  );
  const workspaceScopeId = getWorkspaceScopeId(workspaceScope);

  // Prefer authenticated account name over local demo profile fallback
  const userDisplayName = isAuthenticated
    ? user?.name?.trim() || profile.name.trim() || 'Style Member'
    : 'Guest Curator';
  const userGreetingName = isAuthenticated
    ? (user?.name?.trim() || profile.name.trim() || 'Stylist').split(' ')[0]
    : 'Curator';

  const [guestPromptState, setGuestPromptState] = useState<{
    action: GuestRestrictedAction;
    redirectTo?: string;
    actionTitle?: string;
  } | null>(null);

  const requireRegisteredUser = (
    action: GuestRestrictedAction,
    redirectTo?: string,
    actionTitle?: string,
  ): boolean => {
    if (isAuthenticated) {
      return true;
    }
    setGuestPromptState({ action, redirectTo, actionTitle });
    return false;
  };

  // Live count of missing / unacquired shopping list items for badge indication
  const unacquiredShoppingCount = useMemo(() => {
    return shoppingList.filter((item) => !checkItemOwnership(item).isOwned).length;
  }, [shoppingList, checkItemOwnership]);

  // Dynamic week calendar calculation (Task 9B, DEF-07 pure initialization)
  const [weekScheduleDays] = useState<WeekScheduleDay[]>(computeWeekScheduleDays);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<WeekScheduleDay | null>(null);
  const calendarModalRef = useFocusTrap<HTMLDivElement>({
    isOpen: selectedCalendarDay !== null,
    onClose: () => setSelectedCalendarDay(null),
  });

  // Navigation tab state
  const [internalTab, setInternalTab] = useState<StudioTab>(controlledActiveTab || 'home');
  const [prevControlledTab, setPrevControlledTab] = useState<StudioTab | undefined>(controlledActiveTab);

  if (controlledActiveTab !== prevControlledTab) {
    setPrevControlledTab(controlledActiveTab);
    setInternalTab(controlledActiveTab || 'home');
  }

  const activeTab = internalTab;

  const setActiveTab = (tab: StudioTab) => {
    setInternalTab(tab);
    if (onTabChange) {
      onTabChange(tab);
    }
  };
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedClosetItem, setSelectedClosetItem] = useState<ClosetItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ClosetItem | null>(null);
  const [itemToEdit, setItemToEdit] = useState<ClosetItem | null>(null);

  // Home search bar
  const [homeSearchQuery, setHomeSearchQuery] = useState('');

  // Favorites / Saved Looks state (Scope-isolated persistence with Guest-only demo seeding)
  const [scopedSavedLooks, setScopedSavedLooks] = useState<ScopedSavedLooksState>(() => ({
    scopeId: workspaceScopeId,
    looks: loadStoredSavedLooks(workspaceScope),
  }));
  const [restoredLook, setRestoredLook] = useState<SavedLook | null>(null);

  const isScopeSynced = scopedSavedLooks.scopeId === workspaceScopeId;
  const savedLooksList = useMemo(
    () => (isScopeSynced ? scopedSavedLooks.looks : loadStoredSavedLooks(workspaceScope)),
    [isScopeSynced, scopedSavedLooks.looks, workspaceScope],
  );

  const activeScopeIdRef = useRef<string>(workspaceScopeId);
  const scopeGenerationRef = useRef<number>(0);
  const locationRequestIdRef = useRef<number>(0);
  const vibeTimerRef = useRef<number | null>(null);
  const chatTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef<boolean>(true);

  const likedLooks = useMemo(
    () => deriveSyncedLikedLookIds(savedLooksList),
    [savedLooksList],
  );
  const favoriteLooksCount = likedLooks.length;

  const updateSavedLooksList = (updater: (prev: SavedLook[]) => SavedLook[]) => {
    const dispatchedScopeId = workspaceScopeId;
    setScopedSavedLooks((prev) => {
      if (prev.scopeId !== dispatchedScopeId) {
        return prev;
      }
      return {
        scopeId: prev.scopeId,
        looks: updater(prev.looks),
      };
    });
  };

  // Synchronize normalized Saved Looks and synced Favorite IDs strictly to the active scope
  useEffect(() => {
    if (scopedSavedLooks.scopeId !== workspaceScopeId) {
      return;
    }
    persistSavedLooks(scopedSavedLooks.looks, workspaceScope);
  }, [scopedSavedLooks, workspaceScope, workspaceScopeId]);

  // Focus traps & keyboard accessibility for Studio internal modals
  const inspectionModalRef = useFocusTrap<HTMLDivElement>({
    isOpen: Boolean(selectedClosetItem),
    isPaused: Boolean(itemToEdit) || Boolean(itemToDelete),
    onClose: () => setSelectedClosetItem(null),
  });

  const deleteDialogRef = useFocusTrap<HTMLDivElement>({
    isOpen: Boolean(itemToDelete),
    onClose: () => setItemToDelete(null),
  });

  const helpModalRef = useFocusTrap<HTMLDivElement>({
    isOpen: isHelpOpen,
    onClose: () => setIsHelpOpen(false),
  });

  const mobileDrawerRef = useFocusTrap<HTMLDivElement>({
    isOpen: mobileMenuOpen,
    onClose: () => setMobileMenuOpen(false),
  });

  // Plan Your Look Wizard State (Screenshots 1 & 2)
  const [plannerStep, setPlannerStep] = useState<1 | 2 | 3>(1);
  const [selectedOccasion, setSelectedOccasion] = useState('Date');
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("L'amore, Banjara Hills, Hyderabad");
  const [selectedVenueCategory, setSelectedVenueCategory] = useState('Restaurant');
  const [isVenueCategoryModalOpen, setIsVenueCategoryModalOpen] = useState(false);

  const trimmedDestinationSearch = destinationSearch.trim();
  const matchedCuratedVenue = useMemo(() => {
    if (!trimmedDestinationSearch) return undefined;
    const normalized = trimmedDestinationSearch.toLowerCase();
    return CURATED_VENUES.find(
      (v) =>
        v.name.toLowerCase() === normalized ||
        `${v.name}, ${v.location}`.toLowerCase() === normalized,
    );
  }, [trimmedDestinationSearch]);
  const resolvedDestinationName = matchedCuratedVenue
    ? matchedCuratedVenue.name
    : trimmedDestinationSearch;
  // Dynamic relative date options based on current date
  const [dynamicDateOptions] = useState<string[]>(() => getDynamicDateOptions());
  const [selectedDate, setSelectedDate] = useState<string>(() => getDynamicDateOptions()[0]);
  const [selectedTime, setSelectedTime] = useState('8:00 PM');
  const [venueInfoTab, setVenueInfoTab] = useState<'about' | 'ambience' | 'dress_code' | 'photos'>('about');

  // Location Permission State (Client-Side Geolocation API)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'detected' | 'denied' | 'unsupported' | 'error'>('idle');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationFeedback, setLocationFeedback] = useState<string | null>(null);

  const handleRequestLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatus('unsupported');
      setLocationFeedback('Geolocation is not supported by your browser.');
      return;
    }
    const initiatingScopeId = activeScopeIdRef.current;
    const initiatingScopeGen = scopeGenerationRef.current;
    const requestId = ++locationRequestIdRef.current;

    setLocationStatus('requesting');
    setLocationFeedback('Detecting local geographic coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (
          !isMountedRef.current ||
          activeScopeIdRef.current !== initiatingScopeId ||
          scopeGenerationRef.current !== initiatingScopeGen ||
          locationRequestIdRef.current !== requestId
        ) {
          return;
        }
        setLocationCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        setLocationStatus('detected');
        setLocationFeedback('Location detected. Geographic context applied to your styling session.');
      },
      (err) => {
        if (
          !isMountedRef.current ||
          activeScopeIdRef.current !== initiatingScopeId ||
          scopeGenerationRef.current !== initiatingScopeGen ||
          locationRequestIdRef.current !== requestId
        ) {
          return;
        }
        if (err.code === 1) { // PERMISSION_DENIED
          setLocationStatus('denied');
          setLocationFeedback('Location access was declined. Manual destination will be used.');
        } else if (err.code === 3) { // TIMEOUT
          setLocationStatus('error');
          setLocationFeedback('Location request timed out. Continuing with manual destination.');
        } else {
          setLocationStatus('error');
          setLocationFeedback('Location temporarily unavailable. Continuing with manual destination.');
        }
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: false }
    );
  };

  const handleClearLocation = () => {
    locationRequestIdRef.current += 1;
    setLocationStatus('idle');
    setLocationCoords(null);
    setLocationFeedback(null);
  };

  // Step 2 State (Screenshot 1)
  const [selectedMoods, setSelectedMoods] = useState<string[]>(['Confident']);
  const [vibeFeedback, setVibeFeedback] = useState<string | null>(null);
  const [customVibeInput, setCustomVibeInput] = useState('');
  const [isCustomVibeActive, setIsCustomVibeActive] = useState(false);
  const [selectedWeatherCond, setSelectedWeatherCond] = useState('Partly Cloudy');
  const [weatherNote, setWeatherNote] = useState('24°C • Mild & comfortable conditions');
  const [isWeatherSkipped, setIsWeatherSkipped] = useState(false);
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(['Light & Breezy']);

  const scheduleVibeFeedbackClear = () => {
    if (vibeTimerRef.current !== null) {
      window.clearTimeout(vibeTimerRef.current);
    }
    const dispatchedScopeId = activeScopeIdRef.current;
    const dispatchedScopeGen = scopeGenerationRef.current;
    vibeTimerRef.current = window.setTimeout(() => {
      vibeTimerRef.current = null;
      if (
        !isMountedRef.current ||
        activeScopeIdRef.current !== dispatchedScopeId ||
        scopeGenerationRef.current !== dispatchedScopeGen
      ) {
        return;
      }
      setVibeFeedback(null);
    }, 3000);
  };

  const handleToggleMood = (moodName: string) => {
    if (selectedMoods.includes(moodName)) {
      if (vibeTimerRef.current !== null) {
        window.clearTimeout(vibeTimerRef.current);
        vibeTimerRef.current = null;
      }
      setSelectedMoods((prev) => prev.filter((m) => m !== moodName));
      setVibeFeedback(null);
    } else {
      if (selectedMoods.length >= 2) {
        setVibeFeedback('Maximum 2 style vibes allowed. Deselect one to choose another.');
        scheduleVibeFeedbackClear();
      } else {
        if (vibeTimerRef.current !== null) {
          window.clearTimeout(vibeTimerRef.current);
          vibeTimerRef.current = null;
        }
        setSelectedMoods((prev) => [...prev, moodName]);
        setVibeFeedback(null);
      }
    }
  };

  const handleAddCustomVibe = () => {
    const clean = customVibeInput.trim();
    if (!clean) return;
    if (selectedMoods.length >= 2) {
      setVibeFeedback('Maximum 2 style vibes allowed. Deselect one first.');
      scheduleVibeFeedbackClear();
      return;
    }
    if (!selectedMoods.some((m) => m.toLowerCase() === clean.toLowerCase())) {
      setSelectedMoods((prev) => [...prev, clean]);
    }
    setCustomVibeInput('');
    setIsCustomVibeActive(false);
  };

  // Explicit Garment Constraints (Include & Avoid)
  const [mustInclude, setMustInclude] = useState<string[]>([]);
  const [avoidItems, setAvoidItems] = useState<string[]>([]);

  const handleAddInclude = (item: string) => {
    const clean = item.trim();
    if (!clean) return;
    if (!mustInclude.some((i) => i.toLowerCase() === clean.toLowerCase())) {
      setMustInclude((prev) => [...prev, clean]);
    }
  };

  const handleRemoveInclude = (item: string) => {
    setMustInclude((prev) => prev.filter((i) => i.toLowerCase() !== item.toLowerCase()));
  };

  const handleAddAvoid = (item: string) => {
    const clean = item.trim();
    if (!clean) return;
    if (!avoidItems.some((i) => i.toLowerCase() === clean.toLowerCase())) {
      setAvoidItems((prev) => [...prev, clean]);
    }
  };

  const handleRemoveAvoid = (item: string) => {
    setAvoidItems((prev) => prev.filter((i) => i.toLowerCase() !== item.toLowerCase()));
  };

  // Recommendation & Chat State (Step 3)
  const [currentOutfitTitle, setCurrentOutfitTitle] = useState<string | null>(null);
  const [outfitVariationIndex, setOutfitVariationIndex] = useState(0);
  const [isSynthesizingOutfit, setIsSynthesizingOutfit] = useState(false);

  // Individual Garment Swapping State (Task 4)
  const [slotOverrides, setSlotOverrides] = useState<Partial<Record<OutfitSlotItem['slot'], ClosetItem>>>({});
  const [isGarmentSwapOpen, setIsGarmentSwapOpen] = useState(false);
  const [activeSwapSlotKey, setActiveSwapSlotKey] = useState<OutfitSlotItem['slot'] | null>(null);
  const [selectedOutfitSlotKey, setSelectedOutfitSlotKey] = useState<OutfitSlotItem['slot']>('top');
  const [swapToast, setSwapToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const studioMainRef = useRef<HTMLElement | null>(null);

  const scrollStudioSection = (sectionId?: string) => {
    const mainEl = studioMainRef.current;
    if (!mainEl) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    if (!sectionId) {
      if (typeof mainEl.scrollTo === 'function') {
        mainEl.scrollTo({ top: 0, behavior });
      } else {
        mainEl.scrollTop = 0;
      }
      return;
    }

    const targetEl = document.getElementById(sectionId);
    if (!targetEl || !mainEl.contains(targetEl)) return;

    const headerOffset = 80;
    const targetTop =
      targetEl.getBoundingClientRect().top -
      mainEl.getBoundingClientRect().top +
      mainEl.scrollTop -
      headerOffset;

    if (typeof mainEl.scrollTo === 'function') {
      mainEl.scrollTo({ top: Math.max(0, targetTop), behavior });
    } else {
      mainEl.scrollTop = Math.max(0, targetTop);
    }
  };

  const resetStylistSession = (
    targetStep: 1 | 2 | 3 = 1,
    options?: { keepVariation?: boolean; resetChat?: boolean },
  ) => {
    const shouldResetChat = options?.resetChat ?? targetStep === 1;
    setRestoredLook(null);
    setCurrentOutfitTitle(null);
    setSlotOverrides({});
    setIsGarmentSwapOpen(false);
    setActiveSwapSlotKey(null);
    setSelectedOutfitSlotKey('top');
    setIsSynthesizingOutfit(false);
    if (!options?.keepVariation) {
      setOutfitVariationIndex(0);
    }
    if (shouldResetChat) {
      if (chatTimerRef.current !== null) {
        window.clearTimeout(chatTimerRef.current);
        chatTimerRef.current = null;
      }
      setChatMessages(createInitialConciergeMessages());
      setChatInput('');
    }
    setPlannerStep(targetStep);
  };

  useLayoutEffect(() => {
    activeScopeIdRef.current = workspaceScopeId;
    scopeGenerationRef.current += 1;
    locationRequestIdRef.current += 1;
    return () => {
      scopeGenerationRef.current += 1;
      locationRequestIdRef.current += 1;
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
      if (chatTimerRef.current !== null) {
        window.clearTimeout(chatTimerRef.current);
        chatTimerRef.current = null;
      }
      if (vibeTimerRef.current !== null) {
        window.clearTimeout(vibeTimerRef.current);
        vibeTimerRef.current = null;
      }
    };
  }, [workspaceScopeId]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      scopeGenerationRef.current += 1;
      locationRequestIdRef.current += 1;
    };
  }, []);

  const effectiveRestoredLook = isScopeSynced ? restoredLook : null;
  const effectiveSlotOverrides = isScopeSynced ? slotOverrides : EMPTY_SLOT_OVERRIDES;

  const triggerSwapToast = (message: string) => {
    setSwapToast(message);
    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }
    const dispatchedScopeId = activeScopeIdRef.current;
    const dispatchedScopeGen = scopeGenerationRef.current;
    toastTimerRef.current = window.setTimeout(() => {
      toastTimerRef.current = null;
      if (
        !isMountedRef.current ||
        activeScopeIdRef.current !== dispatchedScopeId ||
        scopeGenerationRef.current !== dispatchedScopeGen
      ) {
        return;
      }
      setSwapToast(null);
    }, 3500);
  };

  // Memoized deterministic ensemble synthesis from active closet & context
  const synthesizedOutfit = useMemo(() => {
    const base = synthesizeOutfitResult({
      closet,
      occasion: selectedOccasion,
      venueName: resolvedDestinationName,
      venueCategory: selectedVenueCategory,
      weatherCondition: isWeatherSkipped ? 'Climate-Agnostic' : selectedWeatherCond,
      selectedPreferences,
      selectedMoods,
      mustInclude,
      avoidItems,
      profile,
      variationIndex: outfitVariationIndex,
    });
    if (currentOutfitTitle) {
      return { ...base, title: currentOutfitTitle };
    }
    return base;
  }, [
    closet,
    selectedOccasion,
    resolvedDestinationName,
    selectedVenueCategory,
    isWeatherSkipped,
    selectedWeatherCond,
    selectedPreferences,
    selectedMoods,
    mustInclude,
    avoidItems,
    profile,
    outfitVariationIndex,
    currentOutfitTitle,
  ]);

  const restoredLookResolution = useMemo(() => {
    if (!effectiveRestoredLook) return null;
    return restoreSavedLookSlots(effectiveRestoredLook, closet);
  }, [effectiveRestoredLook, closet]);

  const activeOutfitTitle = effectiveRestoredLook ? effectiveRestoredLook.title : synthesizedOutfit.title;
  const activeOutfitSubtitle = effectiveRestoredLook ? effectiveRestoredLook.subtitle : synthesizedOutfit.subtitle;

  // Effective slots applying individual garment overrides (resolved against live active closet) while preserving saved/restored slots
  const effectiveSlots: OutfitSlotItem[] = useMemo(() => {
    const baseSlots = restoredLookResolution
      ? restoredLookResolution.restoredSlots
      : synthesizedOutfit.slots;
    const activeClosetById = new Map(
      closet.filter((item) => !item.isArchived).map((item) => [item.id, item] as const),
    );
    const slotOrder: OutfitSlotItem['slot'][] = [
      'top',
      'outerwear',
      'bottom',
      'footwear',
      'accessory',
    ];
    const slotLabels: Record<OutfitSlotItem['slot'], string> = {
      top: 'Base Top',
      outerwear: 'Outerwear / Layer',
      bottom: 'Bottoms',
      footwear: 'Footwear',
      accessory: 'Accessories',
    };

    const mapped = baseSlots.map((baseSlot) => {
      const override = effectiveSlotOverrides[baseSlot.slot];
      const liveOverride = override ? activeClosetById.get(override.id) : undefined;
      if (!liveOverride) return baseSlot;

      return {
        ...baseSlot,
        closetItemId: liveOverride.id,
        name: liveOverride.name,
        category: liveOverride.subType || liveOverride.category,
        brand: liveOverride.brand,
        color: liveOverride.color,
        fit: liveOverride.fit,
        formality: liveOverride.formality,
        imageUrl: liveOverride.imageUrl,
        icon: liveOverride.icon,
        status: 'owned' as const, // Strict verified owned status directly from closet
        stylingNote: `Hand-selected substitution: ${liveOverride.brand ? `${liveOverride.brand} ` : ''}${liveOverride.name} in ${liveOverride.color}.`,
      };
    });

    const presentKeys = new Set(mapped.map((s) => s.slot));
    for (const slotKey of slotOrder) {
      const override = effectiveSlotOverrides[slotKey];
      const liveOverride = override ? activeClosetById.get(override.id) : undefined;
      if (liveOverride && !presentKeys.has(slotKey)) {
        mapped.push({
          slot: slotKey,
          slotLabel: slotLabels[slotKey],
          closetItemId: liveOverride.id,
          name: liveOverride.name,
          category: liveOverride.subType || liveOverride.category,
          brand: liveOverride.brand,
          color: liveOverride.color,
          fit: liveOverride.fit,
          formality: liveOverride.formality,
          imageUrl: liveOverride.imageUrl,
          icon: liveOverride.icon,
          status: 'owned',
          stylingNote: `Hand-selected substitution: ${liveOverride.brand ? `${liveOverride.brand} ` : ''}${liveOverride.name} in ${liveOverride.color}.`,
        });
      }
    }

    return mapped.sort((a, b) => slotOrder.indexOf(a.slot) - slotOrder.indexOf(b.slot));
  }, [restoredLookResolution, synthesizedOutfit.slots, effectiveSlotOverrides, closet]);

  const activeSwapSlot = useMemo(() => {
    if (!activeSwapSlotKey) return null;
    return effectiveSlots.find((s) => s.slot === activeSwapSlotKey) ?? null;
  }, [activeSwapSlotKey, effectiveSlots]);

  const activeOverridesCount = useMemo(
    () =>
      Object.values(effectiveSlotOverrides).filter(
        (override) =>
          Boolean(override && closet.some((item) => item.id === override.id && !item.isArchived)),
      ).length,
    [effectiveSlotOverrides, closet],
  );

  const currentEnsembleCandidate = useMemo(
    () => ({
      title: activeOutfitTitle,
      occasion: selectedOccasion,
      slots: effectiveSlots,
      garmentIds: extractOwnedSlotGarmentIds(effectiveSlots),
      garments: effectiveSlots.map((s) => s.name),
      slotAssignments: extractSlotAssignments(effectiveSlots),
    }),
    [activeOutfitTitle, selectedOccasion, effectiveSlots],
  );

  const matchingSavedLook = useMemo(() => {
    if (effectiveRestoredLook && activeOverridesCount === 0) {
      const liveRestored = savedLooksList.find((l) => l.id === effectiveRestoredLook.id);
      if (liveRestored) return liveRestored;
    }
    return findDuplicateSavedLook(currentEnsembleCandidate, savedLooksList);
  }, [effectiveRestoredLook, activeOverridesCount, savedLooksList, currentEnsembleCandidate]);

  const isCurrentOutfitSaved = Boolean(matchingSavedLook?.isFavorite);

  // Transparently recomputed harmony score based on active slots (returns null when 0 pieces are owned)
  const effectiveHarmonyScore = useMemo<number | null>(() => {
    if (effectiveSlots.length === 0) {
      return null;
    }
    const ownedCount = effectiveSlots.filter((s) => s.status === 'owned').length;
    if (ownedCount === 0) {
      return null;
    }
    const wardrobeOwnershipPts = Math.round((ownedCount / effectiveSlots.length) * 60);

    const occasionLower = selectedOccasion.toLowerCase();
    const isFormal =
      occasionLower.includes('gala') ||
      occasionLower.includes('black tie') ||
      occasionLower.includes('formal') ||
      occasionLower.includes('dinner');
    const isCasual =
      occasionLower.includes('brunch') ||
      occasionLower.includes('weekend') ||
      occasionLower.includes('casual');

    const formalityPts = isFormal ? 29 : isCasual ? 28 : 30;
    const climateComfortPts = isWeatherSkipped ? 8 : 9;

    return Math.min(99, Math.max(0, wardrobeOwnershipPts + formalityPts + climateComfortPts));
  }, [effectiveSlots, selectedOccasion, isWeatherSkipped]);

  // Open garment swap modal for a specific slot
  const handleOpenSwapModal = (slot: OutfitSlotItem) => {
    if (!requireRegisteredUser('personalized-styling', '/stylist', `Swap ${slot.slotLabel}`)) {
      return;
    }
    setSelectedOutfitSlotKey(slot.slot);
    setActiveSwapSlotKey(slot.slot);
    setIsGarmentSwapOpen(true);
  };

  const handleCloseSwapModal = () => {
    setIsGarmentSwapOpen(false);
    setActiveSwapSlotKey(null);
  };

  // Apply a swapped garment to a single slot
  const handleApplySwap = (slotKey: OutfitSlotItem['slot'], newItem: ClosetItem) => {
    setSelectedOutfitSlotKey(slotKey);
    setSlotOverrides((prev) => ({
      ...prev,
      [slotKey]: newItem,
    }));
    triggerSwapToast(`Updated ${slotKey.toUpperCase()} with ${newItem.brand ? newItem.brand + ' ' : ''}${newItem.name}`);
  };

  const handleSaveCurrentLook = () => {
    if (!requireRegisteredUser('save-outfit', '/saved', `Save "${activeOutfitTitle}"`)) {
      return;
    }
    const existingDuplicate =
      matchingSavedLook ??
      findDuplicateSavedLook(currentEnsembleCandidate, savedLooksList);
    if (existingDuplicate) {
      if (!existingDuplicate.isFavorite) {
        updateSavedLooksList((prev) => toggleSavedLookFavorite(prev, existingDuplicate.id));
        triggerSwapToast(`Re-added "${existingDuplicate.title}" to Favorites.`);
      } else {
        triggerSwapToast(`"${existingDuplicate.title}" is already saved in your Favorites.`);
      }
      return;
    }

    const preservedTemplateId =
      effectiveRestoredLook && activeOverridesCount === 0
        ? effectiveRestoredLook.sourceTemplateId
        : undefined;

    const newSavedLook = buildSavedLookFromEnsemble({
      sourceTemplateId: preservedTemplateId,
      title: activeOutfitTitle,
      subtitle: activeOutfitSubtitle,
      occasion: selectedOccasion,
      venue: resolvedDestinationName,
      weatherTag: isWeatherSkipped
        ? 'Climate-Agnostic'
        : `${selectedWeatherCond} (${weatherNote.split('•')[0].trim() || '24°C'})`,
      vibe: selectedMoods[0] || profile.stylePersonas[0] || 'Refined',
      preferences: selectedPreferences,
      slots: effectiveSlots,
      closet,
      variationIndex: outfitVariationIndex,
    });

    updateSavedLooksList((prev) => [newSavedLook, ...prev]);
    triggerSwapToast(
      `Saved "${newSavedLook.title}" (${newSavedLook.garmentIds.length} pieces) to Favorites.`,
    );
  };

  const handleToggleFavoriteSavedLook = (lookId: string) => {
    if (!requireRegisteredUser('save-outfit', '/saved', 'Favorite This Saved Look')) {
      return;
    }
    updateSavedLooksList((prev) => toggleSavedLookFavorite(prev, lookId));
  };

  const handleDeleteSavedLook = (lookId: string) => {
    if (!requireRegisteredUser('save-outfit', '/saved', 'Remove Saved Look')) {
      return;
    }
    const targetLook = savedLooksList.find((l) => l.id === lookId);
    updateSavedLooksList((prev) => deleteSavedLookById(prev, lookId));
    if (effectiveRestoredLook?.id === lookId) {
      setRestoredLook(null);
    }
    if (
      targetLook &&
      isAuthenticated &&
      !isGuest &&
      resolveSavedLookIdentifier(targetLook).isPersistedOnBackend
    ) {
      void deleteBackendOutfitForLook(targetLook).catch(() => {
        // Non-blocking remote cleanup; local state remains authoritative during WS3
      });
    }
  };

  const handleWearSavedLook = (look: SavedLook) => {
    if (!isAuthenticated && look.sourceKind !== 'curated-default') {
      requireRegisteredUser('personalized-styling', '/stylist', `Wear "${look.title}"`);
      return;
    }
    const resolution = restoreSavedLookSlots(look, closet);
    setRestoredLook(look);
    setSlotOverrides({});
    setCurrentOutfitTitle(null);
    setIsGarmentSwapOpen(false);
    setActiveSwapSlotKey(null);
    setSelectedOutfitSlotKey('top');
    setIsSynthesizingOutfit(false);
    setSelectedOccasion(look.occasion || 'Casual');

    if (look.venue) {
      const venueLower = look.venue.toLowerCase();
      const matchedVenue = CURATED_VENUES.find(
        (v) =>
          v.name.toLowerCase() === venueLower ||
          `${v.name}, ${v.location}`.toLowerCase() === venueLower,
      );
      if (matchedVenue) {
        setSelectedVenueCategory(matchedVenue.category);
      }
      setDestinationSearch(look.venue);
    } else {
      setDestinationSearch('');
    }

    if (look.weatherTag) {
      if (look.weatherTag === 'Climate-Agnostic') {
        setIsWeatherSkipped(true);
      } else {
        setIsWeatherSkipped(false);
        setWeatherNote(look.weatherTag);
        const matchedWeather = [
          'Partly Cloudy',
          'Sunny',
          'Cloudy',
          'Rainy',
          'Windy',
          'Cold',
          'Hot',
        ].find((cond) => look.weatherTag!.toLowerCase().includes(cond.toLowerCase()));
        if (matchedWeather) {
          setSelectedWeatherCond(matchedWeather);
        }
      }
    }

    if (look.vibe?.trim()) {
      setSelectedMoods([look.vibe.trim()]);
    }

    if (typeof look.variationIndex === 'number') {
      setOutfitVariationIndex(look.variationIndex);
    }

    if (chatTimerRef.current !== null) {
      window.clearTimeout(chatTimerRef.current);
      chatTimerRef.current = null;
    }
    setChatMessages(createInitialConciergeMessages());
    setChatInput('');

    setActiveTab('stylist');
    setPlannerStep(3);

    if (resolution.missingGarmentNames.length > 0) {
      const count = resolution.missingGarmentNames.length;
      triggerSwapToast(
        `Loaded "${look.title}". Notice: ${count} saved ${count === 1 ? 'piece is' : 'pieces are'} archived or removed from your active closet.`,
      );
    } else {
      triggerSwapToast(
        `Loaded "${look.title}" with ${resolution.matchedOwnedCount} wardrobe ${resolution.matchedOwnedCount === 1 ? 'piece' : 'pieces'} restored.`,
      );
    }
  };

  const handleToggleTemplateFavorite = (templateId: string) => {
    if (!requireRegisteredUser('save-outfit', '/saved', 'Save Curated Look to Favorites')) {
      return;
    }
    updateSavedLooksList((prev) => toggleTemplateCardFavorite(prev, templateId).nextLooks);
  };

  const handleOpenSuggestionTemplate = (template: HomeSuggestionTemplate) => {
    const existingSaved = savedLooksList.find(
      (look) => look.sourceTemplateId === template.id || look.id === template.defaultSavedId,
    );
    handleWearSavedLook(existingSaved ?? createSavedLookFromTemplate(template));
  };

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; time: string }>>(
    createInitialConciergeMessages,
  );
  const [chatInput, setChatInput] = useState('');

  // Digital closet filter, archive & sort state
  const [closetSearch, setClosetSearch] = useState('');
  const [closetCategoryFilter, setClosetCategoryFilter] = useState<'all' | ClosetItem['category']>('all');
  const [closetFormalityFilter, setClosetFormalityFilter] = useState<number | 'all'>('all');
  const [closetViewMode, setClosetViewMode] = useState<'active' | 'archived'>('active');
  const [closetSortOption, setClosetSortOption] = useState<'recent' | 'oldest' | 'formality-desc' | 'formality-asc' | 'name-asc'>('recent');
  const [storageWarning, setStorageWarning] = useState<string | null>(null);

  // Synchronously reset transient Studio & Saved Looks state whenever workspace scope changes
  if (scopedSavedLooks.scopeId !== workspaceScopeId) {
    setScopedSavedLooks({
      scopeId: workspaceScopeId,
      looks: savedLooksList,
    });
    setPlannerStep(1);
    setSelectedOccasion('Date');
    setIsOccasionModalOpen(false);
    setDestinationSearch("L'amore, Banjara Hills, Hyderabad");
    setSelectedVenueCategory('Restaurant');
    setIsVenueCategoryModalOpen(false);
    setSelectedDate(dynamicDateOptions[0] || getDynamicDateOptions()[0]);
    setSelectedTime('8:00 PM');
    setVenueInfoTab('about');
    setLocationStatus('idle');
    setLocationCoords(null);
    setLocationFeedback(null);
    setSelectedMoods(['Confident']);
    setVibeFeedback(null);
    setCustomVibeInput('');
    setIsCustomVibeActive(false);
    setSelectedWeatherCond('Partly Cloudy');
    setWeatherNote('24°C • Mild & comfortable conditions');
    setIsWeatherSkipped(false);
    setSelectedPreferences(['Light & Breezy']);
    setMustInclude([]);
    setAvoidItems([]);
    setRestoredLook(null);
    setSlotOverrides({});
    setCurrentOutfitTitle(null);
    setOutfitVariationIndex(0);
    setIsGarmentSwapOpen(false);
    setActiveSwapSlotKey(null);
    setSelectedOutfitSlotKey('top');
    setIsSynthesizingOutfit(false);
    setSelectedClosetItem(null);
    setItemToDelete(null);
    setItemToEdit(null);
    setSelectedCalendarDay(null);
    setIsNotificationsOpen(false);
    setIsSettingsOpen(false);
    setIsHelpOpen(false);
    setMobileMenuOpen(false);
    setHomeSearchQuery('');
    setSwapToast(null);
    setChatMessages(createInitialConciergeMessages());
    setChatInput('');
    setClosetSearch('');
    setClosetCategoryFilter('all');
    setClosetFormalityFilter('all');
    setClosetViewMode('active');
    setClosetSortOption('recent');
    setStorageWarning(null);
    setGuestPromptState(null);
  }

  // Storage quota warning listener
  useEffect(() => {
    const handleStorageExceeded = (e: Event) => {
      const customEvent = e as CustomEvent<{ message: string }>;
      setStorageWarning(customEvent.detail?.message || 'Storage limit reached.');
    };
    window.addEventListener('otd:storage-quota-exceeded', handleStorageExceeded);
    return () => window.removeEventListener('otd:storage-quota-exceeded', handleStorageExceeded);
  }, []);

  // Keyboard accessibility for closet & studio modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (itemToEdit || isOccasionModalOpen || isVenueCategoryModalOpen || isGarmentSwapOpen || selectedCalendarDay) {
          return;
        }
        if (itemToDelete) {
          setItemToDelete(null);
        } else if (selectedClosetItem) {
          setSelectedClosetItem(null);
        } else if (isHelpOpen) {
          setIsHelpOpen(false);
        } else if (isNotificationsOpen) {
          setIsNotificationsOpen(false);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    itemToEdit,
    isOccasionModalOpen,
    isVenueCategoryModalOpen,
    isGarmentSwapOpen,
    selectedCalendarDay,
    itemToDelete,
    selectedClosetItem,
    isHelpOpen,
    isNotificationsOpen,
    isSettingsOpen,
    mobileMenuOpen,
  ]);

  const handleSendChat = (textToSend?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim()) return;
    if (!requireRegisteredUser('personalized-styling', '/stylist', 'Refine Look with AI Stylist')) {
      return;
    }

    const dispatchedScopeId = activeScopeIdRef.current;
    const dispatchedScopeGen = scopeGenerationRef.current;
    const userMsg = { sender: 'user' as const, text, time: 'Just now' };
    setChatMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setChatInput('');

    if (chatTimerRef.current !== null) {
      window.clearTimeout(chatTimerRef.current);
      chatTimerRef.current = null;
    }

    // Intelligent local stylist refinement with transparent simulation labeling (Part 4)
    chatTimerRef.current = window.setTimeout(() => {
      chatTimerRef.current = null;
      if (
        !isMountedRef.current ||
        activeScopeIdRef.current !== dispatchedScopeId ||
        scopeGenerationRef.current !== dispatchedScopeGen
      ) {
        return;
      }

      let reply = "I've recalibrated your silhouette. Updated garment selections to align with your styling preferences.";
      const lower = text.toLowerCase();
      const activeCloset = closet.filter((c) => !c.isArchived);

      if (lower.includes('casual')) {
        // Find casual footwear & relaxed top
        const casualShoe = activeCloset.find((c) => c.category === 'footwear' && (c.subType.includes('Sneaker') || c.name.includes('Sneaker'))) ||
                           activeCloset.find((c) => c.category === 'footwear' && c.formality <= 2);
        if (casualShoe) {
          setSlotOverrides((prev) => ({ ...prev, footwear: casualShoe }));
        }
        reply = "Adapted for elevated casual ease: Swapped formal leather shoes for clean minimalist sneakers and softened overall structure.";
      } else if (lower.includes('formal')) {
        // Find formal shoes & formal blazer
        const formalShoe = activeCloset.find((c) => c.category === 'footwear' && c.formality >= 4);
        const formalBlazer = activeCloset.find((c) => c.category === 'outerwear' && c.formality >= 4);
        setSlotOverrides((prev) => ({
          ...prev,
          ...(formalShoe ? { footwear: formalShoe } : {}),
          ...(formalBlazer ? { outerwear: formalBlazer } : {}),
        }));
        reply = "Elevated to formal standard: Sharpened shoulders with tailored outerwear and burnished calfskin footwear.";
      } else if (lower.includes('colour') || lower.includes('color')) {
        setOutfitVariationIndex((prev) => prev + 1);
        setSlotOverrides({});
        setIsGarmentSwapOpen(false);
        setActiveSwapSlotKey(null);
        reply = "Explored a complementary chromatic palette: Re-balanced tones with earth and tonal neutral contrast.";
      } else if (lower.includes('comfort')) {
        const relaxedBottom = activeCloset.find((c) => c.category === 'bottoms' && (c.fit.includes('Relaxed') || c.name.includes('Linen') || c.name.includes('Gurkha')));
        if (relaxedBottom) {
          setSlotOverrides((prev) => ({ ...prev, bottom: relaxedBottom }));
        }
        reply = "Prioritized ergonomic comfort: Swapped in relaxed-drape breathable trousers while keeping silhouettes clean.";
      } else if (lower.includes('minimal')) {
        const minimalTop = activeCloset.find((c) => c.category === 'tops' && (c.name.includes('Crewneck') || c.name.includes('Pima')));
        if (minimalTop) {
          setSlotOverrides((prev) => ({ ...prev, top: minimalTop }));
        }
        reply = "Tuned to clean minimalism: Stripped back ornamentation in favor of monochrome lines and essential proportions.";
      } else if (lower.includes('elegant')) {
        const elegantTop = activeCloset.find((c) => c.category === 'tops' && (c.name.includes('Silk') || c.name.includes('Rollneck')));
        const watch = activeCloset.find((c) => c.category === 'accessories' && c.subType.includes('Watch'));
        setSlotOverrides((prev) => ({
          ...prev,
          ...(elegantTop ? { top: elegantTop } : {}),
          ...(watch ? { accessory: watch } : {}),
        }));
        reply = "Refined for timeless elegance: Accented with fine-gauge knitwear and rose gold horological detailing.";
      } else if (lower.includes('footwear') || lower.includes('shoes') || lower.includes('boot')) {
        const shoes = activeCloset.filter((c) => c.category === 'footwear');
        const currentShoeId = effectiveSlots.find((s) => s.slot === 'footwear')?.closetItemId;
        const currentIndex = shoes.findIndex((s) => s.id === currentShoeId);
        const nextShoe = shoes[(currentIndex + 1) % shoes.length] || shoes[0];
        if (nextShoe) {
          setSlotOverrides((prev) => ({ ...prev, footwear: nextShoe }));
          reply = `Substituted footwear for ${nextShoe.brand ? `${nextShoe.brand} ` : ''}${nextShoe.name} in ${nextShoe.color}.`;
        }
      } else {
        reply = `Understood: "${text}". Calibrated silhouette nuances from your active wardrobe.`;
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: reply, time: 'Just now' },
      ]);
    }, 500);
  };

  // Switch to venue and launch wizard
  const handleSelectVenueForStyling = (venue: Venue) => {
    resetStylistSession(1);
    setDestinationSearch(`${venue.name}, ${venue.location}`);
    setSelectedVenueCategory(venue.category);
    setActiveTab('stylist');
  };

  // Launch AI Stylist directly from header/home omnibar or quick prompt chip
  const launchStylistFromOmnibar = (rawPrompt: string, gateTitle?: string) => {
    const clean = rawPrompt.trim();
    if (!clean) return;
    if (
      !requireRegisteredUser(
        'personalized-styling',
        '/stylist',
        gateTitle || 'Personalize Look with AI Stylist',
      )
    ) {
      return;
    }

    const lower = clean.toLowerCase();
    const matchedVenue = CURATED_VENUES.find((v) =>
      lower.includes(v.name.toLowerCase()),
    );

    if (matchedVenue) {
      setDestinationSearch(`${matchedVenue.name}, ${matchedVenue.location}`);
      setSelectedVenueCategory(matchedVenue.category);
      setSelectedOccasion(matchedVenue.category === 'Office' ? 'Office' : 'Date');
    } else if (
      lower.includes('office') ||
      lower.includes('work') ||
      lower.includes('meeting') ||
      lower.includes('interview')
    ) {
      setSelectedOccasion('Office');
      setSelectedVenueCategory('Office / Workspace');
      setDestinationSearch('');
    } else if (lower.includes('wedding') || lower.includes('ceremony')) {
      setSelectedOccasion('Wedding');
      setSelectedVenueCategory('Outdoor');
      setDestinationSearch('');
    } else if (lower.includes('party') || lower.includes('club') || lower.includes('bar')) {
      setSelectedOccasion('Party');
      setSelectedVenueCategory('Bar / Club');
      setDestinationSearch('');
    } else if (lower.includes('travel') || lower.includes('flight') || lower.includes('airport')) {
      setSelectedOccasion('Travel');
      setSelectedVenueCategory('Outdoor');
      setDestinationSearch('');
    } else if (lower.includes('college') || lower.includes('campus')) {
      setSelectedOccasion('College');
      setSelectedVenueCategory('Café');
      setDestinationSearch('');
    } else if (lower.includes('restaurant') || lower.includes('dinner') || lower.includes('bistro')) {
      setSelectedOccasion('Dinner');
      setSelectedVenueCategory('Restaurant');
      setDestinationSearch('');
    } else if (lower.includes('date')) {
      setSelectedOccasion('Date');
      setSelectedVenueCategory('Restaurant');
      setDestinationSearch('');
    } else {
      setSelectedOccasion('Casual Outing');
      setSelectedVenueCategory('Outdoor');
      setDestinationSearch('');
    }

    setHomeSearchQuery('');
    resetStylistSession(3, { resetChat: true });
    handleSendChat(clean);
    setActiveTab('stylist');
  };

  // Partition active and archived closet items
  const activeClosetItems = useMemo(() => closet.filter((item) => !item.isArchived), [closet]);
  const archivedClosetItems = useMemo(() => closet.filter((item) => Boolean(item.isArchived)), [closet]);

  // Active pool based on current view mode
  const currentPool = closetViewMode === 'active' ? activeClosetItems : archivedClosetItems;

  // Filter and sort items (immutable sorting)
  const filteredAndSortedClosetItems = useMemo(() => {
    const filtered = currentPool.filter((item) => {
      const query = closetSearch.trim().toLowerCase();
      const matchesSearch =
        query === '' ||
        item.name.toLowerCase().includes(query) ||
        item.brand.toLowerCase().includes(query) ||
        item.color.toLowerCase().includes(query) ||
        item.subType.toLowerCase().includes(query) ||
        (item.description ? item.description.toLowerCase().includes(query) : false);

      const matchesCategory =
        closetCategoryFilter === 'all' || item.category === closetCategoryFilter;
      const matchesFormality =
        closetFormalityFilter === 'all' || item.formality === closetFormalityFilter;

      return matchesSearch && matchesCategory && matchesFormality;
    });

    // Pure immutable sort without mutating the original array
    return [...filtered].sort((a, b) => {
      switch (closetSortOption) {
        case 'recent': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeA !== timeB) return timeB - timeA;
          return b.id.localeCompare(a.id);
        }
        case 'oldest': {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (timeA !== timeB) return timeA - timeB;
          return a.id.localeCompare(b.id);
        }
        case 'formality-desc': {
          if (b.formality !== a.formality) return b.formality - a.formality;
          return a.name.localeCompare(b.name);
        }
        case 'formality-asc': {
          if (a.formality !== b.formality) return a.formality - b.formality;
          return a.name.localeCompare(b.name);
        }
        case 'name-asc': {
          return a.name.localeCompare(b.name);
        }
        default:
          return 0;
      }
    });
  }, [currentPool, closetSearch, closetCategoryFilter, closetFormalityFilter, closetSortOption]);

  return (
    <div className="h-screen h-dvh bg-[var(--bg-canvas)] text-[var(--text-body)] flex overflow-hidden font-sans transition-colors duration-300">
      {/* Skip to Main Content Link for Keyboard & Screen Reader Users */}
      <a href="#studio-main" className="sr-only skip-to-content">
        Skip to Studio Content
      </a>

      <div className="flex-1 flex h-full overflow-hidden">
        
        {/* ========================================================================= */}
        {/* LEFT NAVIGATION SIDEBAR (Fixed/Sticky Viewport, Scrollable Nav) */}
        {/* ========================================================================= */}
        <aside className="w-64 h-full border-r border-[var(--border-card)] bg-[var(--bg-card)] shrink-0 hidden md:flex flex-col justify-between p-4 overflow-hidden z-20 select-none">
          {/* Top: Logo */}
          <div className="shrink-0 pb-3">
            {/* OTD Official Logo & Subtitle */}
            <button
              type="button"
              onClick={onBackToLanding}
              aria-label="Return to OTD Home Landing"
              className="flex items-center gap-3 px-2 cursor-pointer group bg-transparent border-0 text-left p-0"
              title="Return to Home Landing"
            >
              <div className="w-10 h-12 rounded-lg bg-[#FAF5ED] p-1 border border-[#D5C29D] shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
                <img
                  src="/otd_logo.png"
                  alt="OTD - Outfit of the Day"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-cinzel text-lg font-bold tracking-[0.2em] text-[var(--text-heading)] leading-none">
                  OTD
                </h1>
                <p className="text-[9px] tracking-[0.22em] text-[var(--gold-primary)] font-mono font-bold mt-1">
                  OUTFIT OF THE DAY
                </p>
              </div>
            </button>
          </div>

          {/* Middle: Scrollable Navigation Menu */}
          <div className="flex-1 overflow-y-auto min-h-0 py-1 space-y-1 pr-0.5">
            <nav className="space-y-1">
              {[
                { id: 'home', label: 'Home', icon: Home },
                { id: 'closet', label: 'My Closet', icon: Shirt, badge: closet.length },
                { id: 'stylist', label: 'AI Stylist', icon: Sparkles },
                {
                  id: 'shopping',
                  label: 'Wishlist',
                  icon: ShoppingBag,
                  badge: unacquiredShoppingCount > 0 ? unacquiredShoppingCount : undefined,
                },
                { id: 'ideas', label: 'Create Look', icon: Shirt },
                { id: 'destinations', label: 'Destination Mode', icon: Compass },
                { id: 'tryon', label: 'Virtual Try-On', icon: Camera, tag: 'Beta' },
                { id: 'calendar', label: 'Calendar', icon: Calendar },
                { id: 'saved', label: 'Favorites', icon: Bookmark, badge: likedLooks.length },
                { id: 'profile', label: 'Profile', icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === 'profile') {
                        onOpenProfile();
                      } else {
                        setActiveTab(item.id as StudioTab);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-[var(--gold-primary)]'
                            : 'text-[var(--text-muted)]'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                            : 'bg-[var(--gold-primary)]/15 text-[var(--gold-primary)]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    {item.tag !== undefined && (
                      <span
                        className={`text-[9px] uppercase tracking-wider font-mono font-bold px-1.5 py-0.5 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                            : 'bg-[var(--gold-primary)]/15 text-[var(--gold-primary)] border border-[var(--gold-primary)]/30'
                        }`}
                      >
                        {item.tag}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Utility Links & Promotional Card */}
          <div className="shrink-0 pt-3 border-t border-[var(--border-card)] space-y-3">
            <div className="space-y-0.5">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
              <button
                onClick={() => setIsHelpOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
                <span>Help & Support</span>
              </button>
            </div>

            {/* Bottom Promotional Card: "Build a Smarter Wardrobe." */}
            <button
              type="button"
              onClick={() => {
                if (!requireRegisteredUser('upload', '/closet/add', 'Upload & Digitize Your Closet')) {
                  return;
                }
                if (onNavigateToUpload) {
                  onNavigateToUpload();
                } else {
                  setActiveTab('closet');
                  onOpenAddPiece();
                }
              }}
              aria-label="Build a Smarter Wardrobe, digitize closet"
              className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-[var(--border-gold)]/60 cursor-pointer group shadow-sm hidden lg:block text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
            >
              <img
                src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=400&q=80"
                alt=""
                aria-hidden="true"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 flex flex-col justify-end text-white">
                <p className="font-playfair text-xs sm:text-sm font-bold leading-tight">
                  Build a Smarter Wardrobe.
                </p>
                <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold mt-1">
                  <span>Digitize closet</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* MAIN VIEWPORT (Independently Scrolling, Sticky Header) */}
        {/* ========================================================================= */}
        <main
          ref={studioMainRef}
          id="studio-main"
          className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto"
        >
          
          {/* Top Bar (Matching Screenshot 3) */}
          <header className="h-16 px-3 sm:px-6 border-b border-[var(--border-card)] bg-[var(--bg-header)] backdrop-blur-md flex items-center justify-between gap-2 sm:gap-4 sticky top-0 z-30 shrink-0">
            {/* Search Omnibar */}
            <div className="flex-1 min-w-0 max-w-xl relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                maxLength={200}
                placeholder="Search outfits, occasions, or ask..."
                aria-label="Search outfits, occasions, or ask stylist"
                value={homeSearchQuery}
                onChange={(e) => setHomeSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && homeSearchQuery.trim()) {
                    launchStylistFromOmnibar(homeSearchQuery, 'Personalize Look from Prompt');
                  }
                }}
                className="w-full min-w-0 pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] text-xs placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] transition-colors"
              />
            </div>

            {/* Right Header Actions: Guest Badge, Theme Toggle, Notifications, User Profile */}
            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {isGuest && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--pill-bg)] border border-[var(--border-gold)] text-[10px] font-mono uppercase tracking-wider text-[var(--gold-primary)] font-semibold">
                  <span>Guest Demo</span>
                  {onOpenAuth && (
                    <>
                      <span className="opacity-40">·</span>
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="underline hover:text-[var(--text-heading)] cursor-pointer font-bold"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-[var(--pill-bg)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
                aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-neutral-600" />
                )}
              </button>

              {/* Notification Bell with Badge */}
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2 rounded-full hover:bg-[var(--pill-bg)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-[var(--bg-header)]" />
              </button>

              {/* User Avatar & Name Dropdown */}
              <button
                type="button"
                onClick={onOpenProfile}
                aria-label={`Open profile for ${userDisplayName}`}
                className="flex items-center gap-2.5 pl-2 border-l border-[var(--border-card)] cursor-pointer group bg-transparent border-t-0 border-r-0 border-b-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
              >
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                  alt={userDisplayName}
                  className="w-8 h-8 rounded-full object-cover border border-[var(--border-gold)] group-hover:scale-105 transition-transform"
                />
                <span className="text-xs font-semibold hidden sm:inline text-[var(--text-heading)]">
                  {userDisplayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-[var(--text-heading)] transition-colors" />
              </button>
            </div>
          </header>

          {/* ========================================================================= */}
          {/* TAB 1: HOME DASHBOARD (Exact Match to Screenshot 3) */}
          {/* ========================================================================= */}
          {activeTab === 'home' && (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-[1600px] mx-auto w-full space-y-6">
              
              {/* Desktop 3-Column Layout: Center Content (8 cols) + Right Information (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* CENTER COLUMN (8 cols): Hero Banner + Quick Actions + Suggestions */}
                <div className="lg:col-span-8 space-y-5">
                  
                  {/* MAIN HERO BANNER (Matching Screenshot 3) */}
                  <div className="relative rounded-3xl overflow-hidden bg-neutral-900 border border-[var(--border-card)] shadow-lg min-h-[220px] sm:min-h-[240px] flex flex-col justify-between p-6 sm:p-7 text-white">
                    {/* Background Editorial Image with Overlay */}
                    <img
                      src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=80"
                      alt="Editorial Menswear"
                      className="absolute inset-0 w-full h-full object-cover opacity-65 object-[75%_25%]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

                    {/* Top Hero Text & Tagline */}
                    <div className="relative z-10 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-playfair text-2xl sm:text-3xl lg:text-[32px] font-bold text-white tracking-tight">
                          Hey {userGreetingName},
                        </h2>
                        <p className="text-sm sm:text-base text-neutral-300 font-light mt-0.5">
                          What should we style today?
                        </p>
                      </div>

                      <div className="hidden sm:block text-right">
                        <span className="font-serif italic text-sm text-neutral-300 font-light tracking-wide block">
                          Your style.
                        </span>
                        <span className="font-serif italic text-sm text-amber-200/90 font-light tracking-wide block">
                          Every place.
                        </span>
                      </div>
                    </div>

                    {/* Omnibar & Suggestion Chips */}
                    <div className="relative z-10 space-y-3 mt-4">
                      {/* AI Stylist Omnibar Input */}
                      <div className="relative max-w-xl">
                        <div className="w-full flex items-center bg-[#FAF5ED] text-[#1C1612] rounded-full px-4 py-2.5 shadow-md border border-[#E5D5BC]">
                          <Sparkles className="w-4 h-4 text-[#A67C1E] mr-2 shrink-0" />
                          <input
                            type="text"
                            maxLength={200}
                            aria-label="Ask OTD AI Stylist anything"
                            placeholder="Ask OTD anything..."
                            value={homeSearchQuery}
                            onChange={(e) => setHomeSearchQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && homeSearchQuery.trim()) {
                                launchStylistFromOmnibar(
                                  homeSearchQuery,
                                  'Personalize Look with AI Stylist',
                                );
                              }
                            }}
                            className="w-full bg-transparent text-xs sm:text-[13px] placeholder:text-[#84796C] text-[#1C1612] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A67C1E] rounded-md"
                          />
                          <button
                            onClick={() => {
                              if (homeSearchQuery.trim()) {
                                launchStylistFromOmnibar(
                                  homeSearchQuery,
                                  'Personalize Look with AI Stylist',
                                );
                              }
                            }}
                            className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shrink-0 ml-2"
                            aria-label="Submit query"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Suggestion Chips (Screenshot 3) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {[
                          'Date night outfit',
                          'Office look',
                          'Outfit for this restaurant',
                          'Use my new shoes',
                        ].map((chip) => (
                          <button
                            key={chip}
                            onClick={() => launchStylistFromOmnibar(chip, `Style "${chip}"`)}
                            className="px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-[11px] font-medium transition-colors cursor-pointer border border-white/20"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* QUICK ACTIONS ROW (Exact match to Screenshot 3: 5 Cards) */}
                  <div className="space-y-2.5">
                    <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                      Quick Actions
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        {
                          title: 'Upload New Item',
                          subtitle: 'Add to your closet',
                          icon: Plus,
                          img: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=300&q=80',
                          action: () => {
                            if (!requireRegisteredUser('upload', '/closet/add', 'Upload New Wardrobe Item')) {
                              return;
                            }
                            if (onNavigateToUpload) {
                              onNavigateToUpload();
                            } else {
                              onOpenAddPiece();
                            }
                          },
                        },
                        {
                          title: 'Get Outfit Ideas',
                          subtitle: 'AI powered styling',
                          icon: Sparkles,
                          img: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80',
                          action: () => {
                            setActiveTab('ideas');
                          },
                        },
                        {
                          title: 'Outfit for a Place',
                          subtitle: 'Destination mode',
                          icon: Compass,
                          img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80',
                          action: () => {
                            setActiveTab('destinations');
                          },
                        },
                        {
                          title: 'Plan My Outfits',
                          subtitle: 'Calendar view',
                          icon: Calendar,
                          img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=300&q=80',
                          action: () => {
                            setActiveTab('calendar');
                          },
                        },
                        {
                          title: 'Virtual Try-On',
                          subtitle: 'See it on your avatar',
                          icon: Camera,
                          img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
                          action: () => {
                            setActiveTab('tryon');
                          },
                        },
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <button
                            key={i}
                            type="button"
                            aria-label={`${item.title} — ${item.subtitle}`}
                            onClick={item.action}
                            className="group rounded-2xl overflow-hidden border border-[var(--border-card)] bg-[var(--bg-card)] p-2.5 flex flex-col justify-between text-left hover:border-[var(--gold-primary)] transition-all cursor-pointer shadow-xs hover:shadow-md hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                          >
                            <div className="h-20 w-full rounded-xl overflow-hidden relative mb-2 bg-neutral-900">
                              <img
                                src={item.img}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="w-full">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <Icon className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
                                <h4 className="font-semibold text-xs text-[var(--text-heading)] truncate">
                                  {item.title}
                                </h4>
                              </div>
                              <p className="text-[10px] text-[var(--text-muted)] truncate">
                                {item.subtitle}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* OUTFIT SUGGESTIONS FOR YOU (Screenshot 3: 4 Cards with Carousel / Grid) */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                        Outfit Suggestions For You
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('ideas')}
                        className="text-xs font-semibold text-[var(--gold-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>See All</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                      {HOME_SUGGESTION_TEMPLATES.map((template) => {
                        const isFavorited = isTemplateFavorited(template.id, savedLooksList);
                        return (
                          <div
                            key={template.id}
                            className="group relative rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden flex flex-col justify-between hover:border-[var(--gold-primary)] transition-all shadow-xs hover:shadow-md"
                          >
                            <button
                              type="button"
                              aria-label={`View outfit suggestion: ${template.title}, ${template.subtitle}`}
                              onClick={() => handleOpenSuggestionTemplate(template)}
                              className="w-full text-left flex flex-col flex-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--gold-primary)]"
                            >
                              <div className="h-44 w-full bg-neutral-900 relative overflow-hidden">
                                <img
                                  src={template.imageUrl || SAFE_LOOK_FALLBACK_IMAGE}
                                  alt={template.title}
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    if (target.dataset.fallbackApplied === 'true') return;
                                    target.dataset.fallbackApplied = 'true';
                                    target.src = SAFE_LOOK_FALLBACK_IMAGE;
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              </div>
                              <div className="p-3">
                                <h4 className="font-semibold text-xs sm:text-[13px] text-[var(--text-heading)]">
                                  {template.title}
                                </h4>
                                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                                  {template.subtitle}
                                </p>
                              </div>
                            </button>
                            {/* Favorite Heart Button (Sibling to avoid nested interactive controls) */}
                            <button
                              type="button"
                              onClick={() => handleToggleTemplateFavorite(template.id)}
                              aria-label={
                                isFavorited
                                  ? `Remove ${template.title} from favorites`
                                  : `Save ${template.title} to favorites`
                              }
                              aria-pressed={isFavorited}
                              className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  isFavorited ? 'fill-rose-500 text-rose-500' : 'text-white'
                                }`}
                              />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* RIGHT COLUMN (4 cols): Weather + Style Profile + Closet + Upcoming Occasions (Screenshot 3) */}
                <div className="lg:col-span-4 space-y-4">
                  
                  {/* 1. WEATHER & LOCATION CARD (Screenshot 3) */}
                  <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 space-y-2 shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        <span className="font-medium">Hyderabad, India</span>
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--gold-primary)]">
                        Sample Forecast
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-3">
                        <Sun className="w-8 h-8 text-amber-500 shrink-0" />
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-playfair text-2xl font-bold text-[var(--text-heading)]">
                              32°C
                            </span>
                            <span className="text-xs text-[var(--text-muted)]">Sunny</span>
                          </div>
                          <span className="text-[11px] text-[var(--text-muted)]">
                            Feels like 34°C
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        resetStylistSession(2);
                        setActiveTab('stylist');
                      }}
                      aria-label="View stylist recommendations for today's weather"
                      className="w-full pt-2 border-t border-[var(--border-card)] flex items-center justify-between text-[11px] text-[var(--text-body)] hover:text-[var(--gold-primary)] cursor-pointer bg-transparent text-left border-x-0 border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus-visible:underline rounded-lg"
                    >
                      <span>Perfect weather for a light, breathable outfit.</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>

                  {/* 2. YOUR STYLE PROFILE CARD (Screenshot 3) */}
                  <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-playfair text-sm font-bold text-[var(--text-heading)]">
                        Your Style Profile
                      </h4>
                      <button
                        onClick={onOpenProfile}
                        className="text-[11px] font-semibold text-[var(--gold-primary)] hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)] text-[11px]">Style:</span>
                        <span className="font-semibold text-[var(--text-heading)] text-[11px]">
                          {profile.stylePersonas.join(', ') || 'Minimal, Classy, Smart Casual'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)] text-[11px]">Preferred Fit:</span>
                        <span className="font-semibold text-[var(--text-heading)] text-[11px]">
                          {profile.preferredFit || 'Slim Fit'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)] text-[11px]">Preferred Colours:</span>
                        <div className="flex items-center gap-1.5">
                          {['#1C1612', '#FFFFFF', '#D7C4A5', '#708090', '#1E293B'].map((hex, i) => (
                            <span
                              key={i}
                              className="w-3.5 h-3.5 rounded-full border border-black/20"
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)] text-[11px]">Style Mood:</span>
                        <span className="font-semibold text-[var(--text-heading)] text-[11px]">
                          Modern • Versatile • Comfortable
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 3. YOUR CLOSET SUMMARY (Screenshot 3) */}
                  <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-playfair text-sm font-bold text-[var(--text-heading)]">
                        Your Closet
                      </h4>
                      <button
                        onClick={() => setActiveTab('closet')}
                        className="text-[11px] font-semibold text-[var(--gold-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>See All</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 min-[380px]:grid-cols-4 gap-2 text-center text-xs">
                      {(
                        [
                          {
                            category: 'Tops',
                            filter: 'tops' as ClosetItem['category'],
                            count: closet.filter((i) => i.category === 'tops').length,
                            img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=200&q=80',
                          },
                          {
                            category: 'Bottoms',
                            filter: 'bottoms' as ClosetItem['category'],
                            count: closet.filter((i) => i.category === 'bottoms').length,
                            img: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=200&q=80',
                          },
                          {
                            category: 'Outerwear',
                            filter: 'outerwear' as ClosetItem['category'],
                            count: closet.filter((i) => i.category === 'outerwear').length,
                            img: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=200&q=80',
                          },
                          {
                            category: 'Shoes',
                            filter: 'footwear' as ClosetItem['category'],
                            count: closet.filter((i) => i.category === 'footwear').length,
                            img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?auto=format&fit=crop&w=200&q=80',
                          },
                        ] as const
                      ).map((cat) => (
                        <button
                          type="button"
                          key={cat.filter}
                          onClick={() => {
                            setActiveTab('closet');
                            setClosetCategoryFilter(cat.filter);
                          }}
                          aria-label={`View ${cat.category} in Digital Closet (${cat.count} items)`}
                          className="p-1.5 rounded-xl border border-[var(--border-card)] bg-[var(--pill-bg)]/40 hover:border-[var(--gold-primary)] transition-all cursor-pointer group text-left w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)]"
                        >
                          <div className="h-12 w-full rounded-lg overflow-hidden bg-neutral-900 mb-1">
                            <img
                              src={cat.img}
                              alt=""
                              aria-hidden="true"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <span className="font-bold text-[11px] text-[var(--text-heading)] block leading-tight">
                            {cat.category}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {cat.count} items
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4. UPCOMING OCCASIONS CARD (Screenshot 3) */}
                  <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-playfair text-sm font-bold text-[var(--text-heading)]">
                        Upcoming Occasions
                      </h4>
                      <button
                        onClick={() => setActiveTab('calendar')}
                        className="text-[11px] font-semibold text-[var(--gold-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>See All</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="rounded-xl overflow-hidden border border-[var(--border-card)] bg-[var(--pill-bg)]/50 p-2.5 flex gap-3 items-center">
                      <img
                        src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=200&q=80"
                        alt="Dinner at Olive Bistro"
                        className="w-16 h-16 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <h5 className="font-bold text-[var(--text-heading)] truncate">
                          Dinner at Olive Bistro
                        </h5>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Tomorrow • 8:00 PM
                        </p>
                        <p className="text-[10px] text-[var(--gold-primary)] flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span>Jubilee Hills, Hyderabad</span>
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const olive = CURATED_VENUES.find((v) => v.id === 'olive');
                        if (olive) handleSelectVenueForStyling(olive);
                      }}
                      className="w-full py-2.5 rounded-xl border border-[var(--border-gold)] bg-[var(--pill-bg)] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                      <Shirt className="w-3.5 h-3.5" />
                      <span>Get Outfit for this Place</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: AI STYLIST WIZARD (Matching Screenshots 1 & 2) */}
          {/* ========================================================================= */}
          {activeTab === 'stylist' && (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
              
              {/* Stepper Header (Screenshots 1 & 2) */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border-card)] pb-4">
                <div>
                  <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                    {plannerStep === 1
                      ? 'Plan Your Perfect Look'
                      : plannerStep === 2
                      ? 'Set Your Mood & Weather'
                      : 'Your Curated Outfit Recommendation'}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {plannerStep === 1
                      ? "Tell us where you're going and we'll create the perfect outfit for you."
                      : plannerStep === 2
                      ? 'Help us understand your vibe and the conditions so we can create the perfect look.'
                      : 'Engineered from your digital closet with custom rationale and conversational tweaking.'}
                  </p>
                </div>

                {/* 3 Step Indicator (Screenshots 1 & 2) */}
                <div className="flex items-center gap-3">
                  {[
                    { num: 1, label: 'Occasion & Destination' },
                    { num: 2, label: 'Mood & Weather' },
                    { num: 3, label: 'Outfit Suggestions' },
                  ].map((s) => (
                    <div key={s.num} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          plannerStep === s.num
                            ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                            : plannerStep > s.num
                            ? 'bg-emerald-500 text-white'
                            : 'bg-[var(--pill-bg)] text-[var(--text-muted)] border border-[var(--border-card)]'
                        }`}
                      >
                        {plannerStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
                      </div>
                      <span className="text-xs font-medium hidden md:inline text-[var(--text-heading)]">
                        {s.label}
                      </span>
                      {s.num < 3 && <div className="w-6 h-[1px] bg-[var(--border-card)] hidden md:block" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* STEP 1: OCCASION & DESTINATION (Exact match to Screenshot 2) */}
              {plannerStep === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column (8 cols): Form Questions */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* Question 1: What's the occasion? */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                            1. What's the occasion?
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">Select your primary setting or explore secondary occasions.</p>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--gold-primary)] font-bold">
                          Selected: {selectedOccasion}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { name: 'Date', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Casual Outing', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Party', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Wedding', img: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Office', img: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=300&q=80' },
                          { name: 'College', img: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Travel', img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=300&q=80' },
                          { name: 'More (8+)', isMore: true },
                        ].map((occ) => {
                          const isSelected = selectedOccasion === occ.name;
                          return (
                            <button
                              key={occ.name}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                if (occ.isMore) {
                                  setIsOccasionModalOpen(true);
                                } else {
                                  setSelectedOccasion(occ.name);
                                }
                              }}
                              className={`w-full text-left rounded-2xl overflow-hidden border p-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                                isSelected
                                  ? 'border-black bg-black text-white dark:bg-white dark:text-black shadow-md scale-[1.01]'
                                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-heading)] hover:border-[var(--gold-primary)]'
                              }`}
                            >
                              <div className="h-18 rounded-xl overflow-hidden relative mb-2 bg-neutral-900 flex items-center justify-center">
                                {occ.img ? (
                                  <img src={occ.img} alt={occ.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center gap-1 text-[var(--gold-primary)]">
                                    <MoreHorizontal className="w-6 h-6" />
                                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider">Directory</span>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center border border-white">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold block text-center truncate">
                                {occ.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Secondary Occasion Indicator */}
                      {!['Date', 'Casual Outing', 'Party', 'Wedding', 'Office', 'College', 'Travel'].includes(selectedOccasion) && (
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-md animate-in fade-in">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider opacity-75 block">Specialized Occasion Active</span>
                              <span className="font-playfair font-bold text-sm">{selectedOccasion}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsOccasionModalOpen(true)}
                            className="px-3 py-1 rounded-full border border-white/30 dark:border-black/30 text-xs font-semibold hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer"
                          >
                            Change Occasion
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Question 2: Where are you going? */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                            2. Where are you going?
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">Enter your venue or pick an architectural setting archetype.</p>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--gold-primary)] font-bold">
                          Setting: {selectedVenueCategory}
                        </span>
                      </div>

                      {/* Destination search bar */}
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--gold-primary)]" />
                        <input
                          type="text"
                          value={destinationSearch}
                          onChange={(e) => setDestinationSearch(e.target.value)}
                          placeholder="e.g. L'amore, Soho House, or enter any destination name..."
                          aria-label="Destination or venue"
                          className="w-full pl-10 pr-10 py-3 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)]"
                        />
                        {destinationSearch && (
                          <button
                            type="button"
                            onClick={() => setDestinationSearch('')}
                            aria-label="Clear destination"
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Venue Categories */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { name: 'Restaurant', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Café', img: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Bar / Club', img: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Mall', img: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Movie / Theater', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Resort', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=300&q=80' },
                          { name: 'Outdoor', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=300&q=80' },
                          { name: 'More (14+)', isMore: true },
                        ].map((cat) => {
                          const isSelected = selectedVenueCategory === cat.name;
                          return (
                            <button
                              key={cat.name}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                if (cat.isMore) {
                                  setIsVenueCategoryModalOpen(true);
                                } else {
                                  setSelectedVenueCategory(cat.name);
                                }
                              }}
                              className={`w-full text-left rounded-2xl overflow-hidden border p-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                                isSelected
                                  ? 'border-black bg-black text-white dark:bg-white dark:text-black shadow-md scale-[1.01]'
                                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-heading)] hover:border-[var(--gold-primary)]'
                              }`}
                            >
                              <div className="h-16 rounded-xl overflow-hidden relative mb-2 bg-neutral-900 flex items-center justify-center">
                                {cat.img ? (
                                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center gap-1 text-[var(--gold-primary)]">
                                    <MoreHorizontal className="w-5 h-5" />
                                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider">All Venues</span>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center border border-white">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold block text-center truncate">
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Active Custom Category Indicator */}
                      {!['Restaurant', 'Café', 'Bar / Club', 'Mall', 'Movie / Theater', 'Resort', 'Outdoor'].includes(selectedVenueCategory) && (
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black text-white dark:bg-white dark:text-black shadow-md animate-in fade-in">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider opacity-75 block">Setting Taxonomy Active</span>
                              <span className="font-playfair font-bold text-sm">{selectedVenueCategory}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsVenueCategoryModalOpen(true)}
                            className="px-3 py-1 rounded-full border border-white/30 dark:border-black/30 text-xs font-semibold hover:bg-white/10 dark:hover:bg-black/10 transition-colors cursor-pointer"
                          >
                            Explore Settings
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Question 3 & 4: Date, Time, Weather & Geolocation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Date & Time Context */}
                      <div className="p-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-playfair text-sm font-bold text-[var(--text-heading)]">
                            3. When are you going?
                          </h4>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono uppercase">Timing</span>
                        </div>

                        {/* Date selection chips */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Date:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {dynamicDateOptions.map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setSelectedDate(d)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  selectedDate === d
                                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                                    : 'bg-[var(--pill-bg)] border-[var(--border-card)] text-[var(--text-body)] hover:border-[var(--gold-primary)]'
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Time selection chips */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] uppercase font-mono text-[var(--text-muted)] block">Time of Day:</span>
                          <div className="grid grid-cols-2 gap-1.5">
                            {[
                              { label: 'Morning', time: '9:00 AM' },
                              { label: 'Afternoon', time: '2:00 PM' },
                              { label: 'Evening', time: '8:00 PM' },
                              { label: 'Night', time: '10:30 PM' },
                            ].map((t) => (
                              <button
                                key={t.label}
                                type="button"
                                onClick={() => setSelectedTime(t.time)}
                                className={`text-[11px] p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                                  selectedTime === t.time
                                    ? 'bg-black text-white dark:bg-white dark:text-black font-semibold shadow-xs'
                                    : 'bg-[var(--pill-bg)] border-[var(--border-card)] text-[var(--text-body)] hover:border-[var(--gold-primary)]'
                                }`}
                              >
                                <span className="block font-bold">{t.label}</span>
                                <span className="text-[10px] opacity-75">{t.time}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Weather & Location Context */}
                      <div className="p-4 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-playfair text-sm font-bold text-[var(--text-heading)]">
                            4. Weather & Location
                          </h4>
                          <span className="text-[10px] text-[var(--gold-primary)] font-mono font-bold uppercase">
                            Contextual
                          </span>
                        </div>

                        {/* Geolocation Trigger (100% Optional, Browser API only) */}
                        <div className="p-2.5 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-card)] space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">
                              Local Coordinates (Optional)
                            </span>
                            {locationStatus === 'detected' && (
                              <button
                                type="button"
                                onClick={handleClearLocation}
                                className="text-[10px] text-[var(--text-muted)] hover:underline cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>

                          {locationStatus === 'idle' && (
                            <button
                              type="button"
                              onClick={handleRequestLocation}
                              className="w-full py-2 px-3 rounded-lg border border-[var(--border-card)] bg-[var(--bg-card)] text-xs font-semibold text-[var(--text-heading)] hover:border-[var(--gold-primary)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <LocateFixed className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                              <span>Detect My Location</span>
                            </button>
                          )}

                          {locationStatus === 'requesting' && (
                            <p className="text-[11px] text-[var(--gold-primary)] font-medium animate-pulse flex items-center gap-1.5">
                              <LocateFixed className="w-3.5 h-3.5 animate-spin" />
                              <span>Requesting browser permission...</span>
                            </p>
                          )}

                          {locationStatus === 'detected' && locationCoords && (
                            <div className="space-y-0.5">
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Location detected</span>
                              </p>
                              <p className="text-[10px] text-[var(--text-muted)] font-mono">
                                Calibrated for zone ({locationCoords.latitude.toFixed(2)}°N, {locationCoords.longitude.toFixed(2)}°E)
                              </p>
                            </div>
                          )}

                          {locationStatus === 'denied' && (
                            <p className="text-[11px] text-[var(--text-muted)]">
                              Location access declined. Using manual destination above.
                            </p>
                          )}

                          {(locationStatus === 'unsupported' || locationStatus === 'error') && (
                            <p className="text-[11px] text-[var(--text-muted)]">
                              {locationFeedback || 'Location unavailable. Using manual destination.'}
                            </p>
                          )}
                        </div>

                        {/* Weather Feel Selector */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] uppercase font-mono text-[var(--text-muted)]">
                              Prevailing Weather:
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsWeatherSkipped(!isWeatherSkipped)}
                              className="text-[10px] text-[var(--gold-primary)] font-medium hover:underline cursor-pointer"
                            >
                              {isWeatherSkipped ? 'Add Weather' : 'Skip Weather'}
                            </button>
                          </div>

                          {!isWeatherSkipped ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[var(--pill-bg)]">
                                <CloudSun className="w-6 h-6 text-amber-500 shrink-0" />
                                <div className="text-xs">
                                  <span className="font-bold text-[var(--text-heading)]">{selectedWeatherCond}</span>
                                  <p className="text-[10px] text-[var(--text-muted)]">{weatherNote}</p>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-1">
                                {[
                                  { name: 'Sunny', note: '28°C • Warm' },
                                  { name: 'Partly Cloudy', note: '24°C • Mild' },
                                  { name: 'Rainy', note: '18°C • Damp' },
                                  { name: 'Cold', note: '9°C • Crisp' },
                                ].map((w) => (
                                  <button
                                    key={w.name}
                                    type="button"
                                    onClick={() => {
                                      setIsWeatherSkipped(false);
                                      setSelectedWeatherCond(w.name);
                                      setWeatherNote(w.note);
                                    }}
                                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                                      !isWeatherSkipped && selectedWeatherCond === w.name
                                        ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
                                        : 'bg-[var(--bg-card)] border-[var(--border-card)] text-[var(--text-body)]'
                                    }`}
                                  >
                                    {w.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-[var(--pill-bg)] text-[11px] text-[var(--text-muted)] italic">
                              Weather context skipped. Outfits will be styled without climate biasing.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        onClick={() => setActiveTab('home')}
                        className="px-5 py-2.5 rounded-full border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] cursor-pointer transition-colors"
                      >
                        ← Back to Dashboard
                      </button>

                      <button
                        onClick={() => setPlannerStep(2)}
                        className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <span>Next: Set Mood & Constraints</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column (4 cols): Venue Preview Card (Screenshot 2) */}
                  <div className="lg:col-span-4 space-y-4">
                    {matchedCuratedVenue ? (
                      <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden shadow-lg">
                        <div className="h-44 bg-neutral-900 relative">
                          <img
                            src={matchedCuratedVenue.img}
                            alt={matchedCuratedVenue.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="p-5 space-y-4">
                          <div>
                            <h4 className="font-playfair text-xl font-bold text-[var(--text-heading)]">
                              {matchedCuratedVenue.name}
                            </h4>
                            <p className="text-xs text-[var(--gold-primary)] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>{matchedCuratedVenue.location}</span>
                            </p>
                          </div>

                          {/* Venue Tabs */}
                          <div
                            role="tablist"
                            aria-label="Venue details"
                            className="flex border-b border-[var(--border-card)] text-xs"
                          >
                            {(['about', 'ambience', 'dress_code', 'photos'] as const).map((tab, tabIdx, tabList) => {
                              const isTabSelected = venueInfoTab === tab;
                              const tabLabel =
                                tab === 'dress_code'
                                  ? 'Dress Code'
                                  : tab.charAt(0).toUpperCase() + tab.slice(1);
                              return (
                                <button
                                  key={tab}
                                  type="button"
                                  role="tab"
                                  id={`venue-tab-${tab}`}
                                  aria-selected={isTabSelected}
                                  aria-controls="venue-tabpanel"
                                  tabIndex={isTabSelected ? 0 : -1}
                                  onClick={() => setVenueInfoTab(tab)}
                                  onKeyDown={(e) => {
                                    let nextIdx: number | null = null;
                                    if (e.key === 'ArrowRight') nextIdx = (tabIdx + 1) % tabList.length;
                                    else if (e.key === 'ArrowLeft') nextIdx = (tabIdx - 1 + tabList.length) % tabList.length;
                                    else if (e.key === 'Home') nextIdx = 0;
                                    else if (e.key === 'End') nextIdx = tabList.length - 1;
                                    if (nextIdx !== null) {
                                      e.preventDefault();
                                      const nextTab = tabList[nextIdx];
                                      setVenueInfoTab(nextTab);
                                      window.requestAnimationFrame(() => {
                                        document.getElementById(`venue-tab-${nextTab}`)?.focus();
                                      });
                                    }
                                  }}
                                  className={`pb-2 px-2.5 font-semibold transition-colors cursor-pointer ${
                                    isTabSelected
                                      ? 'border-b-2 border-black dark:border-white text-[var(--text-heading)]'
                                      : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                                  }`}
                                >
                                  {tabLabel}
                                </button>
                              );
                            })}
                          </div>

                          <div
                            role="tabpanel"
                            id="venue-tabpanel"
                            aria-labelledby={`venue-tab-${venueInfoTab}`}
                            className="space-y-3"
                          >
                            {venueInfoTab === 'about' && (
                              <>
                                <p className="text-xs text-[var(--text-body)] leading-relaxed">
                                  {matchedCuratedVenue.description || 'Editorial venue preview tailored to your styling context.'}
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Category</span>
                                    <strong className="text-[var(--text-heading)]">{matchedCuratedVenue.category}</strong>
                                  </div>
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Setting</span>
                                    <strong className="text-[var(--text-heading)]">
                                      {matchedCuratedVenue.isIndoor ? 'Indoor Venue' : 'Open-Air Setting'}
                                    </strong>
                                  </div>
                                </div>
                              </>
                            )}

                            {venueInfoTab === 'ambience' && (
                              <>
                                <p className="text-xs text-[var(--text-body)] leading-relaxed">
                                  Atmosphere profile for {matchedCuratedVenue.name} in {matchedCuratedVenue.location}.
                                </p>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Ambience</span>
                                    <strong className="text-[var(--text-heading)]">{matchedCuratedVenue.ambience}</strong>
                                  </div>
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Vibe</span>
                                    <strong className="text-[var(--text-heading)]">{matchedCuratedVenue.vibe}</strong>
                                  </div>
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Crowd</span>
                                    <strong className="text-[var(--text-heading)]">{matchedCuratedVenue.crowd}</strong>
                                  </div>
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Environment</span>
                                    <strong className="text-[var(--text-heading)]">
                                      {matchedCuratedVenue.isIndoor ? 'Indoor Lounge / Dining' : 'Outdoor / Alfresco'}
                                    </strong>
                                  </div>
                                </div>
                              </>
                            )}

                            {venueInfoTab === 'dress_code' && (
                              <>
                                <div className="p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] space-y-1">
                                  <span className="text-[10px] uppercase font-mono text-[var(--gold-primary)] font-bold block">
                                    Recommended Dress Code
                                  </span>
                                  <p className="text-sm font-playfair font-bold text-[var(--text-heading)]">
                                    {matchedCuratedVenue.dressCode}
                                  </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px]">
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Typical Climate</span>
                                    <strong className="text-[var(--text-heading)]">{matchedCuratedVenue.tempRange}</strong>
                                  </div>
                                  <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                                    <span className="text-[var(--text-muted)] block text-[10px]">Venue Type</span>
                                    <strong className="text-[var(--text-heading)]">{matchedCuratedVenue.category}</strong>
                                  </div>
                                </div>
                                <p className="text-[11px] text-[var(--text-body)] leading-relaxed">
                                  Curated for {matchedCuratedVenue.category.toLowerCase()} styling with a {matchedCuratedVenue.vibe.toLowerCase()} tone and {matchedCuratedVenue.dressCode.toLowerCase()} polish.
                                </p>
                              </>
                            )}

                            {venueInfoTab === 'photos' && (
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-3 p-2.5 rounded-2xl border border-[var(--border-card)] bg-[var(--pill-bg)]/60">
                                  <img
                                    src={matchedCuratedVenue.img}
                                    alt={`${matchedCuratedVenue.name} editorial reference`}
                                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-neutral-900"
                                  />
                                  <div className="min-w-0">
                                    <span className="text-[10px] uppercase font-mono font-bold text-[var(--gold-primary)] block">
                                      Curated Venue Preview
                                    </span>
                                    <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                                      {matchedCuratedVenue.name}
                                    </p>
                                    <p className="text-[11px] text-[var(--text-muted)] truncate">
                                      {matchedCuratedVenue.location}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                                  Showing the primary curated reference photo for {matchedCuratedVenue.name}. Additional multi-angle venue gallery photos are not included in this preview.
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Pro Tip Card */}
                          <div className="p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] text-xs text-[var(--text-body)] space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-[var(--gold-primary)]">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Pro Tip</span>
                            </div>
                            <p className="text-[11px] leading-snug">
                              Based on the venue, time and weather, we'll suggest outfits that match the ambience and your personal style.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden shadow-lg p-5 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--gold-primary)] block">
                              {resolvedDestinationName ? 'Custom Venue' : 'Setting Archetype'}
                            </span>
                            <h4 className="font-playfair text-xl font-bold text-[var(--text-heading)] mt-0.5 break-words">
                              {resolvedDestinationName || `${selectedVenueCategory} Setting`}
                            </h4>
                            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-[var(--gold-primary)] shrink-0" />
                              <span>{selectedVenueCategory}</span>
                            </p>
                          </div>
                        </div>

                        <p className="text-xs text-[var(--text-body)] leading-relaxed">
                          {resolvedDestinationName
                            ? `Tailoring your silhouette and dress code for ${resolvedDestinationName} (${selectedVenueCategory}).`
                            : `No specific venue entered. Outfits will be calibrated to your ${selectedVenueCategory} setting archetype and occasion.`}
                        </p>

                        {/* Pro Tip Card */}
                        <div className="p-3 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] text-xs text-[var(--text-body)] space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-[var(--gold-primary)]">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Pro Tip</span>
                          </div>
                          <p className="text-[11px] leading-snug">
                            Based on the venue, time and weather, we'll suggest outfits that match the ambience and your personal style.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* STEP 2: SET YOUR MOOD & WEATHER (Exact match to Screenshot 1) */}
              {plannerStep === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column (8 cols): Mood, Weather & Preferences */}
                  <div className="lg:col-span-8 space-y-6">
                    
                    {/* 1. What's your mood today? (Multi-select up to 2) */}
                    <div id="stylist-mood-section" className="space-y-3 scroll-mt-20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                            1. What's your mood today?
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">
                            Select up to 2 style vibes ({selectedMoods.length}/2 selected).
                          </p>
                        </div>
                        <span className="text-[11px] font-mono text-[var(--gold-primary)] font-bold">
                          {selectedMoods.length}/2 Selected
                        </span>
                      </div>

                      {vibeFeedback && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium animate-in fade-in">
                          {vibeFeedback}
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                          { id: 'Confident', label: 'Confident', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Chill', label: 'Chill', img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Romantic', label: 'Romantic', img: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Energetic', label: 'Energetic', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Classy', label: 'Classy', img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Minimal', label: 'Minimal', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Trendy', label: 'Trendy', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Bold', label: 'Bold', img: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Comfortable', label: 'Comfortable', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80' },
                          { id: 'Other', label: '+ Custom', isCustom: true },
                        ].map((m) => {
                          const isSelected = selectedMoods.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              aria-pressed={isSelected}
                              onClick={() => {
                                if (m.isCustom) {
                                  setIsCustomVibeActive(!isCustomVibeActive);
                                } else {
                                  handleToggleMood(m.id);
                                }
                              }}
                              className={`w-full text-left rounded-2xl overflow-hidden border p-2 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                                isSelected
                                  ? 'border-black bg-black text-white dark:bg-white dark:text-black shadow-md scale-[1.01]'
                                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-heading)] hover:border-[var(--gold-primary)]'
                              }`}
                            >
                              <div className="h-18 rounded-xl overflow-hidden relative mb-2 bg-neutral-900 flex items-center justify-center">
                                {m.img ? (
                                  <img src={m.img} alt={m.label} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="flex flex-col items-center justify-center gap-1 text-[var(--gold-primary)]">
                                    <Plus className="w-6 h-6" />
                                    <span className="text-[9px] uppercase font-mono font-bold tracking-wider">Custom</span>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center border border-white">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-bold block text-center truncate">
                                {m.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Custom Vibe Input Trigger */}
                      {isCustomVibeActive && (
                        <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] space-y-2 animate-in fade-in">
                          <label htmlFor="custom-vibe-input" className="text-[11px] font-semibold text-[var(--text-heading)] block">
                            Define your unique style vibe:
                          </label>
                          <div className="flex gap-2">
                            <input
                              id="custom-vibe-input"
                              type="text"
                              value={customVibeInput}
                              onChange={(e) => setCustomVibeInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddCustomVibe();
                                }
                              }}
                              placeholder="e.g. Vintage Riviera, Stealth Wealth, Cyber Minimal..."
                              className="flex-1 px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)]"
                            />
                            <button
                              type="button"
                              onClick={handleAddCustomVibe}
                              disabled={!customVibeInput.trim()}
                              className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold disabled:opacity-40 cursor-pointer"
                            >
                              Add Vibe
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 2. What's the weather like? (Synchronized Weather Context) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                            2. What's the weather like?
                          </h3>
                          <p className="text-xs text-[var(--text-muted)]">We'll adjust layer weight and textures accordingly.</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-[11px] font-mono text-[var(--gold-primary)] font-bold">
                            {isWeatherSkipped ? 'Climate-Agnostic' : selectedWeatherCond}
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsWeatherSkipped(!isWeatherSkipped)}
                            className="text-[11px] text-[var(--gold-primary)] font-semibold hover:underline cursor-pointer"
                          >
                            {isWeatherSkipped ? 'Add Weather' : 'Skip Weather'}
                          </button>
                        </div>
                      </div>

                      {isWeatherSkipped && (
                        <div className="p-2.5 rounded-xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-[11px] text-[var(--text-muted)] italic">
                          Weather context skipped. Select any condition below or click Add Weather to re-enable climate biasing.
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
                        {[
                          { name: 'Sunny', icon: Sun, color: 'text-amber-500', note: '28°C • Warm & Bright' },
                          { name: 'Partly Cloudy', icon: CloudSun, color: 'text-amber-400', note: '24°C • Mild & Pleasant' },
                          { name: 'Cloudy', icon: CloudRain, color: 'text-neutral-400', note: '20°C • Overcast & Temperate' },
                          { name: 'Rainy', icon: CloudRain, color: 'text-sky-500', note: '18°C • Damp & Wet Conditions' },
                          { name: 'Windy', icon: Wind, color: 'text-teal-500', note: '19°C • Crisp & Breezy' },
                          { name: 'Cold', icon: Snowflake, color: 'text-blue-400', note: '8°C • Crisp & Layering Required' },
                          { name: 'Hot', icon: Thermometer, color: 'text-rose-500', note: '34°C • High Heat & Breathable' },
                        ].map((w) => {
                          const Icon = w.icon;
                          const isSelected = !isWeatherSkipped && selectedWeatherCond === w.name;
                          return (
                            <button
                              key={w.name}
                              type="button"
                              onClick={() => {
                                setIsWeatherSkipped(false);
                                setSelectedWeatherCond(w.name);
                                setWeatherNote(w.note);
                              }}
                              className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-black bg-black text-white dark:bg-white dark:text-black shadow-md scale-[1.02]'
                                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-heading)] hover:border-[var(--gold-primary)]'
                              }`}
                            >
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-[var(--gold-primary)]' : w.color}`} />
                              <span className="text-[11px] font-bold truncate">{w.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Any additional preferences? (Comfort & Layering) */}
                    <div id="stylist-preferences-section" className="space-y-3 scroll-mt-20">
                      <h3 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                        3. Any additional preferences? <span className="text-[11px] text-[var(--text-muted)] font-normal">(Optional)</span>
                      </h3>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {[
                          { name: 'Layering', icon: Layers },
                          { name: 'Light & Breezy', icon: Wind },
                          { name: 'Warm & Cozy', icon: Sparkles },
                          { name: 'Rain Friendly', icon: Umbrella },
                          { name: 'Breathable Linens', icon: Sun },
                          { name: 'Relaxed Fit', icon: Clock },
                          { name: 'Smart & Structured', icon: Sparkles },
                          { name: 'Indoor-to-Outdoor', icon: Building },
                          { name: 'All Day Comfort', icon: Clock },
                        ].map((pref) => {
                          const Icon = pref.icon;
                          const isSelected = selectedPreferences.includes(pref.name);
                          return (
                            <button
                              key={pref.name}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedPreferences(selectedPreferences.filter((p) => p !== pref.name));
                                } else {
                                  setSelectedPreferences([...selectedPreferences, pref.name]);
                                }
                              }}
                              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? 'border-black bg-black text-white dark:bg-white dark:text-black shadow-sm font-semibold'
                                  : 'border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-body)] hover:border-[var(--gold-primary)]'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                              <span className="text-xs">{pref.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Explicit Garment Constraints (Include & Avoid) */}
                    <div id="stylist-constraints-section" className="scroll-mt-20">
                      <GarmentConstraintsSection
                        mustInclude={mustInclude}
                        avoidItems={avoidItems}
                        onAddInclude={handleAddInclude}
                        onRemoveInclude={handleRemoveInclude}
                        onAddAvoid={handleAddAvoid}
                        onRemoveAvoid={handleRemoveAvoid}
                      />
                    </div>

                    {/* Navigation Buttons */}
                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setPlannerStep(1);
                          window.requestAnimationFrame(() => scrollStudioSection());
                        }}
                        className="px-5 py-2.5 rounded-full border border-[var(--border-card)] text-xs font-semibold hover:bg-[var(--pill-bg)] cursor-pointer transition-colors"
                      >
                        ← Back to Occasion & Destination
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!requireRegisteredUser('personalized-styling', '/stylist', 'Generate Curated Outfit')) {
                            return;
                          }
                          resetStylistSession(3);
                          setIsSynthesizingOutfit(true);
                          window.requestAnimationFrame(() => scrollStudioSection());
                        }}
                        className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all flex items-center gap-2 cursor-pointer shadow-md"
                      >
                        <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
                        <span>Generate Curated Outfit</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>

                  {/* Right Column (4 cols): StylistReviewSummary Panel */}
                  <div className="lg:col-span-4 space-y-4">
                    <StylistReviewSummary
                      selectedOccasion={selectedOccasion}
                      selectedDestination={resolvedDestinationName}
                      selectedVenueCategory={selectedVenueCategory}
                      selectedVenueImg={matchedCuratedVenue?.img}
                      selectedVenueName={matchedCuratedVenue?.name}
                      selectedDate={selectedDate}
                      selectedTime={selectedTime}
                      weatherSummary={isWeatherSkipped ? 'Climate context skipped' : weatherNote}
                      weatherCondition={isWeatherSkipped ? 'Climate-Agnostic' : selectedWeatherCond}
                      locationStatus={locationStatus}
                      selectedMoods={selectedMoods}
                      selectedPreferences={selectedPreferences}
                      mustInclude={mustInclude}
                      avoidItems={avoidItems}
                      onEditOccasion={() => {
                        setPlannerStep(1);
                        window.requestAnimationFrame(() => scrollStudioSection());
                      }}
                      onEditDestination={() => {
                        setPlannerStep(1);
                        window.requestAnimationFrame(() => scrollStudioSection());
                      }}
                      onEditMoods={() => scrollStudioSection('stylist-mood-section')}
                      onEditPreferences={() => scrollStudioSection('stylist-preferences-section')}
                      onEditConstraints={() => scrollStudioSection('stylist-constraints-section')}
                      onGenerate={() => {
                        if (!requireRegisteredUser('personalized-styling', '/stylist', 'Generate Curated Outfit')) {
                          return;
                        }
                        resetStylistSession(3, { resetChat: true });
                        setIsSynthesizingOutfit(true);
                        window.requestAnimationFrame(() => scrollStudioSection());
                      }}
                    />
                  </div>

                </div>
              )}

              {/* STEP 3: AVATAR-FIRST OUTFIT RESULT EXPERIENCE */}
              {plannerStep === 3 && (
                !isAuthenticated && effectiveRestoredLook?.sourceKind !== 'curated-default' ? (
                  <div className="max-w-xl mx-auto my-8 rounded-3xl border border-[var(--border-gold)] bg-[var(--bg-card)] p-8 text-center space-y-4 shadow-sm animate-fadeIn">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] mx-auto">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-playfair text-2xl font-bold text-[var(--text-heading)]">
                        Sign in for personalized outfit curation
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] leading-relaxed">
                        Guest Demo lets you explore sample saved looks and curated venue plans. Create a free account to generate and refine outfits from your own closet.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          requireRegisteredUser('personalized-styling', '/stylist', 'Generate Personalized Outfits')
                        }
                        className="px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                      >
                        Create Free Account
                      </button>
                      <button
                        type="button"
                        onClick={() => resetStylistSession(1)}
                        className="px-4 py-2.5 rounded-full border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                      >
                        Back to Planner
                      </button>
                    </div>
                  </div>
                ) : (
                <div className="max-w-7xl mx-auto w-full space-y-6 pb-12 animate-fadeIn">
                  {isSynthesizingOutfit ? (
                    <OutfitGenerationLoader
                      occasion={selectedOccasion}
                      venueName={resolvedDestinationName}
                      onComplete={() => setIsSynthesizingOutfit(false)}
                      durationMs={1300}
                    />
                  ) : (
                    <>
                      {!isAuthenticated && effectiveRestoredLook?.sourceKind === 'curated-default' && (
                        <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)]/60 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 text-[var(--text-body)]">
                            <Eye className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                            <span>
                              <strong className="text-[var(--text-heading)]">Sample Look Preview:</strong>{' '}
                              Explore how OTD structures garments across five slots. Create an account to save favorites or customize pieces from your own closet.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              requireRegisteredUser('personalized-styling', '/stylist', 'Customize Outfits with Your Closet')
                            }
                            className="px-3.5 py-1.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-[11px] font-bold shrink-0 cursor-pointer hover:opacity-90 transition-opacity self-start sm:self-center"
                          >
                            Create Free Account
                          </button>
                        </div>
                      )}

                      {/* Toast Feedback for Garment Swap */}
                      {swapToast && (
                        <div className="p-3 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-xs font-semibold text-center flex items-center justify-center gap-2 shadow-lg animate-fadeIn border border-[var(--border-gold)]">
                          <Check className="w-4 h-4 text-[var(--gold-primary)]" />
                          <span>{swapToast}</span>
                        </div>
                      )}

                      {/* SECTION A: Refined Outfit Header */}
                      <OutfitResultHeader
                        title={activeOutfitTitle}
                        subtitle={activeOutfitSubtitle}
                        occasion={selectedOccasion}
                        destination={resolvedDestinationName}
                        venueCategory={selectedVenueCategory}
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        weatherCondition={isWeatherSkipped ? 'Climate-Agnostic' : selectedWeatherCond}
                        weatherSummary={weatherNote}
                        selectedMoods={selectedMoods}
                        harmonyScore={effectiveHarmonyScore}
                      />

                      {/* SECTION B & C: Main Editorial Two-Column Composition */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                        {/* Left Column (7 cols): Avatar-First Visualization & Editorial Rationale */}
                        <div className="lg:col-span-7 space-y-6">
                          <AvatarOutfitCanvas
                            slots={effectiveSlots}
                            profile={profile}
                            occasion={selectedOccasion}
                            outfitTitle={activeOutfitTitle}
                            isLoading={isSynthesizingOutfit}
                            selectedSlotKey={selectedOutfitSlotKey}
                            onActiveSlotChange={setSelectedOutfitSlotKey}
                            onSlotSelect={isAuthenticated ? handleOpenSwapModal : undefined}
                            onChangeSlotItem={handleOpenSwapModal}
                          />

                          <OutfitRationaleCard
                            occasion={selectedOccasion}
                            venueName={resolvedDestinationName}
                            venueCategory={selectedVenueCategory}
                            weatherCondition={selectedWeatherCond}
                            weatherSummary={weatherNote}
                            isWeatherSkipped={isWeatherSkipped}
                            selectedPreferences={selectedPreferences}
                            selectedMoods={selectedMoods}
                            mustInclude={mustInclude}
                            avoidItems={avoidItems}
                            profile={profile}
                          />
                        </div>

                        {/* Right Column (5 cols): Actions Toolbar, 5 Standardized Slots & Preserved Stylist Concierge */}
                        <div className="lg:col-span-5 space-y-6">
                          <OutfitActionToolbar
                            isSaved={isAuthenticated && isCurrentOutfitSaved}
                            isGuestPreview={!isAuthenticated}
                            onSave={handleSaveCurrentLook}
                            onRegenerate={() => {
                              if (
                                !requireRegisteredUser(
                                  'personalized-styling',
                                  '/stylist',
                                  'Generate Another Outfit Variation',
                                )
                              ) {
                                return;
                              }
                              resetStylistSession(3, { keepVariation: true });
                              setIsSynthesizingOutfit(true);
                              setOutfitVariationIndex((prev) => prev + 1);
                            }}
                            onRefineWithChat={() => {
                              const chatElem = document.getElementById('stylist-concierge-chat');
                              if (chatElem) {
                                chatElem.scrollIntoView({ behavior: 'smooth' });
                              }
                            }}
                            onAdjustPlan={() => setPlannerStep(2)}
                            onNewPlan={() => resetStylistSession(1)}
                            isRegenerating={isSynthesizingOutfit}
                            outfitTitle={activeOutfitTitle}
                            occasion={selectedOccasion}
                          />

                          <OutfitSlotsList
                            slots={effectiveSlots}
                            closet={closet}
                            selectedSlotKey={selectedOutfitSlotKey}
                            onSlotClick={
                              isAuthenticated
                                ? handleOpenSwapModal
                                : (slot) => setSelectedOutfitSlotKey(slot.slot)
                            }
                            onSlotChangeClick={handleOpenSwapModal}
                            outfitContext={{
                              occasion: selectedOccasion,
                              venue: resolvedDestinationName,
                              outfitTitle: activeOutfitTitle,
                            }}
                            onNavigateToShopping={() => setActiveTab('shopping')}
                            onNavigateToUpload={() => {
                              requireRegisteredUser('upload', '/closet/add', 'Upload Garments to Closet');
                            }}
                            onRequireRegistration={(action, actionTitle) =>
                              requireRegisteredUser(action, '/stylist', actionTitle)
                            }
                          />

                          {/* Preserved Stylist Concierge Chat Box with Responsive Height (DEF-05) */}
                          <div
                            id="stylist-concierge-chat"
                            className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden shadow-sm flex flex-col h-[360px] sm:h-[440px] md:h-[490px] max-h-[60vh] sm:max-h-[70vh]"
                          >
                            {/* Stylist Concierge Header */}
                            <div className="p-3.5 sm:p-4 border-b border-[var(--border-card)] flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-header)]">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-[#FAF5ED] p-1 border border-[#D5C29D] flex items-center justify-center shrink-0">
                                  <img src="/otd_logo.png" alt="OTD" className="w-full h-full object-contain" />
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-playfair text-sm font-bold text-[var(--text-heading)] truncate">
                                    OTD AI Stylist Concierge
                                  </h4>
                                  <p className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                                    <span>● Demo Assistant · Local Preview</span>
                                  </p>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] text-[var(--gold-primary)] shrink-0">
                                Local Calibration
                              </span>
                            </div>

                            {/* Messages Stream */}
                            <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs">
                              {chatMessages.map((msg, i) => (
                                <div
                                  key={i}
                                  className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  {msg.sender === 'ai' && (
                                    <div className="w-6 h-6 rounded-full bg-[#FAF5ED] p-0.5 border border-[#D5C29D] shrink-0 flex items-center justify-center">
                                      <img src="/otd_logo.png" alt="OTD" className="w-full h-full object-contain" />
                                    </div>
                                  )}
                                  <div
                                    className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                                      msg.sender === 'user'
                                        ? 'bg-amber-100/70 dark:bg-amber-950/40 text-[var(--text-heading)] rounded-tr-none'
                                        : 'bg-[var(--pill-bg)] text-[var(--text-body)] rounded-tl-none border border-[var(--border-card)]'
                                    }`}
                                  >
                                    <p>{msg.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* 7 Standardized Refinement Preference Chips (Part 4) */}
                            <div className="p-3 border-t border-[var(--border-card)] bg-[var(--pill-bg)]/40">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-[10px] uppercase font-mono tracking-wider text-[var(--gold-primary)] font-semibold">
                                  Refinement Preferences:
                                </p>
                                <span className="text-[9px] text-[var(--text-muted)] font-mono">
                                  Click to calibrate look
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5">
                                {[
                                  'Make it more casual.',
                                  'Make it more formal.',
                                  'Try a different colour combination.',
                                  'Make it more comfortable.',
                                  'Prefer minimal styling.',
                                  'Make it more elegant.',
                                  'Use different footwear.',
                                ].map((instruction) => (
                                  <button
                                    key={instruction}
                                    type="button"
                                    onClick={() => handleSendChat(instruction)}
                                    className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--bg-card)] border border-[var(--border-card)] hover:border-[var(--gold-primary)] hover:text-[var(--gold-primary)] transition-all cursor-pointer text-left shadow-2xs"
                                  >
                                    "{instruction}"
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Input Box */}
                            <div className="p-3 border-t border-[var(--border-card)] flex items-center gap-2">
                              <input
                                type="text"
                                aria-label="Custom stylist instruction"
                                placeholder="Custom instruction (e.g. 'Swap in something darker or more relaxed')..."
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                                className="flex-1 py-2 px-3.5 text-xs rounded-full bg-[var(--bg-card)] border border-[var(--border-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)]"
                              />
                              <button
                                type="button"
                                onClick={() => handleSendChat()}
                                className="w-8 h-8 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:scale-105 transition-all cursor-pointer shrink-0"
                                aria-label="Send message"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Modal for Individual Garment Swapping */}
                      {isGarmentSwapOpen && activeSwapSlot && (
                        <GarmentSwapModal
                          key={`${activeSwapSlot.slot}:${activeSwapSlot.closetItemId ?? 'empty'}`}
                          isOpen={isGarmentSwapOpen}
                          onClose={handleCloseSwapModal}
                          slot={activeSwapSlot}
                          allSlots={effectiveSlots}
                          closet={closet}
                          onApplySwap={handleApplySwap}
                        />
                      )}
                    </>
                  )}
                </div>
                )
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DIGITAL CLOSET MATRIX (Full Features, Search, Filters & CRUD) */}
          {/* ========================================================================= */}
          {activeTab === 'closet' && (
            isUploadRoute ? (
              isAuthenticated ? (
                <Suspense
                  fallback={
                    <div
                      role="status"
                      className="p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-3 text-xs text-[var(--text-muted)]"
                    >
                      <div className="w-8 h-8 rounded-full border-2 border-[var(--border-gold)] border-t-[var(--gold-primary)] animate-spin" />
                      <span>Opening garment acquisition intake...</span>
                    </div>
                  }
                >
                  <ClosetUploadView
                    onBack={onBackFromUpload || (() => setActiveTab('closet'))}
                    onComplete={onBackFromUpload || (() => setActiveTab('closet'))}
                  />
                </Suspense>
              ) : (
                <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-2xl mx-auto w-full my-8">
                  <div className="rounded-3xl border border-[var(--border-gold)] bg-[var(--bg-card)] p-8 text-center space-y-4 shadow-sm">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-[var(--gold-primary)] mx-auto">
                      <Lock className="w-6 h-6" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--gold-primary)] font-bold block">
                        Account Required
                      </span>
                      <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                        Register to Upload Your Garments
                      </h2>
                      <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                        Guest mode includes a sample wardrobe to explore. Create a free account or sign in to upload personal clothing photos and build your digital closet.
                      </p>
                    </div>
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          requireRegisteredUser('upload', '/closet/add', 'Upload Personal Clothing Items')
                        }
                        className="px-6 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-sm"
                      >
                        Create Free Account / Sign In
                      </button>
                      <button
                        type="button"
                        onClick={onBackFromUpload || (() => setActiveTab('closet'))}
                        className="px-5 py-2.5 rounded-full border border-[var(--border-card)] text-xs font-semibold text-[var(--text-heading)] hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                      >
                        Explore Sample Closet
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
              {/* Storage Quota Warning Banner */}
              {storageWarning && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>{storageWarning}</span>
                  </div>
                  <button
                    onClick={() => setStorageWarning(null)}
                    className="p-1 text-amber-700 dark:text-amber-300 hover:opacity-75 cursor-pointer"
                    aria-label="Dismiss storage warning"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Closet Header & View Switcher */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                    Digital Closet Matrix
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {closetViewMode === 'active'
                      ? `${activeClosetItems.length} active pieces cataloged • Ready for AI styling & destination adaptation`
                      : `${archivedClosetItems.length} archived pieces • Safely preserved off-rotation`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* View Mode Toggle: Active vs. Archived */}
                  <div
                    role="tablist"
                    aria-label="Closet view options"
                    className="flex items-center p-1 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)]"
                  >
                    <button
                      role="tab"
                      aria-selected={closetViewMode === 'active'}
                      onClick={() => setClosetViewMode('active')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        closetViewMode === 'active'
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                      }`}
                    >
                      <Shirt className="w-3.5 h-3.5" />
                      <span>Active</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 font-mono">
                        {activeClosetItems.length}
                      </span>
                    </button>

                    <button
                      role="tab"
                      aria-selected={closetViewMode === 'archived'}
                      onClick={() => setClosetViewMode('archived')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        closetViewMode === 'archived'
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-heading)]'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archived</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/20 font-mono">
                        {archivedClosetItems.length}
                      </span>
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (!requireRegisteredUser('upload', '/closet/add', 'Upload Personal Garment')) return;
                      if (onNavigateToUpload) {
                        onNavigateToUpload();
                      } else {
                        onOpenAddPiece();
                      }
                    }}
                    className="px-4 sm:px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Add Piece</span>
                  </button>
                </div>
              </div>

              {/* Informational Banner for Archived View */}
              {closetViewMode === 'archived' && (
                <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] border border-[var(--border-card)] text-xs text-[var(--text-muted)] flex items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <Archive className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                    <span>
                      Archived pieces are hidden from active AI outfit recommendations and garment swapping. Click any piece to inspect or restore it to your active rotation.
                    </span>
                  </div>
                  <button
                    onClick={() => setClosetViewMode('active')}
                    className="text-[11px] font-bold text-[var(--gold-primary)] hover:underline shrink-0 cursor-pointer"
                  >
                    Back to Active
                  </button>
                </div>
              )}

              {/* Search, Filter & Sorting Bar */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Search Input */}
                  <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      maxLength={CLOSET_SEARCH_MAX_LENGTH}
                      placeholder="Search garments by name, brand, color, or fabric..."
                      value={closetSearch}
                      onChange={(e) => setClosetSearch(e.target.value)}
                      aria-label="Search garments in closet"
                      className="w-full pl-10 pr-9 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)]"
                    />
                    {closetSearch && (
                      <button
                        type="button"
                        onClick={() => setClosetSearch('')}
                        aria-label="Clear search"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-heading)]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    {/* Formality Filter */}
                    <select
                      value={closetFormalityFilter}
                      onChange={(e) =>
                        setClosetFormalityFilter(
                          e.target.value === 'all' ? 'all' : Number(e.target.value)
                        )
                      }
                      aria-label="Filter by formality tier"
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] cursor-pointer"
                    >
                      <option value="all">All Formality Tiers</option>
                      <option value={1}>Tier 1: Casual / Street</option>
                      <option value={2}>Tier 2: Smart Casual</option>
                      <option value={3}>Tier 3: Elevated Social</option>
                      <option value={4}>Tier 4: Sartorial Tailored</option>
                      <option value={5}>Tier 5: Black-Tie Formal</option>
                    </select>

                    {/* Sorting Dropdown */}
                    <div className="relative flex-1 sm:flex-initial">
                      <select
                        value={closetSortOption}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (
                            val === 'recent' ||
                            val === 'oldest' ||
                            val === 'formality-desc' ||
                            val === 'formality-asc' ||
                            val === 'name-asc'
                          ) {
                            setClosetSortOption(val);
                          }
                        }}
                        aria-label="Sort wardrobe garments"
                        className="w-full px-3.5 py-2 pr-8 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)] text-xs text-[var(--text-heading)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] focus:border-[var(--gold-primary)] cursor-pointer appearance-none font-medium"
                      >
                        <option value="recent">Recently Added</option>
                        <option value="oldest">Oldest</option>
                        <option value="formality-desc">Formality: High to Low</option>
                        <option value="formality-asc">Formality: Low to High</option>
                        <option value="name-asc">Name: A–Z</option>
                      </select>
                      <ArrowUpDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: 'all', label: `All (${currentPool.length})` },
                      { id: 'tops', label: `Tops (${currentPool.filter((i) => i.category === 'tops').length})` },
                      { id: 'bottoms', label: `Bottoms (${currentPool.filter((i) => i.category === 'bottoms').length})` },
                      { id: 'outerwear', label: `Outerwear (${currentPool.filter((i) => i.category === 'outerwear').length})` },
                      { id: 'footwear', label: `Footwear (${currentPool.filter((i) => i.category === 'footwear').length})` },
                      { id: 'accessories', label: `Accessories (${currentPool.filter((i) => i.category === 'accessories').length})` },
                    ] satisfies Array<{ id: 'all' | ClosetItem['category']; label: string }>
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setClosetCategoryFilter(tab.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        closetCategoryFilter === tab.id
                          ? 'bg-black text-white dark:bg-white dark:text-black shadow-xs'
                          : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border-card)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Garment Matrix Area with Distinct Empty States */}
              {closetViewMode === 'active' && activeClosetItems.length === 0 ? (
                /* PART 4: FIRST-TIME EMPTY CLOSET STATE */
                <div className="py-20 px-6 text-center rounded-3xl border border-dashed border-[var(--border-gold)]/60 bg-[var(--bg-card)]/50 backdrop-blur-xs space-y-5 max-w-2xl mx-auto my-6 animate-in fade-in">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-[var(--pill-bg)] border border-[var(--border-gold)] flex items-center justify-center text-3xl shadow-inner text-[var(--gold-primary)]">
                    <Sparkles className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                      Your Digital Closet is waiting.
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
                      Catalog your signature wardrobe pieces to unlock hyper-personalized AI styling, context-calibrated outfits, and venue-ready ensembles.
                    </p>
                  </div>
                  <div className="pt-2 flex justify-center">
                    <button
                      onClick={() => {
                        if (!requireRegisteredUser('upload', '/closet/add', 'Upload Your First Garment')) return;
                        if (onNavigateToUpload) {
                          onNavigateToUpload();
                        } else {
                          onOpenAddPiece();
                        }
                      }}
                      className="px-6 py-3 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all flex items-center gap-2 cursor-pointer shadow-lg"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Your First Garment</span>
                    </button>
                  </div>
                </div>
              ) : closetViewMode === 'archived' && archivedClosetItems.length === 0 ? (
                /* EMPTY ARCHIVED CLOSET STATE */
                <div className="py-16 px-6 text-center rounded-3xl border border-dashed border-[var(--border-card)] bg-[var(--pill-bg)]/30 space-y-4 max-w-lg mx-auto my-6 animate-in fade-in">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex items-center justify-center text-[var(--text-muted)]">
                    <Archive className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                      No archived garments
                    </h4>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed max-w-sm mx-auto">
                      Archiving allows you to safely store off-season or retired garments without deleting their styling history or metadata.
                    </p>
                  </div>
                  <button
                    onClick={() => setClosetViewMode('active')}
                    className="px-5 py-2 rounded-full border border-[var(--border-gold)] text-[var(--gold-primary)] text-xs font-semibold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                  >
                    Return to Active Wardrobe
                  </button>
                </div>
              ) : filteredAndSortedClosetItems.length === 0 ? (
                /* SEARCH / FILTER NOT FOUND STATE */
                <div className="py-16 text-center rounded-3xl border border-dashed border-[var(--border-card)] p-8 space-y-3 bg-[var(--pill-bg)]/30 max-w-md mx-auto my-6 animate-in fade-in">
                  <Shirt className="w-10 h-10 mx-auto text-[var(--text-muted)]" />
                  <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                    No garments match your search
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    No garments match "{closetSearch || 'the selected filters'}". Try adjusting your search query, formality tier, or category filter.
                  </p>
                  <button
                    onClick={() => {
                      setClosetSearch('');
                      setClosetCategoryFilter('all');
                      setClosetFormalityFilter('all');
                    }}
                    className="px-5 py-2 rounded-full border border-[var(--border-gold)] text-[var(--gold-primary)] text-xs font-semibold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                /* RESPONSIVE GARMENT MATRIX GRID */
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredAndSortedClosetItems.map((piece) => (
                    <button
                      key={piece.id}
                      type="button"
                      aria-label={`Inspect ${piece.name}, ${piece.brand || ''} ${piece.category}`}
                      onClick={() => setSelectedClosetItem(piece)}
                      className={`w-full text-left rounded-2xl border bg-[var(--bg-card)] overflow-hidden flex flex-col group shadow-xs hover:shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] ${
                        piece.isArchived
                          ? 'border-amber-500/40 opacity-85 hover:opacity-100 hover:border-amber-500'
                          : 'border-[var(--border-card)] hover:border-[var(--gold-primary)]'
                      }`}
                    >
                      <div className="h-44 w-full bg-neutral-900 relative overflow-hidden flex items-center justify-center p-2">
                        {piece.imageUrl ? (
                          <img
                            src={piece.imageUrl}
                            alt={piece.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-neutral-800 flex flex-col items-center justify-center text-4xl group-hover:scale-105 transition-transform duration-300">
                            <span>{piece.icon}</span>
                          </div>
                        )}
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-mono backdrop-blur-md uppercase">
                          {piece.category}
                        </span>
                        {piece.isArchived && (
                          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-amber-600/90 text-white text-[9px] font-mono font-semibold backdrop-blur-md uppercase flex items-center gap-1">
                            <Archive className="w-2.5 h-2.5" />
                            <span>Archived</span>
                          </span>
                        )}
                      </div>
                      <div className="p-3 space-y-1 w-full">
                        <h5 className="text-xs font-bold text-[var(--text-heading)] truncate">
                          {piece.name}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                          <span>{piece.color}</span>
                          <span>{piece.fit}</span>
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-[var(--gold-primary)] font-mono font-semibold truncate">
                            {piece.brand || 'Personal Piece'}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-[var(--pill-bg)] text-[var(--text-muted)] border border-[var(--border-card)]">
                            Tier {piece.formality}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            )
          )}

          {/* ========================================================================= */}
          {/* TAB 4: DESTINATIONS MODE (Eliminating Dead Screen) */}
          {/* ========================================================================= */}
          {activeTab === 'destinations' && (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
              <div>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                  Destination Mode & Venues
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Browse curated nightlife, fine dining, and cultural enclaves with automated ambience & dress-code matching
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {CURATED_VENUES.map((venue) => (
                  <div
                    key={venue.id}
                    className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden flex flex-col justify-between group shadow-xs hover:shadow-md transition-all hover:border-[var(--gold-primary)]"
                  >
                    <div>
                      <div className="h-44 bg-neutral-900 relative overflow-hidden">
                        <img
                          src={venue.img}
                          alt={venue.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono backdrop-blur-md uppercase">
                          {venue.category}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                          {venue.name}
                        </h4>
                        <p className="text-xs text-[var(--gold-primary)] flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{venue.location}</span>
                        </p>
                        <p className="text-xs text-[var(--text-body)] line-clamp-2 leading-relaxed">
                          {venue.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-2 text-[10px]">
                          <span className="px-2 py-0.5 rounded-full bg-[var(--pill-bg)] text-[var(--text-muted)] border border-[var(--border-card)]">
                            {venue.ambience}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-[var(--pill-bg)] text-[var(--text-muted)] border border-[var(--border-card)]">
                            {venue.dressCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 pt-0">
                      <button
                        onClick={() => handleSelectVenueForStyling(venue)}
                        className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 hover:scale-[1.02] transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        <span>Style Me for this Place</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: CALENDAR & UPCOMING PLANS (Eliminating Dead Screen) */}
          {/* ========================================================================= */}
          {activeTab === 'calendar' && (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                    Outfit Calendar & Planner
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Pre-plan ensembles for upcoming events and track worn looks to avoid social duplicates
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetStylistSession(1);
                    setActiveTab('stylist');
                  }}
                  className="px-5 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Plan Outfit for Day</span>
                </button>
              </div>

              {/* Weekly Schedule Row with Interactive Day Inspection (DEF-10) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekScheduleDays.map((item) => (
                  <div
                    key={item.key}
                    className={`p-3 rounded-2xl border bg-[var(--bg-card)] flex flex-col justify-between space-y-2 hover:border-[var(--gold-primary)] transition-all ${
                      item.isToday
                        ? 'border-[var(--gold-primary)] ring-1 ring-[var(--gold-primary)]/40 shadow-xs'
                        : 'border-[var(--border-card)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs uppercase font-bold text-[var(--gold-primary)]">{item.name}</span>
                        {item.isToday && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[var(--gold-primary)]/20 text-[var(--gold-primary)]">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="font-playfair text-sm font-bold text-[var(--text-heading)]">
                        {item.day} {item.month}
                      </span>
                    </div>

                    {item.planned ? (
                      <button
                        type="button"
                        onClick={() => setSelectedCalendarDay(item)}
                        aria-label={`View planned look for ${item.name}, ${item.occasion}`}
                        className="w-full space-y-1.5 cursor-pointer group text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-primary)] rounded-xl"
                      >
                        <div className="h-28 rounded-xl overflow-hidden bg-neutral-900 relative">
                          <img src={item.img} alt={item.occasion} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <span className="px-2.5 py-1 rounded-full bg-black/80 text-white text-[10px] font-bold">
                              Inspect Look
                            </span>
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-[var(--text-heading)] block line-clamp-1 group-hover:text-[var(--gold-primary)] transition-colors">
                          {item.occasion}
                        </span>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-emerald-600 font-semibold">✓ Planned</span>
                          <span className="text-[var(--gold-primary)] font-medium underline">Preview</span>
                        </div>
                      </button>
                    ) : (
                      <div className="py-7 text-center space-y-1.5 flex flex-col items-center justify-center">
                        <span className="text-xs text-[var(--text-muted)] block">No plan yet</span>
                        <button
                          type="button"
                          onClick={() => {
                            resetStylistSession(1);
                            setSelectedOccasion(item.occasion || 'Smart Casual');
                            setActiveTab('stylist');
                          }}
                          className="px-3 py-1.5 rounded-full border border-[var(--border-gold)] text-[10px] text-[var(--gold-primary)] font-bold hover:bg-[var(--pill-bg)] transition-colors cursor-pointer"
                        >
                          + Plan Ensemble
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Calendar Informational Guidance */}
              <div className="p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
                  <span>
                    Ensembles are calibrated locally to prevent event duplicates and keep your wardrobe organized.
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[11px] shrink-0 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Outfit Planned</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[var(--text-muted)]" />
                    <span>Open Day</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: OUTFIT IDEAS / LOOKBOOK GALLERY (Eliminating Dead Screen) */}
          {/* ========================================================================= */}
          {activeTab === 'ideas' && (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
              <div>
                <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                  Haute Lookbook & Outfit Ideas
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Curated editorial looks crafted for international destinations and quiet-luxury styling
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    title: 'The Milanese Tailored Linen',
                    tag: 'Summer Sartorial',
                    img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80',
                    desc: 'Breathable oatmeal linen trousers paired with open camp collar shirt and hand-finished loafers.',
                  },
                  {
                    title: 'The Parisian Monochrome',
                    tag: 'Minimalist Date',
                    img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
                    desc: 'All-black high-neck cashmere sweater with sharp wool trousers and understated Chelsea boots.',
                  },
                  {
                    title: 'The Riviera Seaside Resort',
                    tag: 'Effortless Vacation',
                    img: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=600&q=80',
                    desc: 'Crisp sand linen overshirt with white Gurkha shorts, tortoise sunglasses, and clean canvas low-tops.',
                  },
                ].map((idea, i) => (
                  <div
                    key={i}
                    className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden shadow-xs hover:shadow-md transition-all group"
                  >
                    <div className="h-64 bg-neutral-900 relative overflow-hidden">
                      <img
                        src={idea.img}
                        alt={idea.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono uppercase backdrop-blur-md">
                        {idea.tag}
                      </span>
                    </div>
                    <div className="p-5 space-y-3">
                      <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                        {idea.title}
                      </h4>
                      <p className="text-xs text-[var(--text-body)] leading-relaxed">
                        {idea.desc}
                      </p>
                      <button
                        onClick={() => {
                          if (
                            !requireRegisteredUser(
                              'personalized-styling',
                              '/stylist',
                              `Recreate "${idea.title}" with Your Closet`,
                            )
                          ) {
                            return;
                          }
                          resetStylistSession(3);
                          setActiveTab('stylist');
                          setCurrentOutfitTitle(idea.title);
                        }}
                        className="w-full py-2.5 rounded-xl border border-[var(--border-gold)] bg-[var(--pill-bg)] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                        <span>Recreate with My Closet</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: SAVED LOOKS & FAVORITES (Eliminating Dead Screen) */}
          {/* ========================================================================= */}
          {activeTab === 'saved' && (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-7xl mx-auto w-full space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                    Saved Looks & Favorites
                  </h2>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {savedLooksList.length} curated {savedLooksList.length === 1 ? 'ensemble' : 'ensembles'} bookmarked • {favoriteLooksCount} favorited
                  </p>
                </div>
              </div>

              {savedLooksList.length === 0 ? (
                <div className="py-16 text-center rounded-3xl border border-dashed border-[var(--border-card)] p-8 space-y-3 bg-[var(--pill-bg)]/30">
                  <Bookmark className="w-10 h-10 mx-auto text-[var(--text-muted)]" />
                  <h4 className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                    No saved looks yet
                  </h4>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                    When you find an outfit you love in the AI Stylist or Lookbook, tap the heart icon to save it here.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      resetStylistSession(1);
                      setActiveTab('stylist');
                    }}
                    className="px-5 py-2 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold cursor-pointer"
                  >
                    Go to AI Stylist
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {savedLooksList.map((look) => (
                    <div
                      key={look.id}
                      className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="h-52 bg-neutral-900 relative">
                          <img
                            src={look.imageUrl || SAFE_LOOK_FALLBACK_IMAGE}
                            alt={look.title}
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (target.dataset.fallbackApplied === 'true') return;
                              target.dataset.fallbackApplied = 'true';
                              target.src = SAFE_LOOK_FALLBACK_IMAGE;
                            }}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleToggleFavoriteSavedLook(look.id)}
                              aria-label={look.isFavorite ? `Unfavorite ${look.title}` : `Favorite ${look.title}`}
                              aria-pressed={look.isFavorite}
                              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 transition-transform cursor-pointer"
                              title={look.isFavorite ? 'Remove from Favorites' : 'Mark as Favorite'}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  look.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white'
                                }`}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSavedLook(look.id)}
                              aria-label={`Delete ${look.title} from saved looks`}
                              className="w-7 h-7 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-rose-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Remove from saved"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-mono text-[var(--gold-primary)] font-bold truncate">
                              {look.occasion}
                            </span>
                            <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                              {formatSavedLookDateLabel(look)}
                            </span>
                          </div>
                          <h4 className="font-playfair text-base font-bold text-[var(--text-heading)]">
                            {look.title}
                          </h4>
                          <p className="text-xs text-[var(--text-body)] line-clamp-2">
                            {formatSavedLookPiecesSummary(look)}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-[var(--text-muted)]">
                            <span className="px-2 py-0.5 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] font-mono">
                              {look.garmentIds.length > 0
                                ? `${look.garmentIds.length} closet ${look.garmentIds.length === 1 ? 'piece' : 'pieces'}`
                                : 'Editorial look'}
                            </span>
                            {look.venue && (
                              <span className="px-2 py-0.5 rounded-full bg-[var(--pill-bg)] border border-[var(--border-card)] truncate max-w-[160px]">
                                {look.venue}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          type="button"
                          onClick={() => handleWearSavedLook(look)}
                          className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Wear / View Look</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: VIRTUAL TRY-ON STUDIO (Polished & Honest) */}
          {/* ========================================================================= */}
          {activeTab === 'tryon' && (
            <div className="p-5 pb-24 md:pb-7 lg:p-7 max-w-4xl mx-auto w-full text-center space-y-6">
              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="font-playfair text-2xl sm:text-3xl font-bold text-[var(--text-heading)]">
                    Virtual Try-On Studio
                  </h2>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    Preview / Beta
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1.5 max-w-md mx-auto">
                  Drape your curated ensembles onto your calibrated biometric Style Avatar silhouette
                </p>
              </div>

              <div className="rounded-3xl border border-[var(--border-card)] bg-[var(--bg-card)] p-6 sm:p-8 shadow-xl max-w-md mx-auto space-y-4">
                <div className="h-96 rounded-2xl overflow-hidden relative border border-[var(--border-card)] shadow-inner bg-neutral-900">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"
                    alt="Avatar Try-On"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-4 text-white text-left">
                    <p className="font-playfair text-base sm:text-lg font-bold">
                      {userDisplayName} ({profile.height || '178 cm'} • {profile.bodyShape || 'Athletic'})
                    </p>
                    <p className="text-xs text-amber-300 font-mono">Draped: {activeOutfitTitle} (Size M)</p>
                  </div>
                </div>

                {/* Capability & Architecture Status Grid */}
                <div className="grid grid-cols-1 min-[360px]:grid-cols-3 gap-2 text-[10px] font-mono py-1">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>✓ 2D Drape</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>✓ Biometrics</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">
                    <span>⏳ 3D (Phase 2)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[var(--pill-bg)] text-xs text-[var(--text-muted)] leading-relaxed text-left space-y-1">
                  <p className="font-semibold text-[var(--text-heading)]">Preview Architecture Notice</p>
                  <p>
                    This preview generates instant 2D editorial silhouettes based on your biometric profile. Full WebGL 3D cloth physics and multi-angle mesh rendering are in active development for Cloud Phase 2.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-6 py-2.5 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold hover:scale-105 transition-all flex items-center gap-2 cursor-pointer mx-auto shadow-md"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Calibrate Style Avatar Biometrics</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB: WARDROBE-AWARE SHOPPING LIST (TASK 8) */}
          {/* ========================================================================= */}
          {activeTab === 'shopping' && (
            <Suspense
              fallback={
                <div
                  role="status"
                  className="p-8 lg:p-12 max-w-4xl mx-auto w-full flex flex-col items-center justify-center gap-3 text-xs text-[var(--text-muted)]"
                >
                  <div className="w-8 h-8 rounded-full border-2 border-[var(--border-gold)] border-t-[var(--gold-primary)] animate-spin" />
                  <span>Loading Wardrobe Wishlist...</span>
                </div>
              }
            >
              <ShoppingListView
                onNavigateToStylist={() => {
                  resetStylistSession(1);
                  setActiveTab('stylist');
                }}
                onNavigateToCloset={(searchTerm) => {
                  if (searchTerm) setClosetSearch(searchTerm);
                  setActiveTab('closet');
                }}
                onOpenAddPiece={() => {
                  if (!requireRegisteredUser('upload', '/closet/add', 'Add Garment to Your Closet')) return;
                  if (onNavigateToUpload) {
                    onNavigateToUpload();
                  } else {
                    onOpenAddPiece();
                  }
                }}
                onRequireRegistration={(action, actionTitle) =>
                  requireRegisteredUser(action, '/shopping', actionTitle)
                }
              />
            </Suspense>
          )}

        </main>

      </div>

      {/* ========================================================================= */}
      {/* MOBILE PERSISTENT NAVIGATION (<768px) */}
      {/* ========================================================================= */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        onOpenMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        closetCount={closet.length}
        savedCount={likedLooks.length}
        isMenuOpen={mobileMenuOpen}
      />

      {/* Mobile Drawer Menu (DEF-06 improved feedback & active highlighting) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More Navigation Menu"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            ref={mobileDrawerRef}
            className="bg-[var(--bg-card)] rounded-t-3xl border-t border-[var(--border-card)] p-6 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
              <span className="font-playfair text-base font-bold text-[var(--text-heading)]">More Navigation</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close mobile navigation menu"
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('shopping');
                  setMobileMenuOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center justify-between font-semibold col-span-2 active:scale-[0.98] transition-all cursor-pointer ${
                  activeTab === 'shopping'
                    ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]/40 text-[var(--gold-primary)]'
                    : 'border-[var(--border-card)] bg-[var(--pill-bg)]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[var(--gold-primary)]" />
                  <span>Wardrobe Shopping List</span>
                </div>
                {unacquiredShoppingCount > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-[var(--gold-primary)]/15 text-[var(--gold-primary)]">
                    {unacquiredShoppingCount} missing
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('destinations');
                  setMobileMenuOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 font-semibold active:scale-[0.98] transition-all cursor-pointer ${
                  activeTab === 'destinations'
                    ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]/40 text-[var(--gold-primary)]'
                    : 'border-[var(--border-card)]'
                }`}
              >
                <Compass className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Destinations</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('calendar');
                  setMobileMenuOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 font-semibold active:scale-[0.98] transition-all cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]/40 text-[var(--gold-primary)]'
                    : 'border-[var(--border-card)]'
                }`}
              >
                <Calendar className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Calendar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ideas');
                  setMobileMenuOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 font-semibold active:scale-[0.98] transition-all cursor-pointer ${
                  activeTab === 'ideas'
                    ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]/40 text-[var(--gold-primary)]'
                    : 'border-[var(--border-card)]'
                }`}
              >
                <Shirt className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Outfit Ideas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tryon');
                  setMobileMenuOpen(false);
                }}
                className={`p-3 rounded-xl border text-left flex items-center gap-2 font-semibold active:scale-[0.98] transition-all cursor-pointer ${
                  activeTab === 'tryon'
                    ? 'border-[var(--gold-primary)] bg-[var(--pill-bg)] ring-1 ring-[var(--gold-primary)]/40 text-[var(--gold-primary)]'
                    : 'border-[var(--border-card)]'
                }`}
              >
                <Camera className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Virtual Try-On</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="p-3 rounded-xl border border-[var(--border-card)] text-left flex items-center gap-2 font-semibold active:scale-[0.98] transition-all cursor-pointer"
              >
                <Settings className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Settings</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="p-3 rounded-xl border border-[var(--border-card)] text-left flex items-center gap-2 font-semibold active:scale-[0.98] transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>My Profile</span>
              </button>
              {isGuest && onOpenAuth ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth();
                  }}
                  className="p-3 rounded-xl border border-[var(--border-gold)] bg-[var(--pill-bg)] text-left flex items-center justify-between font-semibold col-span-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <span className="text-[var(--text-heading)]">Guest Demo Mode — Sign In</span>
                  <ArrowRight className="w-4 h-4 text-[var(--gold-primary)]" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Item Details Inspection Modal */}
      {selectedClosetItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-hidden={Boolean(itemToEdit) || Boolean(itemToDelete) ? true : undefined}
          aria-labelledby="garment-inspection-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedClosetItem(null)}
        >
          <div
            ref={inspectionModalRef}
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--border-gold)] p-6 space-y-4 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono font-bold text-[var(--gold-primary)]">
                  Garment Inspection
                </span>
                {selectedClosetItem.isArchived && (
                  <span className="text-[9px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Archive className="w-2.5 h-2.5" />
                    <span>Archived</span>
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedClosetItem(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
                aria-label="Close inspection modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-48 rounded-2xl bg-neutral-900 overflow-hidden flex items-center justify-center text-4xl relative">
              {selectedClosetItem.imageUrl ? (
                <img src={selectedClosetItem.imageUrl} alt={selectedClosetItem.name} className="w-full h-full object-cover" />
              ) : (
                <span>{selectedClosetItem.icon}</span>
              )}
              {selectedClosetItem.isArchived && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-black/80 text-amber-300 text-xs font-semibold border border-amber-400/40 flex items-center gap-1.5 shadow-lg">
                    <Archive className="w-3.5 h-3.5" />
                    <span>Preserved in Archive</span>
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 id="garment-inspection-title" className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                {selectedClosetItem.name}
              </h4>
              <p className="text-[11px] text-[var(--gold-primary)] font-mono font-semibold">
                {formatGarmentMetaParts([selectedClosetItem.brand, selectedClosetItem.subType]) || 'Personal Collection'}
              </p>
              {selectedClosetItem.description && (
                <p className="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed bg-[var(--pill-bg)] p-2 rounded-lg border border-[var(--border-card)]">
                  {selectedClosetItem.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                <span className="text-[var(--text-muted)] block text-[10px]">Color</span>
                <strong className="text-[var(--text-heading)]">{selectedClosetItem.color}</strong>
              </div>
              <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                <span className="text-[var(--text-muted)] block text-[10px]">Fit</span>
                <strong className="text-[var(--text-heading)]">{selectedClosetItem.fit}</strong>
              </div>
              <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                <span className="text-[var(--text-muted)] block text-[10px]">Category</span>
                <strong className="text-[var(--text-heading)] capitalize">{selectedClosetItem.category}</strong>
              </div>
              <div className="p-2 rounded-xl bg-[var(--pill-bg)]">
                <span className="text-[var(--text-muted)] block text-[10px]">Formality</span>
                <strong className="text-[var(--text-heading)]">Tier {selectedClosetItem.formality} / 5</strong>
              </div>
            </div>

            {/* Action Buttons: Archive, Restore, Edit, Delete */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex gap-2">
                {selectedClosetItem.isArchived ? (
                  <button
                    type="button"
                    onClick={() => {
                      const itemName = selectedClosetItem.name;
                      const itemId = selectedClosetItem.id;
                      setSelectedClosetItem(null);
                      if (
                        !requireRegisteredUser(
                          'manage-closet',
                          '/closet',
                          `Restore "${itemName}"`,
                        )
                      ) {
                        return;
                      }
                      restoreClosetItem(itemId);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-500/50 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <ArchiveRestore className="w-3.5 h-3.5" />
                    <span>Restore to Closet</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const target = selectedClosetItem;
                        if (!isAuthenticated) {
                          setSelectedClosetItem(null);
                          requireRegisteredUser(
                            'manage-closet',
                            '/closet',
                            `Edit "${target.name}"`,
                          );
                          return;
                        }
                        setItemToEdit(target);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-[var(--border-gold)] text-[var(--gold-primary)] hover:bg-[var(--pill-bg)] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Piece</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const itemName = selectedClosetItem.name;
                        const itemId = selectedClosetItem.id;
                        setSelectedClosetItem(null);
                        if (
                          !requireRegisteredUser(
                            'manage-closet',
                            '/closet',
                            `Archive "${itemName}"`,
                          )
                        ) {
                          return;
                        }
                        archiveClosetItem(itemId);
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl border border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archive</span>
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedClosetItem;
                    setSelectedClosetItem(null);
                    if (!isAuthenticated) {
                      requireRegisteredUser(
                        'manage-closet',
                        '/closet',
                        `Remove "${target.name}"`,
                      );
                      return;
                    }
                    setItemToDelete(target);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-rose-300 text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{selectedClosetItem.isArchived ? 'Delete Permanently' : 'Delete'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedClosetItem(null)}
                  className="py-2 px-4 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold cursor-pointer hover:opacity-90 transition-opacity text-[11px]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Dialog */}
      {itemToDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          aria-describedby="delete-dialog-desc"
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in"
          onClick={() => setItemToDelete(null)}
        >
          <div
            ref={deleteDialogRef}
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-rose-200 dark:border-rose-950 p-6 space-y-4 shadow-2xl text-xs text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 id="delete-dialog-title" className="font-playfair text-lg font-bold text-[var(--text-heading)]">
                {itemToDelete.isArchived ? 'Permanently Delete Garment?' : 'Remove from Closet?'}
              </h4>
              <p id="delete-dialog-desc" className="text-xs text-[var(--text-muted)] mt-1.5 leading-relaxed">
                {itemToDelete.isArchived
                  ? `Are you sure you want to permanently delete "${itemToDelete.name}"? This action cannot be reversed.`
                  : `Are you sure you want to remove "${itemToDelete.name}"? You can also archive it instead to preserve its details without including it in AI outfits.`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-card)] font-semibold cursor-pointer hover:bg-[var(--pill-bg)] transition-colors"
              >
                Cancel
              </button>
              {!itemToDelete.isArchived && (
                <button
                  type="button"
                  onClick={() => {
                    const itemName = itemToDelete.name;
                    const itemId = itemToDelete.id;
                    setItemToDelete(null);
                    if (!requireRegisteredUser('manage-closet', '/closet', `Archive "${itemName}"`)) {
                      return;
                    }
                    archiveClosetItem(itemId);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-amber-500/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 font-semibold cursor-pointer transition-colors"
                >
                  Archive Instead
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const itemName = itemToDelete.name;
                  const itemId = itemToDelete.id;
                  setItemToDelete(null);
                  if (!requireRegisteredUser('manage-closet', '/closet', `Delete "${itemName}"`)) {
                    return;
                  }
                  deleteClosetItem(itemId);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer shadow-md transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Garment Piece Modal */}
      <EditPieceModal
        isOpen={Boolean(itemToEdit)}
        item={itemToEdit}
        onClose={() => setItemToEdit(null)}
        onSave={(updatedItem) => {
          updateClosetItem(updatedItem.id, updatedItem);
          setSelectedClosetItem(updatedItem);
          setItemToEdit(null);
        }}
      />

      {/* Global Notifications Popover */}
      <NotificationPopover
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Global Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        signOutLabel={isAuthenticated ? 'Sign Out' : 'Exit Guest Mode'}
        onSignOut={async () => {
          if (isAuthenticated) {
            await logout();
          } else if (isGuest) {
            exitGuestMode();
          }
          setIsSettingsOpen(false);
          if (onBackToLanding) onBackToLanding();
        }}
      />

      {/* Global Help & Support Modal */}
      {isHelpOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsHelpOpen(false)}
        >
          <div
            ref={helpModalRef}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--border-card)] p-6 space-y-4 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
              <h4 id="help-modal-title" className="font-playfair text-base font-bold text-[var(--text-heading)] flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>OTD Concierge & Help</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                aria-label="Close help and concierge modal"
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-body)] leading-relaxed">
              OTD (Outfit of the Day) is your intelligent personal fashion companion. Need styling advice, wardrobe digitization assistance, or want to report an issue?
            </p>
            <div className="p-3 rounded-2xl bg-[var(--pill-bg)] space-y-1.5">
              <p className="font-bold text-[var(--text-heading)]">VIP Styling Concierge</p>
              <p className="text-[11px] text-[var(--text-muted)]">concierge@outfitoftheday.ai</p>
              <p className="text-[10px] text-emerald-600 font-medium">Response within 2 hours • 24/7 coverage</p>
            </div>
            <button
              type="button"
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Specialized Occasion Directory Modal */}
      <OccasionModal
        isOpen={isOccasionModalOpen}
        onClose={() => setIsOccasionModalOpen(false)}
        selectedOccasion={selectedOccasion}
        onSelectOccasion={(occName) => setSelectedOccasion(occName)}
      />

      {/* Expanded Venue Category Taxonomy Modal */}
      <VenueCategoryModal
        isOpen={isVenueCategoryModalOpen}
        onClose={() => setIsVenueCategoryModalOpen(false)}
        selectedCategory={selectedVenueCategory}
        onSelectCategory={(catName) => setSelectedVenueCategory(catName)}
      />

      {/* Calendar Day Outfit Inspection Dialog (DEF-10) */}
      {selectedCalendarDay && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="calendar-inspection-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedCalendarDay(null)}
        >
          <div
            ref={calendarModalRef}
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto rounded-3xl bg-[var(--bg-card)] border border-[var(--border-gold)] p-6 space-y-4 shadow-2xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-card)]">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-[var(--gold-primary)]">
                  {selectedCalendarDay.name} ({selectedCalendarDay.day} {selectedCalendarDay.month})
                </span>
                {selectedCalendarDay.isToday && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold bg-[var(--gold-primary)]/20 text-[var(--gold-primary)]">
                    Today
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarDay(null)}
                aria-label="Close scheduled look preview"
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="h-56 rounded-2xl overflow-hidden bg-neutral-900 border border-[var(--border-card)] shadow-inner">
              <img
                src={selectedCalendarDay.img}
                alt={selectedCalendarDay.occasion}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-1">
              <h4 id="calendar-inspection-title" className="font-playfair text-base font-bold text-[var(--text-heading)]">
                {selectedCalendarDay.occasion}
              </h4>
              <p className="text-[11px] text-emerald-600 font-semibold">
                ✓ Curated for {selectedCalendarDay.name}, {selectedCalendarDay.day} {selectedCalendarDay.month}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed pt-1">
                This ensemble is reserved on your personal calendar. You can adapt the pieces or open AI Stylist to generate an alternative variation.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  resetStylistSession(1);
                  setSelectedOccasion(selectedCalendarDay.occasion);
                  setSelectedCalendarDay(null);
                  setActiveTab('stylist');
                }}
                className="w-full py-2.5 rounded-xl bg-black text-white dark:bg-white dark:text-black font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm hover:scale-[1.02] transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                <span>Recreate in AI Stylist</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCalendarDay(null)}
                className="w-full py-2 rounded-xl border border-[var(--border-card)] text-[var(--text-muted)] hover:text-[var(--text-heading)] font-semibold cursor-pointer"
              >
                Dismiss Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Registration Prompt Modal for Guest Personal-Data Actions */}
      <GuestRegistrationPromptModal
        isOpen={!isAuthenticated && guestPromptState !== null}
        action={guestPromptState?.action || 'manage-closet'}
        actionTitle={guestPromptState?.actionTitle}
        redirectTo={guestPromptState?.redirectTo || '/closet'}
        onClose={() => setGuestPromptState(null)}
      />

    </div>
  );
};
