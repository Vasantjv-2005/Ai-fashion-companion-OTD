import React, { createContext, useContext, useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeAuthSessionEvents } from '../services/authSession';
import {
  getScopedStorageKey,
  getWorkspaceScopeId,
  resolveWorkspaceScope,
  setActivePrivateCacheOwnerId,
  type OtdWorkspaceScope,
} from '../utils/authStorage';

export interface ClosetItem {
  id: string;
  category: 'tops' | 'bottoms' | 'outerwear' | 'footwear' | 'accessories';
  subType: string;
  name: string;
  brand: string;
  color: string;
  secondaryColor?: string;
  fit: 'Slim' | 'Regular' | 'Relaxed / Tailored';
  formality: 1 | 2 | 3 | 4 | 5; // 1 = Casual, 5 = Black Tie
  icon: string;
  imageUrl?: string;
  description?: string;
  isArchived?: boolean;
  createdAt?: string; // ISO 8601 string for sorting
  season?: ('spring' | 'summer' | 'autumn' | 'winter' | 'all-season')[]; // backend schema alignment
  pattern?: string; // backend schema alignment
}

export type WardrobeFocus = 'women' | 'men' | 'personalize';

export interface UserProfile {
  name: string;
  wardrobeFocus?: WardrobeFocus;
  height: string;
  weight?: string;
  bodyShape: string;
  stylePersonas: string[];
  preferredFit: string;
  palettePreferences: string[];
  avatarOption?: 'archetype' | 'custom_photo' | 'skipped';
  avatarArchetype?: string;
  referencePhotoUrl?: string;
}

export interface OutfitRecommendation {
  id: string;
  title: string;
  occasion: string;
  venue: string;
  vibe: string;
  weather: string;
  pieces: ClosetItem[];
  rationale: {
    venueAlignment: string;
    weatherComfort: string;
    paletteHarmony: string;
  };
  harmonyScore: number;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  category: ClosetItem['category'] | string;
  subType?: string;
  brand?: string;
  color?: string;
  fit?: string;
  formality?: number;
  icon?: string;
  imageUrl?: string;
  stylingNote?: string;
  estimatedBudget?: number; // Task 10: Optional estimated budget in INR
  outfitContext?: {
    occasion?: string;
    venue?: string;
    outfitTitle?: string;
  };
  addedAt: string; // ISO 8601
}

export interface OwnershipMatchResult {
  isOwned: boolean;
  matchedItem?: ClosetItem;
}

export interface AddShoppingListResult {
  success: boolean;
  isAlreadyOwned: boolean;
  isDuplicate: boolean;
  message: string;
  item?: ShoppingListItem;
}

export interface OwnedAlternative {
  item: ClosetItem;
  matchReason: string;
  compatibilityScore: number; // 0 - 100
}

/**
 * Task 10: Owned-Only Alternatives
 * Finds compatible alternatives already present in user's active Digital Closet.
 * Uses deterministic category, silhouette, formality, and color compatibility rules.
 * Never calls external APIs or claims AI generation.
 */
export function findOwnedAlternatives(
  closet: ClosetItem[],
  wishlistItem: { category?: string; subType?: string; color?: string; formality?: number; name: string }
): OwnedAlternative[] {
  const activeCloset = closet.filter((item) => !item.isArchived);
  if (activeCloset.length === 0) return [];

  const targetCategory = (wishlistItem.category || '').toLowerCase().trim();
  const targetSubType = (wishlistItem.subType || '').toLowerCase().trim();
  const targetColor = (wishlistItem.color || '').toLowerCase().trim();
  const targetFormality = typeof wishlistItem.formality === 'number' ? wishlistItem.formality : 3;
  const targetName = wishlistItem.name.toLowerCase().trim();

  // Helper to normalize categories
  const normalizeCat = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes('top') || c.includes('shirt') || c.includes('sweater') || c.includes('hoodie')) return 'tops';
    if (c.includes('bottom') || c.includes('pant') || c.includes('trouser') || c.includes('jean') || c.includes('short')) return 'bottoms';
    if (c.includes('outer') || c.includes('jacket') || c.includes('coat') || c.includes('blazer')) return 'outerwear';
    if (c.includes('foot') || c.includes('shoe') || c.includes('boot') || c.includes('sneaker') || c.includes('loafer')) return 'footwear';
    if (c.includes('access') || c.includes('bag') || c.includes('watch') || c.includes('belt') || c.includes('scarf')) return 'accessories';
    return c;
  };

  const normTargetCat = normalizeCat(targetCategory || targetName);
  const scoredAlternatives: OwnedAlternative[] = [];

  for (const item of activeCloset) {
    // Avoid suggesting the exact same item if it's already an exact match
    if (item.name.trim().toLowerCase() === targetName) continue;

    const normItemCat = normalizeCat(item.category || item.name);
    // Must match the same broad category
    if (normTargetCat && normItemCat !== normTargetCat) {
      continue;
    }

    let score = 25; // Base category match score
    const reasons: string[] = [];

    // 1. Silhouette / SubType match
    const itemSubType = (item.subType || '').toLowerCase().trim();
    if (targetSubType && itemSubType) {
      if (itemSubType === targetSubType || targetSubType.includes(itemSubType) || itemSubType.includes(targetSubType)) {
        score += 35;
        reasons.push(`Direct silhouette match (${item.subType})`);
      } else if (item.name.toLowerCase().includes(targetSubType) || targetName.includes(itemSubType)) {
        score += 25;
        reasons.push(`Similar silhouette style`);
      }
    }

    // 2. Formality alignment (within ±1 on 1-5 scale)
    const itemFormality = typeof item.formality === 'number' ? item.formality : 3;
    const formalityDiff = Math.abs(itemFormality - targetFormality);
    if (formalityDiff === 0) {
      score += 25;
      reasons.push(`Identical formality tier (${itemFormality}/5)`);
    } else if (formalityDiff === 1) {
      score += 15;
      reasons.push(`Close formality tier (${itemFormality}/5)`);
    }

    // 3. Color synergy
    const itemColor = (item.color || '').toLowerCase().trim();
    const neutrals = ['black', 'white', 'ivory', 'cream', 'navy', 'grey', 'gray', 'charcoal', 'beige', 'camel', 'khaki'];
    if (targetColor && itemColor) {
      if (itemColor === targetColor || itemColor.includes(targetColor) || targetColor.includes(itemColor)) {
        score += 20;
        reasons.push(`Harmonious color match (${item.color})`);
      } else if (neutrals.some((n) => itemColor.includes(n))) {
        score += 12;
        reasons.push(`Versatile neutral palette (${item.color})`);
      }
    } else if (neutrals.some((n) => itemColor.includes(n))) {
      score += 10;
      reasons.push(`Versatile neutral tone`);
    }

    // Determine headline reason
    let primaryReason = reasons.length > 0 ? reasons.join(' • ') : `Compatible piece in your ${item.category} collection`;
    if (score >= 70) {
      primaryReason = `High wardrobe synergy: ${primaryReason}`;
    }

    scoredAlternatives.push({
      item,
      matchReason: primaryReason,
      compatibilityScore: Math.min(100, score),
    });
  }

  // Sort by highest compatibility score descending
  return scoredAlternatives.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

