/**
 * Saved Looks domain persistence, normalization, deduplication, and outfit slot
 * restoration helpers backed by canonical `SavedLook` domain models & adapters.
 */

import type { ClosetItem } from '../context/ClosetContext';
import type { OutfitSlotItem } from '../components/ui/AvatarOutfitCanvas';
import type { OutfitSlotName, OutfitSlotPiece, SavedLook } from '../types/domain';
import {
  DEFAULT_EDITORIAL_LOOK_IMAGE,
  isMongoObjectId,
  mapDomainCategoryToSlot,
  mapLegacySavedLookToDomain,
  normalizeCategoryToDomain,
  normalizeSeasonList,
  normalizeStringArray,
  normalizeStyleTag,
  resolveColorProfile,
  toIsoString,
} from '../adapters';
import type { LegacySavedLookInput } from '../adapters';

export const SAVED_LOOKS_STORAGE_KEY = 'otd_saved_looks';
export const LIKED_LOOKS_STORAGE_KEY = 'otd_liked_looks';
export const SAFE_LOOK_FALLBACK_IMAGE = DEFAULT_EDITORIAL_LOOK_IMAGE;

const SLOT_ORDER: readonly OutfitSlotName[] = [
  'top',
  'outerwear',
  'bottom',
  'footwear',
  'accessory',
] as const;

const SLOT_LABELS: Record<OutfitSlotName, string> = {
  top: 'Base Top',
  outerwear: 'Outerwear / Layer',
  bottom: 'Bottoms',
  footwear: 'Footwear',
  accessory: 'Accessories',
};

const SLOT_DEFAULT_ICONS: Record<OutfitSlotName, string> = {
  top: '👕',
  outerwear: '🧥',
  bottom: '👖',
  footwear: '👞',
  accessory: '⌚',
};

let monotonicLocalIdCounter = 0;

/**
 * Generates a collision-free local identifier guaranteed never to match a
 * 24-hex MongoDB ObjectId (`isMongoObjectId(id) === false`).
 */
export function createLocalSavedLookId(): string {
  monotonicLocalIdCounter += 1;
  const randomUuid = globalThis.crypto?.randomUUID?.();
  if (randomUuid) {
    return `local-look-${randomUuid}`;
  }
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `local-look-${Date.now().toString(36)}-${monotonicLocalIdCounter}-${randomSuffix}`;
}

export interface HomeSuggestionTemplate {
  id: string;
  defaultSavedId: string;
  title: string;
  subtitle: string;
  occasion: string;
  venue: string;
  weatherTag: string;
  imageUrl: string;
  vibe: string;
  garments: string[];
  garmentIds: string[];
  slotAssignments: Partial<Record<OutfitSlotName, string>>;
  slots: OutfitSlotPiece[];
  colorPalette: string[];
  tags: string[];
  reason: string;
  defaultFavorite: boolean;
}

