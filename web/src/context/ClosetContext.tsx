import React, { createContext, useContext, useState, useEffect } from 'react';

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
  preferredFit: 'Tailored / Regular',
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

const ClosetContext = createContext<ClosetContextType | undefined>(undefined);

export const ClosetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('otd_user_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [closet, setCloset] = useState<ClosetItem[]>(() => {
    try {
      const saved = localStorage.getItem('otd_closet_items');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Normalize existing data: ensure isArchived and createdAt are populated
          return parsed.map((item, index) => ({
            ...item,
            isArchived: Boolean(item.isArchived),
            createdAt: item.createdAt || new Date(Date.now() - (parsed.length - index) * 3600000 * 24).toISOString(),
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse otd_closet_items from localStorage:', e);
    }
    return INITIAL_CLOSET;
  });

  const [currentOutfit, setCurrentOutfit] = useState<OutfitRecommendation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Task 8 & 10: Wardrobe-Aware Personal Wishlist state
  const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>(() => {
    try {
      const saved = localStorage.getItem('otd_shopping_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            estimatedBudget:
              typeof item.estimatedBudget === 'number' && !isNaN(item.estimatedBudget) && item.estimatedBudget >= 0
                ? item.estimatedBudget
                : undefined,
          }));
        }
      }
    } catch (e) {
      console.warn('Failed to parse otd_shopping_list from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('otd_shopping_list', JSON.stringify(shoppingList));
    } catch (err) {
      if (err instanceof DOMException && (err.name === 'QuotaExceededError' || err.code === 22)) {
        console.error('LocalStorage quota exceeded when saving shopping list:', err);
      }
    }
  }, [shoppingList]);

  useEffect(() => {
    try {
      localStorage.setItem('otd_user_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to persist user profile:', e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem('otd_closet_items', JSON.stringify(closet));
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
  }, [closet]);

  const updateProfile = (newProfile: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...newProfile }));
  };

  const addClosetItem = (item: Omit<ClosetItem, 'id'>) => {
    const newItem: ClosetItem = {
      ...item,
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isArchived: false,
      createdAt: item.createdAt || new Date().toISOString(),
    };
    setCloset(prev => [newItem, ...prev]);
  };

  const deleteClosetItem = (id: string) => {
    setCloset(prev => prev.filter(item => item.id !== id));
  };

  const updateClosetItem = (id: string, updates: Partial<ClosetItem>) => {
    setCloset(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const archiveClosetItem = (id: string) => {
    setCloset(prev => prev.map(item => item.id === id ? { ...item, isArchived: true } : item));
  };

  const restoreClosetItem = (id: string) => {
    setCloset(prev => prev.map(item => item.id === id ? { ...item, isArchived: false } : item));
  };

  const generateOutfit = (context: { venue: string; occasion: string; vibe: string; weather: string }) => {
    setIsGenerating(true);
    setTimeout(() => {
      // Intelligent matching strictly from the user's active (non-archived) closet
      const activeCloset = closet.filter(i => !i.isArchived);
      if (activeCloset.length === 0) {
        setIsGenerating(false);
        return;
      }

      let selectedTop = activeCloset.find(i => i.category === 'tops' && i.formality >= 3) || activeCloset.find(i => i.category === 'tops') || activeCloset[0];
      let selectedBottom = activeCloset.find(i => i.category === 'bottoms' && i.formality >= 3) || activeCloset.find(i => i.category === 'bottoms') || activeCloset[0];
      let selectedOuterwear = activeCloset.find(i => i.category === 'outerwear' && (context.weather.includes('Breezy') || context.weather.includes('Cool'))) || activeCloset.find(i => i.category === 'outerwear');
      let selectedShoe = activeCloset.find(i => i.category === 'footwear' && i.formality >= 3) || activeCloset.find(i => i.category === 'footwear') || activeCloset[0];
      let selectedAcc = activeCloset.find(i => i.category === 'accessories') || activeCloset[0];

      // Context adjustments based on destination/vibe
      if (context.vibe.toLowerCase().includes('relaxed') || context.occasion.toLowerCase().includes('casual')) {
        selectedTop = activeCloset.find(i => i.id === 't3' || i.id === 't4') || selectedTop;
        selectedBottom = activeCloset.find(i => i.id === 'b2' || i.id === 'b3') || selectedBottom;
        selectedShoe = activeCloset.find(i => i.id === 'f3' || i.id === 'f2') || selectedShoe;
      } else if (context.occasion.toLowerCase().includes('date') || context.venue.toLowerCase().includes('rooftop')) {
        selectedTop = activeCloset.find(i => i.id === 't1') || selectedTop; // Silk-Cashmere High Neck
        selectedBottom = activeCloset.find(i => i.id === 'b1') || selectedBottom; // Forward Pleat Flannel
        selectedOuterwear = activeCloset.find(i => i.id === 'o1') || selectedOuterwear; // Navy Blazer
        selectedShoe = activeCloset.find(i => i.id === 'f2') || selectedShoe; // Suede Tassel Loafer
      }

      const pieces: ClosetItem[] = [selectedTop, selectedBottom];
      if (selectedOuterwear) pieces.push(selectedOuterwear);
      pieces.push(selectedShoe);
      if (selectedAcc && selectedAcc.category === 'accessories') pieces.push(selectedAcc);

      setCurrentOutfit({
        id: `otd_${Date.now()}`,
        title: `${context.vibe} at ${context.venue}`,
        occasion: context.occasion,
        venue: context.venue,
        vibe: context.vibe,
        weather: context.weather,
        pieces,
        rationale: {
          venueAlignment: `Selected to match the ambience of ${context.venue}. The ${selectedTop.name} sets an alluring, refined tone without looking excessively corporate.`,
          weatherComfort: `Calibrated for ${context.weather}. Breathable natural fabrics prevent overheating while retaining structure in the breeze.`,
          paletteHarmony: `The pairing of ${selectedTop.color} against ${selectedBottom.color} creates high-contrast visual balance calibrated to your ${profile.palettePreferences[0] || 'subtle tonal'} preference.`
        },
        harmonyScore: 98.6
      });
      setIsGenerating(false);
    }, 600);
  };

  const modifyOutfit = (instruction: string) => {
    if (!currentOutfit) return;
    setIsGenerating(true);
    setHistory(prev => [...prev, instruction]);

    setTimeout(() => {
      const activeCloset = closet.filter(i => !i.isArchived);
      let updatedPieces = [...currentOutfit.pieces];
      let newRationale = { ...currentOutfit.rationale };
      const lower = instruction.toLowerCase();

      if (lower.includes('casual') || lower.includes('relax')) {
        // Swap shoes for sneakers
        const sneakers = activeCloset.find(i => i.subType === 'Clean Sneaker') || activeCloset.find(i => i.category === 'footwear');
        if (sneakers) {
          updatedPieces = updatedPieces.map(p => p.category === 'footwear' ? sneakers : p);
        }
        // Swap formal pants for relaxed chinos/denim
        const chinos = activeCloset.find(i => i.id === 'b2') || activeCloset.find(i => i.category === 'bottoms');
        if (chinos) {
          updatedPieces = updatedPieces.map(p => p.category === 'bottoms' ? chinos : p);
        }
        newRationale.venueAlignment = `Modified for a more relaxed, approachable casual energy while retaining clean lines.`;
      } else if (lower.includes('shoes') || lower.includes('shoe') || lower.includes('boot')) {
        // Swap footwear to boots or alternative loafers
        const currentShoe = updatedPieces.find(p => p.category === 'footwear');
        const nextShoe = activeCloset.find(i => i.category === 'footwear' && i.id !== currentShoe?.id) || currentShoe;
        if (nextShoe) {
          updatedPieces = updatedPieces.map(p => p.category === 'footwear' ? nextShoe : p);
          newRationale.venueAlignment = `Footwear adjusted to ${nextShoe.name} to alter the ground posture and silhouette weight.`;
        }
      } else if (lower.includes('no jeans') || lower.includes('dont use jeans') || lower.includes("don't use jeans")) {
        const trousers = activeCloset.find(i => i.id === 'b1' || i.id === 'b2')!;
        if (trousers) {
          updatedPieces = updatedPieces.map(p => p.category === 'bottoms' ? trousers : p);
          newRationale.venueAlignment = `Substituted denim with tailored ${trousers.name} for greater sartorial formality.`;
        }
      } else if (lower.includes('attractive') || lower.includes('date') || lower.includes('sharp')) {
        const luxuryKnit = activeCloset.find(i => i.id === 't1')!;
        const chelseaBoots = activeCloset.find(i => i.id === 'f4') || activeCloset.find(i => i.id === 'f2')!;
        if (luxuryKnit) {
          updatedPieces = updatedPieces.map(p => p.category === 'tops' ? luxuryKnit : p);
        }
        if (chelseaBoots) {
          updatedPieces = updatedPieces.map(p => p.category === 'footwear' ? chelseaBoots : p);
        }
        newRationale.venueAlignment = `Elevated allure: Swapped in ${luxuryKnit?.name || 'knitwear'} and ${chelseaBoots?.name || 'boots'} for high-definition night appeal.`;
      } else {
        // Generic smart tweak
        newRationale.venueAlignment = `Customized based on instruction: "${instruction}". Balanced with existing wardrobe synergy.`;
      }

      setCurrentOutfit(prev => prev ? {
        ...prev,
        pieces: updatedPieces,
        rationale: newRationale,
        harmonyScore: Math.min(99.4, prev.harmonyScore + 0.3)
      } : null);

      setIsGenerating(false);
    }, 450);
  };

  const checkItemOwnership = (garment: { name: string; category?: string; subType?: string; color?: string }): OwnershipMatchResult => {
    return checkGarmentInCloset(closet, garment);
  };

  const isItemInShoppingList = (query: { name: string; color?: string; subType?: string } | string): boolean => {
    const nameToMatch = (typeof query === 'string' ? query : query.name).trim().toLowerCase();
    const colorToMatch = typeof query === 'object' && query.color ? query.color.trim().toLowerCase() : '';
    const subTypeToMatch = typeof query === 'object' && query.subType ? query.subType.trim().toLowerCase() : '';

    return shoppingList.some((item) => {
      const itemName = item.name.trim().toLowerCase();
      if (itemName === nameToMatch) return true;
      if (nameToMatch.length > 6 && (itemName.includes(nameToMatch) || nameToMatch.includes(itemName))) return true;

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

  const addToShoppingList = (itemData: Omit<ShoppingListItem, 'id' | 'addedAt'>): AddShoppingListResult => {
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
      const existing = shoppingList.find((i) => i.name.trim().toLowerCase() === itemData.name.trim().toLowerCase());
      return {
        success: false,
        isAlreadyOwned: false,
        isDuplicate: true,
        message: `"${itemData.name}" is already on your shopping list.`,
        item: existing,
      };
    }

    // 3. Create fresh entry
    const newItem: ShoppingListItem = {
      ...itemData,
      id: `shop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      addedAt: new Date().toISOString(),
    };

    setShoppingList((prev) => [newItem, ...prev]);

    return {
      success: true,
      isAlreadyOwned: false,
      isDuplicate: false,
      message: `Added "${itemData.name}" to your shopping list.`,
      item: newItem,
    };
  };

  const updateShoppingListItem = (id: string, updates: Partial<Omit<ShoppingListItem, 'id' | 'addedAt'>>) => {
    setShoppingList((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...updates };
        if (updates.estimatedBudget !== undefined) {
          updated.estimatedBudget =
            typeof updates.estimatedBudget === 'number' && !isNaN(updates.estimatedBudget) && updates.estimatedBudget >= 0
              ? updates.estimatedBudget
              : undefined;
        }
        return updated;
      })
    );
  };

  const removeFromShoppingList = (id: string) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== id));
  };

  const clearShoppingList = () => {
    setShoppingList([]);
  };

  return (
    <ClosetContext.Provider
      value={{
        profile,
        updateProfile,
        closet,
        addClosetItem,
        deleteClosetItem,
        updateClosetItem,
        archiveClosetItem,
        restoreClosetItem,
        currentOutfit,
        generateOutfit,
        modifyOutfit,
        isGenerating,
        history,
        shoppingList,
        addToShoppingList,
        updateShoppingListItem,
        removeFromShoppingList,
        clearShoppingList,
        isItemInShoppingList,
        checkItemOwnership
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