/**
 * Carefully verifies whether a garment is already owned in the user's active closet.
 * Uses exact name matching, or careful (subType AND color) matching.
 * Never matches on broad category alone.
 */
export function checkGarmentInCloset(
  closet: ClosetItem[],
  garment: { name: string; category?: string; subType?: string; color?: string }
): OwnershipMatchResult {
  const activeCloset = closet.filter((item) => !item.isArchived);
  const targetName = garment.name.trim().toLowerCase();
  const targetColor = garment.color ? garment.color.trim().toLowerCase() : '';
  const targetSubType = garment.subType ? garment.subType.trim().toLowerCase() : '';

  // 1. Exact or tight name match against active closet items
  const nameMatch = activeCloset.find((item) => {
    const itemName = item.name.trim().toLowerCase();
    if (itemName === targetName) return true;
    if (targetName.length > 6 && itemName.includes(targetName)) return true;
    if (itemName.length > 6 && targetName.includes(itemName)) return true;
    return false;
  });
  if (nameMatch) {
    return { isOwned: true, matchedItem: nameMatch };
  }

  // 2. Specific SubType + Color match (both must match, avoiding broad category false positives)
  if (targetSubType && targetColor) {
    const attributeMatch = activeCloset.find((item) => {
      const itemSubType = (item.subType || '').trim().toLowerCase();
      const itemColor = (item.color || '').trim().toLowerCase();
      const subTypeMatches =
        itemSubType === targetSubType ||
        itemSubType.includes(targetSubType) ||
        targetSubType.includes(itemSubType);
      const colorMatches =
        itemColor === targetColor ||
        itemColor.includes(targetColor) ||
        targetColor.includes(itemColor);
      return subTypeMatches && colorMatches;
    });
    if (attributeMatch) {
      return { isOwned: true, matchedItem: attributeMatch };
    }
  }

  return { isOwned: false };
}

interface ClosetContextType {
  profile: UserProfile;
  updateProfile: (newProfile: Partial<UserProfile>) => void;
  closet: ClosetItem[];
  addClosetItem: (item: Omit<ClosetItem, 'id'>) => void;
  deleteClosetItem: (id: string) => void;
  updateClosetItem: (id: string, updates: Partial<ClosetItem>) => void;
  archiveClosetItem: (id: string) => void;
  restoreClosetItem: (id: string) => void;
  currentOutfit: OutfitRecommendation | null;
  generateOutfit: (context: { venue: string; occasion: string; vibe: string; weather: string }) => void;
  modifyOutfit: (instruction: string) => void;
  isGenerating: boolean;
  history: string[];
  // Task 8 & 10: Wardrobe-Aware Personal Wishlist
  shoppingList: ShoppingListItem[];
  addToShoppingList: (item: Omit<ShoppingListItem, 'id' | 'addedAt'>) => AddShoppingListResult;
  updateShoppingListItem: (id: string, updates: Partial<Omit<ShoppingListItem, 'id' | 'addedAt'>>) => void;
  removeFromShoppingList: (id: string) => void;
  clearShoppingList: () => void;
  isItemInShoppingList: (query: { name: string; color?: string; subType?: string } | string) => boolean;
  checkItemOwnership: (garment: { name: string; category?: string; subType?: string; color?: string }) => OwnershipMatchResult;
}

const DEFAULT_PROFILE: UserProfile = {
  name: 'Curator',
  wardrobeFocus: 'personalize',
  height: `5'11" (180 cm)`,
  weight: '70 kg',
  bodyShape: 'Athletic / V-Taper',
  stylePersonas: ['Old Money Heritage', 'Clean Minimalist'],
  preferredFit: 'Regular Classic',
  palettePreferences: ['Espresso & Earth', 'Ivory & Cream', 'Charcoal & Navy'],
  avatarOption: 'archetype',
  avatarArchetype: 'classic_tailored',
};