export const HOME_SUGGESTION_TEMPLATES: readonly HomeSuggestionTemplate[] = [
  {
    id: 'sug-1',
    defaultSavedId: 'smart-casual-1',
    title: 'Smart Casual',
    subtitle: "For Today's Weather",
    occasion: 'Casual Evening',
    venue: 'Olive Bistro',
    weatherTag: '28°C Breezy',
    imageUrl:
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80',
    vibe: 'Relaxed Sartorial',
    garments: ['Linen Camp Shirt', 'Gurkha Chinos', 'Belgian Loafers'],
    garmentIds: ['t3', 'b2', 'f2'],
    slotAssignments: {
      top: 't3',
      bottom: 'b2',
      footwear: 'f2',
    },
    slots: [
      {
        slot: 'top',
        slotLabel: 'Base Top',
        garmentId: 't3',
        name: 'Open-Collar Washed Camp Shirt',
        color: 'Sand White',
        colorHex: '#C8BA9E',
        status: 'owned',
        category: 'tops',
        subType: 'Linen Shirt',
        brand: 'Loro Piana',
        fit: 'Relaxed / Tailored',
        formality: 2,
        reason: 'Breathable washed linen drapes cleanly for warm evening breezes.',
        icon: '👕',
      },
      {
        slot: 'bottom',
        slotLabel: 'Bottoms',
        garmentId: 'b2',
        name: 'Brushed Cotton Gurkha Trousers',
        color: 'Warm Caramel',
        colorHex: '#7A4B31',
        status: 'owned',
        category: 'bottoms',
        subType: 'Tailored Chinos',
        brand: 'Rota Pantaloni',
        fit: 'Regular',
        formality: 3,
        reason: 'High-waisted caramel tailoring anchors the open collar.',
        icon: '👖',
      },
      {
        slot: 'footwear',
        slotLabel: 'Footwear',
        garmentId: 'f2',
        name: 'Chocolate Suede Tassel Slip-ons',
        color: 'Dark Chocolate',
        colorHex: '#4A2C2A',
        status: 'owned',
        category: 'footwear',
        subType: 'Belgian Loafers',
        brand: 'Baudoin & Lange',
        fit: 'Regular',
        formality: 3,
        reason: 'Unlined chocolate suede adds relaxed Mediterranean polish.',
        icon: '👞',
      },
    ],
    colorPalette: ['Sand White', 'Warm Caramel', 'Dark Chocolate'],
    tags: ['Casual Evening', 'Smart Casual', 'Warm Weather'],
    reason: 'Open-weave linen shirt with caramel Gurkha trousers for breezy terrace dining.',
    defaultFavorite: true,
  },
  {
    id: 'sug-2',
    defaultSavedId: 'date-night-1',
    title: 'Date Night',
    subtitle: 'Classy & Effortless',
    occasion: 'Date Night',
    venue: "L'amore, Banjara Hills",
    weatherTag: '27°C Partly Cloudy',
    imageUrl:
      'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=500&q=80',
    vibe: 'Romantic & Confident',
    garments: ['Silk-Cashmere Knit', 'Flannel Pleated Trousers', 'Suede Loafers'],
    garmentIds: ['t1', 'b1', 'f2'],
    slotAssignments: {
      top: 't1',
      bottom: 'b1',
      footwear: 'f2',
    },
    slots: [
      {
        slot: 'top',
        slotLabel: 'Base Top',
        garmentId: 't1',
        name: 'Seamless Silk-Cashmere High Neck',
        color: 'Ivory Cream',
        colorHex: '#EFECE6',
        status: 'owned',
        category: 'tops',
        subType: 'Knit Rollneck',
        brand: 'Brunello Cucinelli',
        fit: 'Regular',
        formality: 3,
        reason: 'Soft ivory silk-cashmere frames the silhouette under warm candlelight.',
        icon: '👕',
      },
      {
        slot: 'bottom',
        slotLabel: 'Bottoms',
        garmentId: 'b1',
        name: 'High-Rise Forward-Pleat Wool Trousers',
        color: 'Flint Charcoal',
        colorHex: '#2B2B2D',
        status: 'owned',
        category: 'bottoms',
        subType: 'Pleated Trousers',
        brand: 'Savile Row Bespoke',
        fit: 'Relaxed / Tailored',
        formality: 4,
        reason: 'Elongated charcoal pleats balance fine knitwear effortlessly.',
        icon: '👖',
      },
      {
        slot: 'footwear',
        slotLabel: 'Footwear',
        garmentId: 'f2',
        name: 'Chocolate Suede Tassel Slip-ons',
        color: 'Dark Chocolate',
        colorHex: '#4A2C2A',
        status: 'owned',
        category: 'footwear',
        subType: 'Belgian Loafers',
        brand: 'Baudoin & Lange',
        fit: 'Regular',
        formality: 3,
        reason: 'Tactile dark chocolate suede grounds ivory-charcoal contrast.',
        icon: '👞',
      },
    ],
    colorPalette: ['Ivory Cream', 'Flint Charcoal', 'Dark Chocolate'],
    tags: ['Date Night', 'Minimalist', 'Evening'],
    reason: 'Refined ivory-on-charcoal contrast tailored for fine dining ambience.',
    defaultFavorite: true,
  },
  {
    id: 'sug-3',
    defaultSavedId: 'office-ready-1',
    title: 'Office Ready',
    subtitle: 'Clean & Polished',
    occasion: 'Executive Presentation',
    venue: 'Executive Boardroom',
    weatherTag: '24°C Climate Controlled',
    imageUrl:
      'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=500&q=80',
    vibe: 'Sharp Executive',
    garments: [
      'Sea Island Cotton Shirt',
      'Navy Hopsack Blazer',
      'Pleated Wool Trousers',
      'Museum Calf Loafers',
    ],
    garmentIds: ['t2', 'o1', 'b1', 'f1'],
    slotAssignments: {
      top: 't2',
      outerwear: 'o1',
      bottom: 'b1',
      footwear: 'f1',
    },
    slots: [
      {
        slot: 'top',
        slotLabel: 'Base Top',
        garmentId: 't2',
        name: 'Sea Island Cotton Button-Down',
        color: 'French Blue',
        colorHex: '#3B5673',
        status: 'owned',
        category: 'tops',
        subType: 'Oxford Shirt',
        brand: 'Charvet',
        fit: 'Slim',
        formality: 4,
        reason: 'Crisp French blue shirting sharpens boardroom presence.',
        icon: '👔',
      },
      {
        slot: 'outerwear',
        slotLabel: 'Outerwear / Layer',
        garmentId: 'o1',
        name: 'Unstructured Hopsack Navy Blazer',
        color: 'Midnight Navy',
        colorHex: '#1E293B',
        status: 'owned',
        category: 'outerwear',
        subType: 'Double-Breasted Blazer',
        brand: 'Cesare Attolini',
        fit: 'Regular',
        formality: 4,
        reason: 'Breathable hopsack tailoring provides clean shoulder authority.',
        icon: '🧥',
      },
      {
        slot: 'bottom',
        slotLabel: 'Bottoms',
        garmentId: 'b1',
        name: 'High-Rise Forward-Pleat Wool Trousers',
        color: 'Flint Charcoal',
        colorHex: '#2B2B2D',
        status: 'owned',
        category: 'bottoms',
        subType: 'Pleated Trousers',
        brand: 'Savile Row Bespoke',
        fit: 'Relaxed / Tailored',
        formality: 4,
        reason: 'Classic charcoal wool separates anchor navy tailoring cleanly.',
        icon: '👖',
      },
      {
        slot: 'footwear',
        slotLabel: 'Footwear',
        garmentId: 'f1',
        name: 'Burnished Museum Calf Loafers',
        color: 'Espresso Brown',
        colorHex: '#3D271E',
        status: 'owned',
        category: 'footwear',
        subType: 'Penny Loafers',
        brand: 'John Lobb',
        fit: 'Regular',
        formality: 4,
        reason: 'Espresso burnished calfskin completes executive formal discipline.',
        icon: '👞',
      },
    ],
    colorPalette: ['French Blue', 'Midnight Navy', 'Flint Charcoal', 'Espresso Brown'],
    tags: ['Executive Presentation', 'Office Ready', 'Formal'],
    reason: 'Boardroom-calibrated navy hopsack tailoring paired with French blue shirting.',
    defaultFavorite: false,
  },
  {
    id: 'sug-4',
    defaultSavedId: 'travel-look-1',
    title: 'Travel Look',
    subtitle: 'Comfort Meets Style',
    occasion: 'Travel',
    venue: 'Lounge & Transit',
    weatherTag: '22°C Mild',
    imageUrl:
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=500&q=80',
    vibe: 'Effortless Ease',
    garments: [
      'Washed Camp Shirt',
      'Suede Field Jacket',
      'Linen-Silk Trousers',
      'Nappa Leather Low-Top',
    ],
    garmentIds: ['t3', 'o3', 'b4', 'f3'],
    slotAssignments: {
      top: 't3',
      outerwear: 'o3',
      bottom: 'b4',
      footwear: 'f3',
    },
    slots: [
      {
        slot: 'top',
        slotLabel: 'Base Top',
        garmentId: 't3',
        name: 'Open-Collar Washed Camp Shirt',
        color: 'Sand White',
        colorHex: '#C8BA9E',
        status: 'owned',
        category: 'tops',
        subType: 'Linen Shirt',
        brand: 'Loro Piana',
        fit: 'Relaxed / Tailored',
        formality: 2,
        reason: 'Soft breathable linen resists creasing during transit.',
        icon: '👕',
      },
      {
        slot: 'outerwear',
        slotLabel: 'Outerwear / Layer',
        garmentId: 'o3',
        name: 'Spanish Lambskin Suede Field Jacket',
        color: 'Hazelnut Brown',
        colorHex: '#7A4B31',
        status: 'owned',
        category: 'outerwear',
        subType: 'Suede Jacket',
        brand: 'Zegna',
        fit: 'Regular',
        formality: 3,
        reason: 'Lightweight suede layer adapts smoothly to cabin air conditioning.',
        icon: '🧥',
        isOptional: true,
      },
      {
        slot: 'bottom',
        slotLabel: 'Bottoms',
        garmentId: 'b4',
        name: 'Drawstring Linen-Silk Trousers',
        color: 'Oatmeal Beige',
        colorHex: '#D8CDB9',
        status: 'owned',
        category: 'bottoms',
        subType: 'Linen Pants',
        brand: 'Boglioli',
        fit: 'Relaxed / Tailored',
        formality: 2,
        reason: 'Elasticated linen-silk waist ensures long-haul comfort with clean drape.',
        icon: '👖',
      },
      {
        slot: 'footwear',
        slotLabel: 'Footwear',
        garmentId: 'f3',
        name: 'Minimalist Nappa Leather Low-Top',
        color: 'Chalk White',
        colorHex: '#F3EFE6',
        status: 'owned',
        category: 'footwear',
        subType: 'Clean Sneaker',
        brand: 'Common Projects',
        fit: 'Regular',
        formality: 2,
        reason: 'Streamlined white leather sneakers deliver all-day walking support.',
        icon: '👟',
      },
    ],
    colorPalette: ['Sand White', 'Hazelnut Brown', 'Oatmeal Beige', 'Chalk White'],
    tags: ['Travel', 'Smart Casual', 'Comfort'],
    reason: 'Relaxed linen-silk comfort layered with supple suede and minimalist sneakers.',
    defaultFavorite: false,
  },
] as const;

const CURATED_DEFAULT_TEMPLATE_BY_ID: ReadonlyMap<string, HomeSuggestionTemplate> = new Map(
  HOME_SUGGESTION_TEMPLATES.map((tpl) => [tpl.defaultSavedId, tpl]),
);

const TEMPLATE_BY_ID: ReadonlyMap<string, HomeSuggestionTemplate> = new Map(
  HOME_SUGGESTION_TEMPLATES.map((tpl) => [tpl.id, tpl]),
);

export function createSavedLookFromTemplate(
  template: HomeSuggestionTemplate,
  options?: { idOverride?: string; isFavorite?: boolean; savedAt?: string },
): SavedLook {
  return {
    id: options?.idOverride ?? template.defaultSavedId,
    sourceTemplateId: template.id,
    origin: 'local',
    sourceKind: 'curated-default',
    title: template.title,
    subtitle: template.subtitle,
    occasion: template.occasion,
    venue: template.venue,
    vibe: template.vibe,
    style: normalizeStyleTag(template.vibe),
    season: 'all-season',
    isFavorite: options?.isFavorite ?? template.defaultFavorite,
    weatherTag: template.weatherTag,
    imageUrl: template.imageUrl,
    tags: [...template.tags],
    garments: [...template.garments],
    garmentIds: [...template.garmentIds],
    slotAssignments: { ...template.slotAssignments },
    slots: template.slots.map((s) => ({ ...s })),
    colorPalette: [...template.colorPalette],
    reason: template.reason,
    savedAt: options?.savedAt ?? '2026-10-15T10:00:00.000Z',
  };
}

export const DEFAULT_SAVED_LOOKS: readonly SavedLook[] = HOME_SUGGESTION_TEMPLATES.slice(0, 3).map(
  (template) => createSavedLookFromTemplate(template),
);