const INITIAL_CLOSET: ClosetItem[] = [
  // Tops
  { id: 't1', category: 'tops', subType: 'Knit Rollneck', name: 'Seamless Silk-Cashmere High Neck', brand: 'Brunello Cucinelli', color: 'Ivory Cream', fit: 'Regular', formality: 3, icon: '👕', isArchived: false, createdAt: '2026-10-01T10:00:00.000Z' },
  { id: 't2', category: 'tops', subType: 'Oxford Shirt', name: 'Sea Island Cotton Button-Down', brand: 'Charvet', color: 'French Blue', fit: 'Slim', formality: 4, icon: '👔', isArchived: false, createdAt: '2026-10-02T10:00:00.000Z' },
  { id: 't3', category: 'tops', subType: 'Linen Shirt', name: 'Open-Collar Washed Camp Shirt', brand: 'Loro Piana', color: 'Sand White', fit: 'Relaxed / Tailored', formality: 2, icon: '👕', isArchived: false, createdAt: '2026-10-03T10:00:00.000Z' },
  { id: 't4', category: 'tops', subType: 'Crewneck Tee', name: 'Mercerized Pima Cotton T-Shirt', brand: 'Sunspel', color: 'Jet Black', fit: 'Regular', formality: 1, icon: '👕', isArchived: false, createdAt: '2026-10-04T10:00:00.000Z' },
  
  // Bottoms
  { id: 'b1', category: 'bottoms', subType: 'Pleated Trousers', name: 'High-Rise Forward-Pleat Wool Trousers', brand: 'Savile Row Bespoke', color: 'Flint Charcoal', fit: 'Relaxed / Tailored', formality: 4, icon: '👖', isArchived: false, createdAt: '2026-10-05T10:00:00.000Z' },
  { id: 'b2', category: 'bottoms', subType: 'Tailored Chinos', name: 'Brushed Cotton Gurkha Trousers', brand: 'Rota Pantaloni', color: 'Warm Caramel', fit: 'Regular', formality: 3, icon: '👖', isArchived: false, createdAt: '2026-10-06T10:00:00.000Z' },
  { id: 'b3', category: 'bottoms', subType: 'Selvedge Denim', name: '13.5oz Clean Japanese Raw Denim', brand: 'Kuro', color: 'Deep Indigo', fit: 'Regular', formality: 2, icon: '👖', isArchived: false, createdAt: '2026-10-07T10:00:00.000Z' },
  { id: 'b4', category: 'bottoms', subType: 'Linen Pants', name: 'Drawstring Linen-Silk Trousers', brand: 'Boglioli', color: 'Oatmeal Beige', fit: 'Relaxed / Tailored', formality: 2, icon: '👖', isArchived: false, createdAt: '2026-10-08T10:00:00.000Z' },

  // Outerwear
  { id: 'o1', category: 'outerwear', subType: 'Double-Breasted Blazer', name: 'Unstructured Hopsack Navy Blazer', brand: 'Cesare Attolini', color: 'Midnight Navy', fit: 'Regular', formality: 4, icon: '🧥', isArchived: false, createdAt: '2026-10-09T10:00:00.000Z' },
  { id: 'o2', category: 'outerwear', subType: 'Cashmere Overcoat', name: 'Belted Cashmere Trench Overcoat', brand: 'Loro Piana', color: 'Vicuna Camel', fit: 'Relaxed / Tailored', formality: 4, icon: '🧥', isArchived: false, createdAt: '2026-10-10T10:00:00.000Z' },
  { id: 'o3', category: 'outerwear', subType: 'Suede Jacket', name: 'Spanish Lambskin Suede Field Jacket', brand: 'Zegna', color: 'Hazelnut Brown', fit: 'Regular', formality: 3, icon: '🧥', isArchived: false, createdAt: '2026-10-11T10:00:00.000Z' },

  // Footwear
  { id: 'f1', category: 'footwear', subType: 'Penny Loafers', name: 'Burnished Museum Calf Loafers', brand: 'John Lobb', color: 'Espresso Brown', fit: 'Regular', formality: 4, icon: '👞', isArchived: false, createdAt: '2026-10-12T10:00:00.000Z' },
  { id: 'f2', category: 'footwear', subType: 'Belgian Loafers', name: 'Chocolate Suede Tassel Slip-ons', brand: 'Baudoin & Lange', color: 'Dark Chocolate', fit: 'Regular', formality: 3, icon: '👞', isArchived: false, createdAt: '2026-10-13T10:00:00.000Z' },
  { id: 'f3', category: 'footwear', subType: 'Clean Sneaker', name: 'Minimalist Nappa Leather Low-Top', brand: 'Common Projects', color: 'Chalk White', fit: 'Regular', formality: 2, icon: '👟', isArchived: false, createdAt: '2026-10-14T10:00:00.000Z' },
  { id: 'f4', category: 'footwear', subType: 'Chelsea Boots', name: 'Hand-Patinated Glazed Leather Boots', brand: 'Berluti', color: 'Tobacco Patina', fit: 'Regular', formality: 3, icon: '👢', isArchived: false, createdAt: '2026-10-15T10:00:00.000Z' },

  // Accessories
  { id: 'a1', category: 'accessories', subType: 'Dress Watch', name: 'Rose Gold Ultra-Thin Mechanical', brand: 'A. Lange & Söhne', color: 'Rose Gold', fit: 'Regular', formality: 5, icon: '⌚', isArchived: false, createdAt: '2026-10-16T10:00:00.000Z' },
  { id: 'a2', category: 'accessories', subType: 'Leather Belt', name: 'Hand-Stitched Bridle Leather Belt', brand: 'Hermès', color: 'Burgundy Noir', fit: 'Regular', formality: 4, icon: '🎗️', isArchived: false, createdAt: '2026-10-17T10:00:00.000Z' },
];

interface ScopedClosetWorkspace {
  scopeId: string;
  profile: UserProfile;
  closet: ClosetItem[];
  shoppingList: ShoppingListItem[];
  currentOutfit: OutfitRecommendation | null;
  isGenerating: boolean;
  history: string[];
}

function cloneDefaultProfile(): UserProfile {
  return {
    ...DEFAULT_PROFILE,
    stylePersonas: [...DEFAULT_PROFILE.stylePersonas],
    palettePreferences: [...DEFAULT_PROFILE.palettePreferences],
  };
}

function createNeutralProfile(name = ''): UserProfile {
  return {
    name: name.trim(),
    wardrobeFocus: 'personalize',
    height: '',
    weight: '',
    bodyShape: '',
    stylePersonas: [],
    preferredFit: '',
    palettePreferences: [],
    avatarArchetype: 'classic_tailored',
  };
}

function cloneInitialCloset(): ClosetItem[] {
  return INITIAL_CLOSET.map((item) => ({
    ...item,
    season: item.season ? [...item.season] : undefined,
  }));
}