export function selectFallbackImageForOccasion(occasion: string): string {
  const token = occasion.trim().toLowerCase();
  if (token.includes('date') || token.includes('romantic')) {
    return 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=500&q=80';
  }
  if (token.includes('office') || token.includes('work') || token.includes('executive') || token.includes('formal')) {
    return 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=500&q=80';
  }
  if (token.includes('casual') || token.includes('brunch') || token.includes('weekend')) {
    return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=500&q=80';
  }
  return SAFE_LOOK_FALLBACK_IMAGE;
}

export function extractOwnedSlotGarmentIds(slots: readonly OutfitSlotItem[]): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const slot of slots) {
    if (slot.status !== 'owned') continue;
    const rawId = slot.closetItemId?.trim();
    if (!rawId || seen.has(rawId)) continue;
    seen.add(rawId);
    ids.push(rawId);
  }
  return ids;
}

export function extractSlotAssignments(
  slots: readonly OutfitSlotItem[],
): Partial<Record<OutfitSlotName, string>> {
  const assignments: Partial<Record<OutfitSlotName, string>> = {};
  for (const slot of slots) {
    if (slot.status === 'owned' && slot.closetItemId?.trim()) {
      assignments[slot.slot] = slot.closetItemId.trim();
    }
  }
  return assignments;
}

export function outfitSlotsToDomainPieces(
  slots: readonly OutfitSlotItem[],
  closet: readonly ClosetItem[] = [],
): OutfitSlotPiece[] {
  const closetById = new Map(closet.map((item) => [item.id, item]));

  return slots.map((slot) => {
    const ownedItem = slot.closetItemId ? closetById.get(slot.closetItemId) : undefined;
    const colorName = (slot.color || ownedItem?.color || 'Neutral').trim();
    const colorProfile = resolveColorProfile(colorName);
    const garmentId = slot.status === 'owned' ? slot.closetItemId?.trim() || undefined : undefined;

    return {
      slot: slot.slot,
      slotLabel: slot.slotLabel,
      garmentId,
      backendGarmentId: garmentId && isMongoObjectId(garmentId) ? garmentId : undefined,
      name: slot.name.trim(),
      color: colorProfile.displayName,
      colorHex: colorProfile.hex,
      status: slot.status,
      category: normalizeCategoryToDomain(ownedItem?.category ?? slot.category ?? slot.slot),
      subType: ownedItem?.subType || slot.category,
      brand: slot.brand || ownedItem?.brand,
      fit: slot.fit || ownedItem?.fit,
      formality: slot.formality ?? ownedItem?.formality,
      isOptional: slot.isOptional,
      reason: slot.stylingNote?.trim() || `Styled for your ${slot.slotLabel.toLowerCase()}.`,
      icon: slot.icon || ownedItem?.icon || SLOT_DEFAULT_ICONS[slot.slot],
      imageUrl: slot.imageUrl || ownedItem?.imageUrl,
    };
  });
}

export interface BuildSavedLookEnsembleInput {
  sourceTemplateId?: string;
  title: string;
  subtitle: string;
  occasion: string;
  venue: string;
  weatherTag: string;
  vibe?: string;
  preferences?: readonly string[];
  slots: readonly OutfitSlotItem[];
  closet?: readonly ClosetItem[];
  variationIndex?: number;
}

/**
 * Builds a complete canonical `SavedLook` from the currently active Stylist
 * Step 3 ensemble, preserving real closet garment IDs, per-slot assignments,
 * chromatic palette, and metadata.
 */
export function buildSavedLookFromEnsemble(input: BuildSavedLookEnsembleInput): SavedLook {
  const domainSlots = outfitSlotsToDomainPieces(input.slots, input.closet ?? []);
  const garmentIds = extractOwnedSlotGarmentIds(input.slots);
  const slotAssignments = extractSlotAssignments(input.slots);
  const firstSlotImage = input.slots.find((s) => s.status === 'owned' && Boolean(s.imageUrl))?.imageUrl;
  const vibeText = (input.vibe || 'Refined').trim();

  return {
    id: createLocalSavedLookId(),
    backendOutfitId: undefined,
    sourceTemplateId: input.sourceTemplateId,
    origin: 'local',
    sourceKind: 'stylist-generated',
    title: input.title.trim() || 'Curated Ensemble',
    subtitle: input.subtitle.trim() || `${input.occasion} Look`,
    occasion: input.occasion.trim() || 'Casual',
    venue: input.venue.trim() || undefined,
    vibe: vibeText,
    style: normalizeStyleTag(vibeText),
    season: normalizeSeasonList(undefined)[0] ?? 'all-season',
    isFavorite: true,
    weatherTag: input.weatherTag.trim() || 'Climate-Calibrated',
    imageUrl: firstSlotImage || selectFallbackImageForOccasion(input.occasion),
    tags: normalizeStringArray([input.occasion, vibeText, ...(input.preferences ?? []).slice(0, 2)]),
    garments: input.slots.map((s) => s.name.trim()).filter(Boolean),
    garmentIds,
    slotAssignments,
    slots: domainSlots,
    variationIndex: input.variationIndex,
    colorPalette: normalizeStringArray(input.slots.map((s) => s.color || '')),
    reason: input.subtitle.trim() || 'Synthesized from your OTD Digital Closet.',
    savedAt: new Date().toISOString(),
  };
}

export interface SavedLookSignatureInput {
  occasion?: string;
  title?: string;
  garments?: readonly string[];
  garmentIds?: readonly string[];
  slotAssignments?: Partial<Record<OutfitSlotName, string>>;
  slots?: ReadonlyArray<{
    slot: OutfitSlotName;
    garmentId?: string;
    closetItemId?: string;
    name?: string;
    status?: string;
  }>;
}

/**
 * Generates a deterministic signature matching `(occasion, active outfit composition)`
 * to prevent accidental duplicate saves while allowing multiple distinct ensembles
 * for the same occasion or the same pieces reused across different occasions.
 */
export function buildSavedLookSignature(input: SavedLookSignatureInput): string {
  const occasionKey = (input.occasion || 'casual').trim().toLowerCase();

  if (input.slots && input.slots.length > 0) {
    const bySlot = new Map<OutfitSlotName, string>();
    for (const s of input.slots) {
      const id = (s.closetItemId || s.garmentId || '').trim().toLowerCase();
      if (id && s.status !== 'missing') {
        bySlot.set(s.slot, `id:${id}`);
      } else {
        bySlot.set(s.slot, `gap:${(s.name || '').trim().toLowerCase()}`);
      }
    }
    const orderedParts = SLOT_ORDER.filter((slot) => bySlot.has(slot)).map(
      (slot) => `${slot}=${bySlot.get(slot)}`,
    );
    if (orderedParts.length > 0) {
      return `${occasionKey}::slots:${orderedParts.join('|')}`;
    }
  }

  if (input.slotAssignments) {
    const assignedParts = SLOT_ORDER.filter((slot) => Boolean(input.slotAssignments?.[slot]?.trim())).map(
      (slot) => `${slot}=id:${input.slotAssignments?.[slot]?.trim().toLowerCase()}`,
    );
    if (assignedParts.length > 0) {
      return `${occasionKey}::slots:${assignedParts.join('|')}`;
    }
  }

  const normalizedIds = normalizeStringArray(input.garmentIds).map((id) => id.toLowerCase()).sort();
  if (normalizedIds.length > 0) {
    return `${occasionKey}::ids:${normalizedIds.join('|')}`;
  }

  const titleKey = (input.title || '').trim().toLowerCase();
  const garmentNamesKey = normalizeStringArray(input.garments)
    .map((g) => g.toLowerCase())
    .sort()
    .join('|');
  return `${occasionKey}::meta:${titleKey}::${garmentNamesKey}`;
}

function buildIdSetSignature(
  occasion?: string,
  garmentIds?: readonly string[],
): string | null {
  const normalizedIds = normalizeStringArray(garmentIds)
    .map((id) => id.toLowerCase())
    .sort();
  if (normalizedIds.length === 0) return null;
  const occasionKey = (occasion || 'casual').trim().toLowerCase();
  return `${occasionKey}::ids:${normalizedIds.join('|')}`;
}

export function findDuplicateSavedLook(
  candidate: SavedLookSignatureInput,
  existingLooks: readonly SavedLook[],
): SavedLook | undefined {
  const targetSig = buildSavedLookSignature(candidate);
  const candidateIdSig = buildIdSetSignature(candidate.occasion, candidate.garmentIds);

  return existingLooks.find((look) => {
    if (buildSavedLookSignature(look) === targetSig) {
      return true;
    }
    const existingLacksSlots = !look.slots?.length && !look.slotAssignments;
    const candidateLacksSlots = !candidate.slots?.length && !candidate.slotAssignments;
    if ((existingLacksSlots || candidateLacksSlots) && candidateIdSig) {
      const existingIdSig = buildIdSetSignature(look.occasion, look.garmentIds);
      return existingIdSig !== null && existingIdSig === candidateIdSig;
    }
    return false;
  });
}

function isDomainSavedLookShape(raw: unknown): raw is SavedLook {
  if (typeof raw !== 'object' || raw === null) return false;
  const candidate = raw as Partial<SavedLook>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.sourceKind === 'string' &&
    Array.isArray(candidate.garmentIds) &&
    Array.isArray(candidate.garments)
  );
}

function isLegacySavedLookShape(raw: unknown): raw is LegacySavedLookInput {
  if (typeof raw !== 'object' || raw === null) return false;
  const candidate = raw as Partial<LegacySavedLookInput>;
  return typeof candidate.id === 'string' && candidate.id.trim().length > 0;
}

/**
 * Safely reconciles & upgrades stored Saved Looks (`otd_saved_looks`) alongside
 * legacy favorited IDs (`otd_liked_looks`):
 * - Upgrades legacy `SavedLookItem` records and links curated default garment IDs.
 * - Ensures zero duplicate `id` collisions across migrated items.
 * - Syncs `isFavorite` consistently and cleanly preserves `backendOutfitId` only for real Mongo IDs.
 */