function normalizeStoredProfile(raw: unknown, fallbackProfile: UserProfile): UserProfile {
  if (typeof raw !== 'object' || raw === null) {
    return fallbackProfile;
  }
  const candidate = raw as Partial<UserProfile>;
  return {
    ...fallbackProfile,
    ...candidate,
    name:
      typeof candidate.name === 'string' && candidate.name.trim().length > 0
        ? candidate.name
        : fallbackProfile.name,
    height: typeof candidate.height === 'string' ? candidate.height : fallbackProfile.height,
    weight: typeof candidate.weight === 'string' ? candidate.weight : fallbackProfile.weight,
    bodyShape:
      typeof candidate.bodyShape === 'string' ? candidate.bodyShape : fallbackProfile.bodyShape,
    preferredFit:
      typeof candidate.preferredFit === 'string'
        ? candidate.preferredFit
        : fallbackProfile.preferredFit,
    stylePersonas: Array.isArray(candidate.stylePersonas)
      ? candidate.stylePersonas.filter((v): v is string => typeof v === 'string')
      : fallbackProfile.stylePersonas,
    palettePreferences: Array.isArray(candidate.palettePreferences)
      ? candidate.palettePreferences.filter((v): v is string => typeof v === 'string')
      : fallbackProfile.palettePreferences,
  };
}

function normalizeStoredCloset(raw: unknown): ClosetItem[] | null {
  if (!Array.isArray(raw)) return null;
  const now = Date.now();
  return raw
    .filter(
      (entry): entry is ClosetItem =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Partial<ClosetItem>).id === 'string' &&
        typeof (entry as Partial<ClosetItem>).name === 'string'
    )
    .map((item, index) => ({
      ...item,
      isArchived: Boolean(item.isArchived),
      createdAt:
        item.createdAt || new Date(now - (raw.length - index) * 3600000 * 24).toISOString(),
    }));
}

function normalizeStoredShoppingList(raw: unknown): ShoppingListItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is ShoppingListItem =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as Partial<ShoppingListItem>).id === 'string' &&
        typeof (entry as Partial<ShoppingListItem>).name === 'string'
    )
    .map((item) => ({
      ...item,
      estimatedBudget:
        typeof item.estimatedBudget === 'number' &&
        !isNaN(item.estimatedBudget) &&
        item.estimatedBudget >= 0
          ? item.estimatedBudget
          : undefined,
    }));
}

function loadScopedWorkspace(
  scope: OtdWorkspaceScope,
  userName?: string
): ScopedClosetWorkspace {
  const scopeId = getWorkspaceScopeId(scope);

  if (scope.kind === 'none') {
    if (scope.reason === 'unauthenticated') {
      return {
        scopeId,
        profile: cloneDefaultProfile(),
        closet: cloneInitialCloset(),
        shoppingList: [],
        currentOutfit: null,
        isGenerating: false,
        history: [],
      };
    }

    return {
      scopeId,
      profile: createNeutralProfile(''),
      closet: [],
      shoppingList: [],
      currentOutfit: null,
      isGenerating: false,
      history: [],
    };
  }

  const profileKey = getScopedStorageKey(scope, 'user_profile');
  const closetKey = getScopedStorageKey(scope, 'closet_items');
  const shoppingKey = getScopedStorageKey(scope, 'shopping_list');

  if (scope.kind === 'guest') {
    const fallbackProfile = cloneDefaultProfile();
    let profile = fallbackProfile;
    try {
      const savedProfile = profileKey ? localStorage.getItem(profileKey) : null;
      if (savedProfile) {
        profile = normalizeStoredProfile(JSON.parse(savedProfile), fallbackProfile);
      }
    } catch {
      profile = fallbackProfile;
    }

    let closet = cloneInitialCloset();
    try {
      const savedCloset = closetKey ? localStorage.getItem(closetKey) : null;
      if (savedCloset) {
        const normalized = normalizeStoredCloset(JSON.parse(savedCloset));
        if (normalized) {
          closet = normalized;
        }
      }
    } catch (e) {
      console.warn('Failed to parse otd_closet_items from localStorage:', e);
    }

    let shoppingList: ShoppingListItem[] = [];
    try {
      const savedShopping = shoppingKey ? localStorage.getItem(shoppingKey) : null;
      if (savedShopping) {
        shoppingList = normalizeStoredShoppingList(JSON.parse(savedShopping));
      }
    } catch (e) {
      console.warn('Failed to parse otd_shopping_list from localStorage:', e);
    }

    return {
      scopeId,
      profile,
      closet,
      shoppingList,
      currentOutfit: null,
      isGenerating: false,
      history: [],
    };
  }

  // Authenticated account scope (`otd_private:<userId>:*`):
  // Never reads guest keys or seeds Guest Demo INITIAL_CLOSET / DEFAULT_PROFILE.
  const neutralProfile = createNeutralProfile(userName || '');
  let profile = neutralProfile;
  try {
    const savedProfile = profileKey ? localStorage.getItem(profileKey) : null;
    if (savedProfile) {
      profile = normalizeStoredProfile(JSON.parse(savedProfile), neutralProfile);
    }
  } catch {
    profile = neutralProfile;
  }

  let closet: ClosetItem[] = [];
  try {
    const savedCloset = closetKey ? localStorage.getItem(closetKey) : null;
    if (savedCloset) {
      const normalized = normalizeStoredCloset(JSON.parse(savedCloset));
      if (normalized) {
        closet = normalized;
      }
    }
  } catch (e) {
    console.warn('Failed to parse authenticated closet cache from localStorage:', e);
  }

  let shoppingList: ShoppingListItem[] = [];
  try {
    const savedShopping = shoppingKey ? localStorage.getItem(shoppingKey) : null;
    if (savedShopping) {
      shoppingList = normalizeStoredShoppingList(JSON.parse(savedShopping));
    }
  } catch (e) {
    console.warn('Failed to parse authenticated shopping list cache from localStorage:', e);
  }

  return {
    scopeId,
    profile,
    closet,
    shoppingList,
    currentOutfit: null,
    isGenerating: false,
    history: [],
  };
}

const ClosetContext = createContext<ClosetContextType | undefined>(undefined);