export function mergeAndMigrateSavedLooks(
  rawLooks: unknown,
  rawLikedIds: unknown,
): SavedLook[] {
  const hasExplicitLikedList = Array.isArray(rawLikedIds);
  const likedIdSet = new Set<string>(
    hasExplicitLikedList
      ? rawLikedIds
          .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
          .map((v) => v.trim())
      : [],
  );

  if (rawLooks === null) {
    const seeded = DEFAULT_SAVED_LOOKS.map((defaultLook) => {
      const isLiked = hasExplicitLikedList
        ? likedIdSet.has(defaultLook.id) ||
          (defaultLook.sourceTemplateId ? likedIdSet.has(defaultLook.sourceTemplateId) : false)
        : defaultLook.isFavorite;
      return { ...defaultLook, isFavorite: isLiked };
    });
    for (const likedId of likedIdSet) {
      const tpl = TEMPLATE_BY_ID.get(likedId);
      if (
        tpl &&
        !seeded.some((look) => look.sourceTemplateId === tpl.id || look.id === tpl.defaultSavedId)
      ) {
        seeded.unshift(
          createSavedLookFromTemplate(tpl, { isFavorite: true, savedAt: new Date().toISOString() }),
        );
      }
    }
    return seeded;
  }

  if (!Array.isArray(rawLooks)) {
    return DEFAULT_SAVED_LOOKS.map((look) => ({ ...look }));
  }

  const seenIds = new Set<string>();
  const normalized: SavedLook[] = [];

  for (const entry of rawLooks) {
    if (!isLegacySavedLookShape(entry)) continue;

    let look: SavedLook;
    if (isDomainSavedLookShape(entry)) {
      const explicitId = entry.id.trim();
      const mongoBackend = isMongoObjectId(entry.backendOutfitId)
        ? entry.backendOutfitId
        : isMongoObjectId(explicitId)
          ? explicitId
          : undefined;

      look = {
        ...entry,
        id: explicitId,
        backendOutfitId: mongoBackend,
        origin: mongoBackend ? entry.origin || 'api' : entry.origin || 'local',
        garments: normalizeStringArray(entry.garments),
        garmentIds: normalizeStringArray(entry.garmentIds),
        tags: normalizeStringArray(entry.tags),
        colorPalette: normalizeStringArray(entry.colorPalette),
        isFavorite: typeof entry.isFavorite === 'boolean' ? entry.isFavorite : true,
        savedAt: toIsoString(entry.savedAt),
      };
    } else {
      const mapped = mapLegacySavedLookToDomain(entry);
      const curatedUpgrade = CURATED_DEFAULT_TEMPLATE_BY_ID.get(mapped.id);
      const isFavFromLikedList =
        typeof entry.isFavorite === 'boolean'
          ? entry.isFavorite
          : hasExplicitLikedList
            ? likedIdSet.has(mapped.id) ||
              (mapped.sourceTemplateId ? likedIdSet.has(mapped.sourceTemplateId) : false)
            : curatedUpgrade
              ? curatedUpgrade.defaultFavorite
              : true;

      if (curatedUpgrade && mapped.garmentIds.length === 0) {
        look = createSavedLookFromTemplate(curatedUpgrade, {
          idOverride: mapped.id,
          isFavorite: isFavFromLikedList,
          savedAt: entry.savedAt ? mapped.savedAt : '2026-10-15T10:00:00.000Z',
        });
      } else {
        look = {
          ...mapped,
          isFavorite: isFavFromLikedList,
        };
      }
    }

    if (seenIds.has(look.id)) {
      look = {
        ...look,
        id: isMongoObjectId(look.id) ? look.id : createLocalSavedLookId(),
      };
      if (seenIds.has(look.id)) continue;
    }

    seenIds.add(look.id);
    normalized.push(look);
  }

  // Upgrade legacy standalone template likes (e.g. `sug-4`) not yet present in `savedLooks`
  for (const likedId of likedIdSet) {
    const tpl = TEMPLATE_BY_ID.get(likedId);
    if (!tpl) continue;
    const alreadyExists = normalized.some(
      (look) => look.sourceTemplateId === tpl.id || look.id === tpl.defaultSavedId,
    );
    if (!alreadyExists && !seenIds.has(tpl.defaultSavedId)) {
      seenIds.add(tpl.defaultSavedId);
      normalized.unshift(
        createSavedLookFromTemplate(tpl, { isFavorite: true, savedAt: new Date().toISOString() }),
      );
    }
  }

  return normalized;
}

export function deriveSyncedLikedLookIds(savedLooks: readonly SavedLook[]): string[] {
  return savedLooks.filter((look) => look.isFavorite).map((look) => look.id);
}

export function loadStoredSavedLooks(): SavedLook[] {
  try {
    const rawSaved = localStorage.getItem(SAVED_LOOKS_STORAGE_KEY);
    const rawLiked = localStorage.getItem(LIKED_LOOKS_STORAGE_KEY);
    const parsedSaved: unknown = rawSaved !== null ? JSON.parse(rawSaved) : null;
    const parsedLiked: unknown = rawLiked !== null ? JSON.parse(rawLiked) : null;
    return mergeAndMigrateSavedLooks(parsedSaved, parsedLiked);
  } catch (err) {
    console.warn('Failed to parse otd_saved_looks from localStorage:', err);
    return DEFAULT_SAVED_LOOKS.map((look) => ({ ...look }));
  }
}

export function persistSavedLooks(looks: readonly SavedLook[]): boolean {
  try {
    localStorage.setItem(SAVED_LOOKS_STORAGE_KEY, JSON.stringify(looks));
    localStorage.setItem(LIKED_LOOKS_STORAGE_KEY, JSON.stringify(deriveSyncedLikedLookIds(looks)));
    return true;
  } catch (err) {
    console.warn('Failed to persist otd_saved_looks:', err);
    return false;
  }
}

function closetItemToOutfitSlot(
  slot: OutfitSlotName,
  item: ClosetItem,
  stylingNote?: string,
  isOptional?: boolean,
): OutfitSlotItem {
  return {
    slot,
    slotLabel: SLOT_LABELS[slot],
    closetItemId: item.id,
    name: item.name,
    category: item.subType || item.category,
    brand: item.brand,
    color: item.color,
    fit: item.fit,
    formality: item.formality,
    imageUrl: item.imageUrl,
    icon: item.icon || SLOT_DEFAULT_ICONS[slot],
    status: 'owned',
    stylingNote: stylingNote || `Restored from your Digital Closet: ${item.brand} ${item.name}.`,
    isOptional,
  };
}

export interface RestoredSavedLookResult {
  restoredSlots: OutfitSlotItem[];
  matchedOwnedCount: number;
  missingGarmentNames: string[];
}

/**
 * Restores a Saved Look's actual outfit slots and real wardrobe item references
 * against the live active `ClosetItem[]` collection.
 * Safely degrades missing/archived pieces without faking ownership.
 */
export function restoreSavedLookSlots(
  look: SavedLook,
  closet: readonly ClosetItem[],
): RestoredSavedLookResult {
  const activeById = new Map<string, ClosetItem>();
  const allById = new Map<string, ClosetItem>();
  for (const item of closet) {
    allById.set(item.id, item);
    if (!item.isArchived) {
      activeById.set(item.id, item);
    }
  }

  const restoredSlots: OutfitSlotItem[] = [];
  const missingGarmentNames: string[] = [];
  let matchedOwnedCount = 0;

  // Strategy 1: Exact saved slot snapshots (highest fidelity)
  if (look.slots && look.slots.length > 0) {
    for (const savedPiece of look.slots) {
      const targetId = savedPiece.garmentId ?? look.slotAssignments?.[savedPiece.slot];
      if (targetId) {
        const activeMatch = activeById.get(targetId);
        if (activeMatch) {
          matchedOwnedCount += 1;
          restoredSlots.push(
            closetItemToOutfitSlot(
              savedPiece.slot,
              activeMatch,
              savedPiece.reason,
              savedPiece.isOptional,
            ),
          );
        } else {
          const archivedRecord = allById.get(targetId);
          missingGarmentNames.push(savedPiece.name);
          restoredSlots.push({
            slot: savedPiece.slot,
            slotLabel: savedPiece.slotLabel || SLOT_LABELS[savedPiece.slot],
            name: savedPiece.name,
            category: savedPiece.subType || savedPiece.category || SLOT_LABELS[savedPiece.slot],
            brand: savedPiece.brand,
            color: savedPiece.color,
            fit: savedPiece.fit,
            formality: savedPiece.formality,
            imageUrl: savedPiece.imageUrl,
            icon: savedPiece.icon || SLOT_DEFAULT_ICONS[savedPiece.slot],
            status: 'missing',
            stylingNote: archivedRecord?.isArchived
              ? 'This saved garment is currently archived in your closet — choose a replacement or restore it.'
              : 'This saved garment is no longer in your active closet — swap in a piece or add to wishlist.',
            isOptional: savedPiece.isOptional,
          });
        }
      } else {
        restoredSlots.push({
          slot: savedPiece.slot,
          slotLabel: savedPiece.slotLabel || SLOT_LABELS[savedPiece.slot],
          name: savedPiece.name,
          category: savedPiece.subType || savedPiece.category || SLOT_LABELS[savedPiece.slot],
          brand: savedPiece.brand,
          color: savedPiece.color,
          fit: savedPiece.fit,
          formality: savedPiece.formality,
          imageUrl: savedPiece.imageUrl,
          icon: savedPiece.icon || SLOT_DEFAULT_ICONS[savedPiece.slot],
          status: savedPiece.status === 'missing' ? 'missing' : 'unverified',
          stylingNote: savedPiece.reason,
          isOptional: savedPiece.isOptional,
        });
      }
    }

    return { restoredSlots, matchedOwnedCount, missingGarmentNames };
  }

  // Strategy 2: Per-slot assignment map + garmentIds list
  const assignedIds = new Set<string>();
  const occupiedSlots = new Set<OutfitSlotName>();

  if (look.slotAssignments) {
    for (const slotName of SLOT_ORDER) {
      const targetId = look.slotAssignments[slotName];
      if (!targetId) continue;
      assignedIds.add(targetId);
      occupiedSlots.add(slotName);
      const activeMatch = activeById.get(targetId);
      if (activeMatch) {
        matchedOwnedCount += 1;
        restoredSlots.push(closetItemToOutfitSlot(slotName, activeMatch));
      } else {
        const archivedOrOld = allById.get(targetId);
        const fallbackLabel = archivedOrOld?.name || `Closet Piece (${targetId.slice(-4)})`;
        missingGarmentNames.push(fallbackLabel);
        restoredSlots.push({
          slot: slotName,
          slotLabel: SLOT_LABELS[slotName],
          name: fallbackLabel,
          category: SLOT_LABELS[slotName],
          icon: SLOT_DEFAULT_ICONS[slotName],
          status: 'missing',
          stylingNote: 'Saved wardrobe piece is currently archived or unavailable in active closet.',
        });
      }
    }
  }

  for (const id of look.garmentIds) {
    if (assignedIds.has(id)) continue;
    const activeMatch = activeById.get(id);
    if (activeMatch) {
      const preferredSlot = mapDomainCategoryToSlot(normalizeCategoryToDomain(activeMatch.category));
      const slot = !occupiedSlots.has(preferredSlot)
        ? preferredSlot
        : SLOT_ORDER.find((candidate) => !occupiedSlots.has(candidate)) ?? preferredSlot;
      occupiedSlots.add(slot);
      matchedOwnedCount += 1;
      restoredSlots.push(closetItemToOutfitSlot(slot, activeMatch));
    } else {
      const archivedOrOld = allById.get(id);
      const fallbackLabel = archivedOrOld?.name || `Saved Piece (${id.slice(-4)})`;
      missingGarmentNames.push(fallbackLabel);
      const fallbackSlot = SLOT_ORDER.find((candidate) => !occupiedSlots.has(candidate)) ?? 'top';
      occupiedSlots.add(fallbackSlot);
      restoredSlots.push({
        slot: fallbackSlot,
        slotLabel: SLOT_LABELS[fallbackSlot],
        name: fallbackLabel,
        category: SLOT_LABELS[fallbackSlot],
        icon: SLOT_DEFAULT_ICONS[fallbackSlot],
        status: 'missing',
        stylingNote: 'Saved wardrobe piece is currently archived or unavailable in active closet.',
      });
    }
  }

  // Strategy 3: Name-only legacy fallback (zero garmentIds)
  if (restoredSlots.length === 0 && look.garments.length > 0) {
    const activeItems = Array.from(activeById.values());
    look.garments.slice(0, SLOT_ORDER.length).forEach((garmentName, index) => {
      const cleanName = garmentName.trim();
      const matched = activeItems.find(
        (item) => item.name.trim().toLowerCase() === cleanName.toLowerCase(),
      );
      if (matched) {
        const slot = mapDomainCategoryToSlot(normalizeCategoryToDomain(matched.category));
        if (!occupiedSlots.has(slot)) {
          occupiedSlots.add(slot);
          matchedOwnedCount += 1;
          restoredSlots.push(closetItemToOutfitSlot(slot, matched));
          return;
        }
      }
      const fallbackSlot =
        SLOT_ORDER.find((candidate) => !occupiedSlots.has(candidate)) ?? SLOT_ORDER[index % SLOT_ORDER.length];
      occupiedSlots.add(fallbackSlot);
      restoredSlots.push({
        slot: fallbackSlot,
        slotLabel: SLOT_LABELS[fallbackSlot],
        name: cleanName,
        category: SLOT_LABELS[fallbackSlot],
        icon: SLOT_DEFAULT_ICONS[fallbackSlot],
        status: 'unverified',
        stylingNote: `Editorial reference piece from "${look.title}". Swap to link a specific closet item.`,
      });
    });
  }

  restoredSlots.sort(
    (a, b) => SLOT_ORDER.indexOf(a.slot) - SLOT_ORDER.indexOf(b.slot),
  );

  return { restoredSlots, matchedOwnedCount, missingGarmentNames };
}