export const ClosetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { status, user } = useAuth();
  const workspaceScope = useMemo(
    () => resolveWorkspaceScope(status, user?.id),
    [status, user?.id]
  );
  const targetScopeId = getWorkspaceScopeId(workspaceScope);

  const [workspace, setWorkspace] = useState<ScopedClosetWorkspace>(() =>
    loadScopedWorkspace(workspaceScope, user?.name)
  );

  // Synchronously reconcile workspace state during render on any auth/user scope transition
  // so children never observe a mixed-scope frame and persistence effects never write stale data.
  const activeWorkspace =
    workspace.scopeId === targetScopeId
      ? workspace
      : loadScopedWorkspace(workspaceScope, user?.name);

  if (workspace.scopeId !== targetScopeId) {
    setWorkspace(activeWorkspace);
  }

  const activeScopeIdRef = useRef<string>(targetScopeId);
  const scopeGenerationRef = useRef<number>(0);
  const generateTimerRef = useRef<number | null>(null);
  const modifyTimerRef = useRef<number | null>(null);
  const ownerUserId = workspaceScope.kind === 'authenticated' ? workspaceScope.userId : null;

  useLayoutEffect(() => {
    // Only refresh active owner when ClosetProvider is mounted for an authenticated scope.
    // Do NOT clear owner to null on unmount so AuthContext logout/guest teardown retains
    // the outgoing owner ID even if ClosetProvider unmounts before teardown completes.
    if (ownerUserId) {
      setActivePrivateCacheOwnerId(ownerUserId);
    }
  }, [ownerUserId]);

  const clearPendingOutfitTimers = () => {
    if (generateTimerRef.current !== null) {
      window.clearTimeout(generateTimerRef.current);
      generateTimerRef.current = null;
    }
    if (modifyTimerRef.current !== null) {
      window.clearTimeout(modifyTimerRef.current);
      modifyTimerRef.current = null;
    }
  };

  useEffect(() => {
    activeScopeIdRef.current = targetScopeId;
    scopeGenerationRef.current += 1;
    return () => {
      scopeGenerationRef.current += 1;
      clearPendingOutfitTimers();
    };
  }, [targetScopeId]);

  useEffect(() => {
    return subscribeAuthSessionEvents({
      onSessionInvalidated: () => {
        scopeGenerationRef.current += 1;
        clearPendingOutfitTimers();
      },
    });
  }, []);

  useEffect(() => {
    if (workspace.scopeId !== targetScopeId) return;
    const shoppingKey = getScopedStorageKey(workspaceScope, 'shopping_list');
    if (!shoppingKey) return;
    try {
      localStorage.setItem(shoppingKey, JSON.stringify(workspace.shoppingList));
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
        console.error('LocalStorage quota exceeded when saving shopping list:', err);
      }
    }
  }, [workspace.scopeId, workspace.shoppingList, workspaceScope, targetScopeId]);

  useEffect(() => {
    if (workspace.scopeId !== targetScopeId) return;
    const profileKey = getScopedStorageKey(workspaceScope, 'user_profile');
    if (!profileKey) return;
    try {
      localStorage.setItem(profileKey, JSON.stringify(workspace.profile));
    } catch (e) {
      console.warn('Failed to persist user profile:', e);
    }
  }, [workspace.scopeId, workspace.profile, workspaceScope, targetScopeId]);

  useEffect(() => {
    if (workspace.scopeId !== targetScopeId) return;
    const closetKey = getScopedStorageKey(workspaceScope, 'closet_items');
    if (!closetKey) return;
    try {
      localStorage.setItem(closetKey, JSON.stringify(workspace.closet));
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
        console.error('LocalStorage quota exceeded when saving closet items:', err);
        window.dispatchEvent(
          new CustomEvent('otd:storage-quota-exceeded', {
            detail: {
              message: 'Browser storage quota reached. Please delete unused garments or use compressed images.',
            },
          })
        );
      }
    }
  }, [workspace.scopeId, workspace.closet, workspaceScope, targetScopeId]);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? { ...prev, profile: { ...prev.profile, ...newProfile } }
        : prev
    );
  };

  const addClosetItem = (item: Omit<ClosetItem, 'id'>) => {
    const dispatchedScopeId = targetScopeId;
    const newItem: ClosetItem = {
      ...item,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isArchived: false,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? { ...prev, closet: [newItem, ...prev.closet] }
        : prev
    );
  };

  const deleteClosetItem = (id: string) => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? { ...prev, closet: prev.closet.filter((item) => item.id !== id) }
        : prev
    );
  };

  const updateClosetItem = (id: string, updates: Partial<ClosetItem>) => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? {
            ...prev,
            closet: prev.closet.map((item) => (item.id === id ? { ...item, ...updates } : item)),
          }
        : prev
    );
  };

  const archiveClosetItem = (id: string) => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? {
            ...prev,
            closet: prev.closet.map((item) =>
              item.id === id ? { ...item, isArchived: true } : item
            ),
          }
        : prev
    );
  };

  const restoreClosetItem = (id: string) => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? {
            ...prev,
            closet: prev.closet.map((item) =>
              item.id === id ? { ...item, isArchived: false } : item
            ),
          }
        : prev
    );
  };

  const generateOutfit = (context: { venue: string; occasion: string; vibe: string; weather: string }) => {
    const dispatchedScopeId = targetScopeId;
    const dispatchedGeneration = scopeGenerationRef.current;
    if (generateTimerRef.current !== null) {
      window.clearTimeout(generateTimerRef.current);
      generateTimerRef.current = null;
    }

    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId ? { ...prev, isGenerating: true } : prev
    );

    generateTimerRef.current = window.setTimeout(() => {
      generateTimerRef.current = null;
      if (
        activeScopeIdRef.current !== dispatchedScopeId ||
        scopeGenerationRef.current !== dispatchedGeneration
      ) {
        return;
      }

      setWorkspace((prev) => {
        if (prev.scopeId !== dispatchedScopeId) {
          return prev;
        }

        // Intelligent matching strictly from the user's active (non-archived) closet
        const activeCloset = prev.closet.filter((i) => !i.isArchived);
        if (activeCloset.length === 0) {
          return { ...prev, currentOutfit: null, isGenerating: false };
        }

        let selectedTop =
          activeCloset.find((i) => i.category === 'tops' && i.formality >= 3) ||
          activeCloset.find((i) => i.category === 'tops') ||
          null;
        let selectedBottom =
          activeCloset.find((i) => i.category === 'bottoms' && i.formality >= 3) ||
          activeCloset.find((i) => i.category === 'bottoms') ||
          null;
        let selectedOuterwear =
          activeCloset.find(
            (i) =>
              i.category === 'outerwear' &&
              (context.weather.includes('Breezy') || context.weather.includes('Cool'))
          ) ||
          activeCloset.find((i) => i.category === 'outerwear') ||
          null;
        let selectedShoe =
          activeCloset.find((i) => i.category === 'footwear' && i.formality >= 3) ||
          activeCloset.find((i) => i.category === 'footwear') ||
          null;
        const selectedAcc = activeCloset.find((i) => i.category === 'accessories') || null;

        // Context adjustments using strictly semantic wardrobe attributes (never demo IDs)
        if (
          context.vibe.toLowerCase().includes('relaxed') ||
          context.occasion.toLowerCase().includes('casual')
        ) {
          selectedTop =
            activeCloset.find((i) => i.category === 'tops' && i.formality <= 2) ||
            selectedTop;
          selectedBottom =
            activeCloset.find((i) => i.category === 'bottoms' && i.formality <= 3) ||
            selectedBottom;
          selectedShoe =
            activeCloset.find(
              (i) =>
                i.category === 'footwear' &&
                (i.subType.toLowerCase().includes('sneaker') || i.formality <= 3)
            ) || selectedShoe;
        } else if (
          context.occasion.toLowerCase().includes('date') ||
          context.venue.toLowerCase().includes('rooftop')
        ) {
          selectedTop =
            activeCloset.find(
              (i) =>
                i.category === 'tops' &&
                (i.subType.toLowerCase().includes('knit') ||
                  i.name.toLowerCase().includes('cashmere') ||
                  i.formality >= 3)
            ) || selectedTop;
          selectedBottom =
            activeCloset.find(
              (i) =>
                i.category === 'bottoms' &&
                !i.subType.toLowerCase().includes('jean') &&
                i.formality >= 3
            ) || selectedBottom;
          selectedOuterwear =
            activeCloset.find(
              (i) =>
                i.category === 'outerwear' &&
                (i.subType.toLowerCase().includes('blazer') || i.formality >= 3)
            ) || selectedOuterwear;
          selectedShoe =
            activeCloset.find(
              (i) =>
                i.category === 'footwear' &&
                (i.subType.toLowerCase().includes('loafer') || i.formality >= 3)
            ) || selectedShoe;
        }

        const pieces: ClosetItem[] = [];
        if (selectedTop) pieces.push(selectedTop);
        if (selectedBottom) pieces.push(selectedBottom);
        if (selectedOuterwear) pieces.push(selectedOuterwear);
        if (selectedShoe) pieces.push(selectedShoe);
        if (selectedAcc) pieces.push(selectedAcc);

        if (pieces.length === 0) {
          return { ...prev, currentOutfit: null, isGenerating: false };
        }

        const primaryAnchor = selectedTop || pieces[0];
        const secondaryAnchor = selectedBottom || pieces[1] || pieces[0];
        const coverageScore = Math.round((Math.min(4, pieces.length) / 4) * 60);
        const computedHarmonyScore = Math.min(99, coverageScore + 38);

        return {
          ...prev,
          currentOutfit: {
            id: `otd_${Date.now()}`,
            title: `${context.vibe} at ${context.venue}`,
            occasion: context.occasion,
            venue: context.venue,
            vibe: context.vibe,
            weather: context.weather,
            pieces,
            rationale: {
              venueAlignment: `Selected to match the ambience of ${context.venue}. The ${primaryAnchor.name} sets a refined tone anchored to your owned wardrobe.`,
              weatherComfort: `Calibrated for ${context.weather}. Breathable natural fabrics prevent overheating while retaining structure in the breeze.`,
              paletteHarmony: `The pairing of ${primaryAnchor.color} against ${secondaryAnchor.color} creates balanced visual contrast calibrated to your ${prev.profile.palettePreferences[0] || 'subtle tonal'} preference.`,
            },
            harmonyScore: computedHarmonyScore,
          },
          isGenerating: false,
        };
      });
    }, 600);
  };

  const modifyOutfit = (instruction: string) => {
    if (!activeWorkspace.currentOutfit) return;
    const dispatchedScopeId = targetScopeId;
    const dispatchedGeneration = scopeGenerationRef.current;
    if (modifyTimerRef.current !== null) {
      window.clearTimeout(modifyTimerRef.current);
      modifyTimerRef.current = null;
    }

    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId && prev.currentOutfit
        ? {
            ...prev,
            isGenerating: true,
            history: [...prev.history, instruction],
          }
        : prev
    );

    modifyTimerRef.current = window.setTimeout(() => {
      modifyTimerRef.current = null;
      if (
        activeScopeIdRef.current !== dispatchedScopeId ||
        scopeGenerationRef.current !== dispatchedGeneration
      ) {
        return;
      }

      setWorkspace((prev) => {
        if (prev.scopeId !== dispatchedScopeId || !prev.currentOutfit) {
          return prev;
        }

        const activeCloset = prev.closet.filter((i) => !i.isArchived);
        let updatedPieces = [...prev.currentOutfit.pieces];
        const newRationale = { ...prev.currentOutfit.rationale };
        const lower = instruction.toLowerCase();
        let didModify = false;

        if (lower.includes('casual') || lower.includes('relax')) {
          const currentShoe = updatedPieces.find((p) => p.category === 'footwear');
          const casualShoe =
            activeCloset.find(
              (i) =>
                i.category === 'footwear' &&
                i.id !== currentShoe?.id &&
                (i.subType.toLowerCase().includes('sneaker') || i.formality <= 2)
            ) ||
            activeCloset.find(
              (i) =>
                i.category === 'footwear' &&
                i.id !== currentShoe?.id &&
                i.formality < (currentShoe?.formality ?? 5)
            );
          if (casualShoe) {
            updatedPieces = updatedPieces.map((p) => (p.category === 'footwear' ? casualShoe : p));
            didModify = true;
          }

          const currentBottom = updatedPieces.find((p) => p.category === 'bottoms');
          const casualBottom =
            activeCloset.find(
              (i) =>
                i.category === 'bottoms' &&
                i.id !== currentBottom?.id &&
                (i.subType.toLowerCase().includes('chino') ||
                  i.subType.toLowerCase().includes('jean') ||
                  i.formality <= 3)
            ) ||
            activeCloset.find(
              (i) =>
                i.category === 'bottoms' &&
                i.id !== currentBottom?.id &&
                i.formality < (currentBottom?.formality ?? 5)
            );
          if (casualBottom) {
            updatedPieces = updatedPieces.map((p) =>
              p.category === 'bottoms' ? casualBottom : p
            );
            didModify = true;
          }

          newRationale.venueAlignment = didModify
            ? `Modified for a more relaxed, approachable casual energy while preserving your other outfit pieces.`
            : `No more casual footwear or bottoms were found in your active closet; existing pieces were kept.`;
        } else if (lower.includes('shoes') || lower.includes('shoe') || lower.includes('boot')) {
          const currentShoe = updatedPieces.find((p) => p.category === 'footwear');
          const wantsBoot = lower.includes('boot');
          const nextShoe =
            (wantsBoot
              ? activeCloset.find(
                  (i) =>
                    i.category === 'footwear' &&
                    i.id !== currentShoe?.id &&
                    (i.name.toLowerCase().includes('boot') ||
                      i.subType.toLowerCase().includes('boot'))
                )
              : undefined) ||
            activeCloset.find((i) => i.category === 'footwear' && i.id !== currentShoe?.id);

          if (nextShoe) {
            updatedPieces = updatedPieces.map((p) => (p.category === 'footwear' ? nextShoe : p));
            didModify = true;
            newRationale.venueAlignment = `Footwear adjusted to ${nextShoe.name} to alter the ground posture and silhouette weight.`;
          } else {
            newRationale.venueAlignment = `No alternative footwear item was found in your active closet; existing pieces were preserved.`;
          }
        } else if (
          lower.includes('no jeans') ||
          lower.includes('dont use jeans') ||
          lower.includes("don't use jeans")
        ) {
          const isDenim = (i: ClosetItem) =>
            i.name.toLowerCase().includes('jean') ||
            i.subType.toLowerCase().includes('jean') ||
            i.subType.toLowerCase().includes('denim');
          const nonDenimBottoms = activeCloset.filter(
            (i) => i.category === 'bottoms' && !isDenim(i)
          );
          const currentBottom = updatedPieces.find((p) => p.category === 'bottoms');
          const tailoredTrouser =
            nonDenimBottoms.find((i) => i.formality >= 3 && i.id !== currentBottom?.id) ||
            nonDenimBottoms.find((i) => i.id !== currentBottom?.id) ||
            (currentBottom && isDenim(currentBottom) ? nonDenimBottoms[0] : undefined);

          if (tailoredTrouser) {
            updatedPieces = updatedPieces.map((p) =>
              p.category === 'bottoms' ? tailoredTrouser : p
            );
            didModify = true;
            newRationale.venueAlignment = `Substituted denim with tailored ${tailoredTrouser.name} for greater sartorial formality.`;
          } else {
            newRationale.venueAlignment = `No non-denim tailored bottoms were found in your active closet; existing pieces were preserved.`;
          }
        } else if (
          lower.includes('attractive') ||
          lower.includes('date') ||
          lower.includes('sharp')
        ) {
          const currentTop = updatedPieces.find((p) => p.category === 'tops');
          const currentShoe = updatedPieces.find((p) => p.category === 'footwear');

          const elevatedTop =
            activeCloset.find(
              (i) =>
                i.category === 'tops' &&
                i.id !== currentTop?.id &&
                (i.subType.toLowerCase().includes('knit') ||
                  i.name.toLowerCase().includes('cashmere') ||
                  i.formality >= 3)
            ) ||
            activeCloset.find(
              (i) =>
                i.category === 'tops' &&
                i.id !== currentTop?.id &&
                i.formality > (currentTop?.formality ?? 0)
            );
          const elevatedShoe =
            activeCloset.find(
              (i) =>
                i.category === 'footwear' &&
                i.id !== currentShoe?.id &&
                (i.subType.toLowerCase().includes('boot') ||
                  i.subType.toLowerCase().includes('loafer') ||
                  i.formality >= 3)
            ) ||
            activeCloset.find(
              (i) =>
                i.category === 'footwear' &&
                i.id !== currentShoe?.id &&
                i.formality > (currentShoe?.formality ?? 0)
            );

          if (elevatedTop) {
            updatedPieces = updatedPieces.map((p) => (p.category === 'tops' ? elevatedTop : p));
            didModify = true;
          }
          if (elevatedShoe) {
            updatedPieces = updatedPieces.map((p) =>
              p.category === 'footwear' ? elevatedShoe : p
            );
            didModify = true;
          }

          newRationale.venueAlignment = didModify
            ? `Elevated allure: Swapped in ${elevatedTop?.name || currentTop?.name || 'refined top'} and ${elevatedShoe?.name || currentShoe?.name || 'tailored footwear'} from your active wardrobe.`
            : `No sharper evening alternatives matched in your active closet; existing pieces were preserved.`;
        } else if (lower.includes('lighter') || lower.includes('layer')) {
          const currentOuterwear = updatedPieces.find((p) => p.category === 'outerwear');
          const lighterOuterwear =
            activeCloset.find(
              (i) =>
                i.category === 'outerwear' &&
                i.id !== currentOuterwear?.id &&
                (i.formality ?? 3) <= 3
            ) ||
            activeCloset.find(
              (i) => i.category === 'outerwear' && i.id !== currentOuterwear?.id
            );
          if (
            lighterOuterwear &&
            (!currentOuterwear ||
              (lighterOuterwear.formality ?? 3) <= (currentOuterwear.formality ?? 3))
          ) {
            updatedPieces = currentOuterwear
              ? updatedPieces.map((p) => (p.category === 'outerwear' ? lighterOuterwear : p))
              : [...updatedPieces.slice(0, 1), lighterOuterwear, ...updatedPieces.slice(1)];
            didModify = true;
            newRationale.venueAlignment = `Layered with ${lighterOuterwear.name} for breathable, lightweight versatility.`;
          } else if (currentOuterwear) {
            updatedPieces = updatedPieces.filter((p) => p.category !== 'outerwear');
            didModify = true;
            newRationale.venueAlignment = `Removed ${currentOuterwear.name} for a cleaner, lighter unlayered silhouette.`;
          } else {
            newRationale.venueAlignment = `Maintained a breathable, unlayered base silhouette; no alternate outerwear was changed.`;
          }
        } else {
          // Generic smart tweak (preserves existing slots cleanly)
          newRationale.venueAlignment = `Noted instruction "${instruction}". Unaffected wardrobe slots remain preserved.`;
        }

        return {
          ...prev,
          currentOutfit: {
            ...prev.currentOutfit,
            pieces: updatedPieces,
            rationale: newRationale,
            harmonyScore: didModify
              ? Math.min(99.4, prev.currentOutfit.harmonyScore + 0.3)
              : prev.currentOutfit.harmonyScore,
          },
          isGenerating: false,
        };
      });
    }, 450);
  };

  const checkItemOwnership = (garment: {
    name: string;
    category?: string;
    subType?: string;
    color?: string;
  }): OwnershipMatchResult => {
    return checkGarmentInCloset(activeWorkspace.closet, garment);
  };

  const isItemInShoppingList = (
    query: { name: string; color?: string; subType?: string } | string
  ): boolean => {
    const nameToMatch = (typeof query === 'string' ? query : query.name).trim().toLowerCase();
    const colorToMatch =
      typeof query === 'object' && query.color ? query.color.trim().toLowerCase() : '';
    const subTypeToMatch =
      typeof query === 'object' && query.subType ? query.subType.trim().toLowerCase() : '';

    return activeWorkspace.shoppingList.some((item) => {
      const itemName = item.name.trim().toLowerCase();
      if (itemName === nameToMatch) return true;
      if (
        nameToMatch.length > 6 &&
        (itemName.includes(nameToMatch) || nameToMatch.includes(itemName))
      ) {
        return true;
      }

      if (subTypeToMatch && colorToMatch && item.subType && item.color) {
        const itemSubType = item.subType.trim().toLowerCase();
        const itemColor = item.color.trim().toLowerCase();
        const subTypeMatches =
          itemSubType === subTypeToMatch ||
          itemSubType.includes(subTypeToMatch) ||
          subTypeToMatch.includes(itemSubType);
        const colorMatches =
          itemColor === colorToMatch ||
          itemColor.includes(colorToMatch) ||
          colorToMatch.includes(itemColor);
        if (subTypeMatches && colorMatches) return true;
      }
      return false;
    });
  };

  const addToShoppingList = (
    itemData: Omit<ShoppingListItem, 'id' | 'addedAt'>
  ): AddShoppingListResult => {
    // 1. Guard against adding garments already owned in active closet
    const ownership = checkItemOwnership({
      name: itemData.name,
      category: itemData.category,
      subType: itemData.subType,
      color: itemData.color,
    });
    if (ownership.isOwned) {
      return {
        success: false,
        isAlreadyOwned: true,
        isDuplicate: false,
        message: `"${itemData.name}" is already verified in your Digital Closet (${ownership.matchedItem?.name || 'Owned piece'}).`,
        item: undefined,
      };
    }

    // 2. Guard against duplicate shopping list entries
    const isDuplicate = isItemInShoppingList({
      name: itemData.name,
      color: itemData.color,
      subType: itemData.subType,
    });
    if (isDuplicate) {
      const existing = activeWorkspace.shoppingList.find(
        (i) => i.name.trim().toLowerCase() === itemData.name.trim().toLowerCase()
      );
      return {
        success: false,
        isAlreadyOwned: false,
        isDuplicate: true,
        message: `"${itemData.name}" is already on your shopping list.`,
        item: existing,
      };
    }

    // 3. Create fresh entry scoped cleanly to current session
    const dispatchedScopeId = targetScopeId;
    const newItem: ShoppingListItem = {
      ...itemData,
      id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      addedAt: new Date().toISOString(),
    };

    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? { ...prev, shoppingList: [newItem, ...prev.shoppingList] }
        : prev
    );

    return {
      success: true,
      isAlreadyOwned: false,
      isDuplicate: false,
      message: `Added "${itemData.name}" to your shopping list.`,
      item: newItem,
    };
  };

  const updateShoppingListItem = (
    id: string,
    updates: Partial<Omit<ShoppingListItem, 'id' | 'addedAt'>>
  ) => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) => {
      if (prev.scopeId !== dispatchedScopeId) return prev;
      return {
        ...prev,
        shoppingList: prev.shoppingList.map((item) => {
          if (item.id !== id) return item;
          const updated = { ...item, ...updates };
          if (updates.estimatedBudget !== undefined) {
            updated.estimatedBudget =
              typeof updates.estimatedBudget === 'number' &&
              !isNaN(updates.estimatedBudget) &&
              updates.estimatedBudget >= 0
                ? updates.estimatedBudget
                : undefined;
          }
          return updated;
        }),
      };
    });
  };

  const removeFromShoppingList = (id: string) => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId
        ? {
            ...prev,
            shoppingList: prev.shoppingList.filter((item) => item.id !== id),
          }
        : prev
    );
  };

  const clearShoppingList = () => {
    const dispatchedScopeId = targetScopeId;
    setWorkspace((prev) =>
      prev.scopeId === dispatchedScopeId ? { ...prev, shoppingList: [] } : prev
    );
  };

  return (
    <ClosetContext.Provider
      value={{
        profile: activeWorkspace.profile,
        updateProfile,
        closet: activeWorkspace.closet,
        addClosetItem,
        deleteClosetItem,
        updateClosetItem,
        archiveClosetItem,
        restoreClosetItem,
        currentOutfit: activeWorkspace.currentOutfit,
        generateOutfit,
        modifyOutfit,
        isGenerating: activeWorkspace.isGenerating,
        history: activeWorkspace.history,
        shoppingList: activeWorkspace.shoppingList,
        addToShoppingList,
        updateShoppingListItem,
        removeFromShoppingList,
        clearShoppingList,
        isItemInShoppingList,
        checkItemOwnership,
      }}
    >
      {children}
    </ClosetContext.Provider>
  );
};

export const useCloset = (): ClosetContextType => {
  const context = useContext(ClosetContext);
  if (!context) {
    throw new Error('useCloset must be used within a ClosetProvider');
  }
  return context;
};