export function toggleSavedLookFavorite(
  looks: readonly SavedLook[],
  targetLookId: string,
): SavedLook[] {
  return looks.map((look) =>
    look.id === targetLookId ? { ...look, isFavorite: !look.isFavorite } : look,
  );
}

export function deleteSavedLookById(
  looks: readonly SavedLook[],
  targetLookId: string,
): SavedLook[] {
  return looks.filter((look) => look.id !== targetLookId);
}

export function toggleTemplateCardFavorite(
  looks: readonly SavedLook[],
  templateId: string,
): { nextLooks: SavedLook[]; look: SavedLook | undefined; favorited: boolean } {
  const existing = looks.find(
    (l) => l.sourceTemplateId === templateId || l.id === templateId,
  );
  if (existing) {
    const nextFav = !existing.isFavorite;
    const nextLooks = looks.map((l) =>
      l.id === existing.id ? { ...l, isFavorite: nextFav } : l,
    );
    return { nextLooks, look: { ...existing, isFavorite: nextFav }, favorited: nextFav };
  }

  const template = TEMPLATE_BY_ID.get(templateId);
  if (!template) {
    return { nextLooks: [...looks], look: undefined, favorited: false };
  }

  const created = createSavedLookFromTemplate(template, {
    idOverride: looks.some((l) => l.id === template.defaultSavedId)
      ? createLocalSavedLookId()
      : template.defaultSavedId,
    isFavorite: true,
    savedAt: new Date().toISOString(),
  });
  return {
    nextLooks: [created, ...looks],
    look: created,
    favorited: true,
  };
}

export function isTemplateFavorited(
  templateId: string,
  looks: readonly SavedLook[],
): boolean {
  return looks.some(
    (look) => (look.sourceTemplateId === templateId || look.id === templateId) && look.isFavorite,
  );
}

export function formatSavedLookDateLabel(look: Pick<SavedLook, 'savedAt' | 'sourceKind'>): string {
  if (look.sourceKind === 'curated-default' && look.savedAt === '2026-10-15T10:00:00.000Z') {
    return 'Curated Ensemble';
  }
  const parsed = new Date(look.savedAt);
  if (Number.isNaN(parsed.getTime())) {
    return 'Saved Look';
  }
  return `Saved ${parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

export function formatSavedLookPiecesSummary(
  look: Pick<SavedLook, 'garments' | 'slots'>,
): string {
  if (look.garments.length > 0) {
    return look.garments.join(', ');
  }
  if (look.slots && look.slots.length > 0) {
    return look.slots.map((s) => s.name).join(', ');
  }
  return 'Curated wardrobe ensemble';
}
