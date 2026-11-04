import type { ClosetItem, UserProfile } from '../context/ClosetContext';
import type { OutfitSlotItem } from '../components/ui/AvatarOutfitCanvas';

export interface SynthesizedOutfit {
  title: string;
  subtitle: string;
  harmonyScore: number;
  slots: OutfitSlotItem[];
}

interface SynthesisParams {
  closet: ClosetItem[];
  occasion: string;
  venueName: string;
  venueCategory: string;
  weatherCondition: string;
  selectedPreferences: string[];
  selectedMoods: string[];
  mustInclude: string[];
  avoidItems: string[];
  profile: UserProfile;
  variationIndex?: number;
}

export function synthesizeOutfitResult({
  closet,
  occasion,
  venueName,
  venueCategory,
  weatherCondition,
  selectedPreferences,
  selectedMoods,
  mustInclude,
  avoidItems,
  profile,
  variationIndex = 0,
}: SynthesisParams): SynthesizedOutfit {
  // Helper to test if garment matches any avoid constraints
  const isAvoided = (item: ClosetItem) => {
    return avoidItems.some((avoid) => {
      const a = avoid.toLowerCase();
      return (
        item.name.toLowerCase().includes(a) ||
        item.subType.toLowerCase().includes(a) ||
        item.category.toLowerCase().includes(a) ||
        item.color.toLowerCase().includes(a)
      );
    });
  };

  // Helper to test if garment matches any must-include constraints
  const isMustIncluded = (item: ClosetItem) => {
    return mustInclude.some((inc) => {
      const i = inc.toLowerCase();
      return (
        item.id.toLowerCase() === i ||
        item.name.toLowerCase().includes(i) ||
        item.subType.toLowerCase().includes(i) ||
        item.color.toLowerCase().includes(i)
      );
    });
  };

  // Filter available items per category
  const availableTops = closet
    .filter((i) => i.category === 'tops' && !isAvoided(i))
    .sort((a, b) => (isMustIncluded(b) ? 1 : 0) - (isMustIncluded(a) ? 1 : 0));

  const availableOuterwear = closet
    .filter((i) => i.category === 'outerwear' && !isAvoided(i))
    .sort((a, b) => (isMustIncluded(b) ? 1 : 0) - (isMustIncluded(a) ? 1 : 0));

  const availableBottoms = closet
    .filter((i) => i.category === 'bottoms' && !isAvoided(i))
    .sort((a, b) => (isMustIncluded(b) ? 1 : 0) - (isMustIncluded(a) ? 1 : 0));

  const availableFootwear = closet
    .filter((i) => i.category === 'footwear' && !isAvoided(i))
    .sort((a, b) => (isMustIncluded(b) ? 1 : 0) - (isMustIncluded(a) ? 1 : 0));

  const availableAccessories = closet
    .filter((i) => i.category === 'accessories' && !isAvoided(i))
    .sort((a, b) => (isMustIncluded(b) ? 1 : 0) - (isMustIncluded(a) ? 1 : 0));

  // Determine formality weight based on occasion
  const occasionLower = occasion.toLowerCase();
  const isFormal =
    occasionLower.includes('gala') ||
    occasionLower.includes('black tie') ||
    occasionLower.includes('formal') ||
    occasionLower.includes('presentation') ||
    occasionLower.includes('dinner');

  const isCasual =
    occasionLower.includes('brunch') ||
    occasionLower.includes('weekend') ||
    occasionLower.includes('coffee') ||
    occasionLower.includes('casual');

  // Pick pieces using variation offset
  const pickItem = (list: ClosetItem[], offset: number): ClosetItem | undefined => {
    if (list.length === 0) return undefined;
    return list[(variationIndex + offset) % list.length];
  };

  const top = pickItem(availableTops, 0);
  const outerwear = pickItem(availableOuterwear, 0);
  const bottom = pickItem(availableBottoms, 0);
  const footwear = pickItem(availableFootwear, isFormal ? 0 : isCasual ? 2 : 1);
  const accessory = pickItem(availableAccessories, 0);

  // Check climate condition: If hot (>30C or summer), outerwear might be optional
  const isHotWeather =
    weatherCondition.toLowerCase().includes('hot') ||
    weatherCondition.toLowerCase().includes('sunny') ||
    selectedPreferences.includes('Ultra-Light');

  const slots: OutfitSlotItem[] = [];

  // Slot 1: Base Top
  if (top) {
    slots.push({
      slot: 'top',
      slotLabel: 'Base Top',
      closetItemId: top.id,
      name: top.name,
      category: top.subType || 'Top',
      brand: top.brand,
      color: top.color,
      fit: top.fit,
      formality: top.formality,
      imageUrl: top.imageUrl,
      icon: top.icon,
      status: 'owned',
      stylingNote: `Provides clean, breathable structure anchoring the upper silhouette.`,
    });
  } else {
    // Wardrobe Gap for Top
    slots.push({
      slot: 'top',
      slotLabel: 'Base Top',
      name: 'Tailored Poplin Spread-Collar Shirt',
      category: 'Top',
      color: 'Crisp White',
      fit: 'Tailored',
      formality: 4,
      icon: '👔',
      status: 'missing',
      stylingNote: 'Recommended essential to pair with your tailored bottoms.',
    });
  }

  // Slot 2: Outerwear / Layer (Optional in high heat or casual)
  if (outerwear && (!isHotWeather || isFormal)) {
    slots.push({
      slot: 'outerwear',
      slotLabel: 'Outerwear / Layer',
      closetItemId: outerwear.id,
      name: outerwear.name,
      category: outerwear.subType || 'Outerwear',
      brand: outerwear.brand,
      color: outerwear.color,
      fit: outerwear.fit,
      formality: outerwear.formality,
      imageUrl: outerwear.imageUrl,
      icon: outerwear.icon,
      status: 'owned',
      stylingNote: `Adds sartorial depth and architectural shoulder definition for ${venueCategory}.`,
      isOptional: isHotWeather,
    });
  } else if (!isHotWeather && availableOuterwear.length === 0) {
    // Wardrobe gap for outerwear
    slots.push({
      slot: 'outerwear',
      slotLabel: 'Outerwear / Layer',
      name: 'Unstructured Wool-Silk Travel Blazer',
      category: 'Outerwear',
      color: 'Midnight Navy',
      fit: 'Regular',
      formality: 4,
      icon: '🧥',
      status: 'missing',
      stylingNote: 'Missing layer needed to elevate the look for evening formality.',
      isOptional: true,
    });
  }

  // Slot 3: Bottoms
  if (bottom) {
    slots.push({
      slot: 'bottom',
      slotLabel: 'Bottoms',
      closetItemId: bottom.id,
      name: bottom.name,
      category: bottom.subType || 'Bottoms',
      brand: bottom.brand,
      color: bottom.color,
      fit: bottom.fit,
      formality: bottom.formality,
      imageUrl: bottom.imageUrl,
      icon: bottom.icon,
      status: 'owned',
      stylingNote: `Elongates lower proportions with a clean, drape-forward drape.`,
    });
  } else {
    // Wardrobe gap for bottoms
    slots.push({
      slot: 'bottom',
      slotLabel: 'Bottoms',
      name: 'High-Rise Pleated Wool-Flannel Trousers',
      category: 'Bottoms',
      color: 'Flint Charcoal',
      fit: 'Relaxed / Tailored',
      formality: 4,
      icon: '👖',
      status: 'missing',
      stylingNote: 'Recommended foundation piece for your selected style vibes.',
    });
  }

  // Slot 4: Footwear
  if (footwear) {
    slots.push({
      slot: 'footwear',
      slotLabel: 'Footwear',
      closetItemId: footwear.id,
      name: footwear.name,
      category: footwear.subType || 'Footwear',
      brand: footwear.brand,
      color: footwear.color,
      fit: footwear.fit,
      formality: footwear.formality,
      imageUrl: footwear.imageUrl,
      icon: footwear.icon,
      status: 'owned',
      stylingNote: `Harmonizes the shoe-to-trouser contrast for confident presence.`,
    });
  } else {
    // Wardrobe gap for footwear
    slots.push({
      slot: 'footwear',
      slotLabel: 'Footwear',
      name: 'Burnished Calfskin Penny Loafers',
      category: 'Footwear',
      color: 'Espresso Brown',
      fit: 'Regular',
      formality: 4,
      icon: '👞',
      status: 'missing',
      stylingNote: 'Recommended dress shoe to complete this dress code.',
    });
  }

  // Slot 5: Accessories (Optional)
  if (accessory) {
    slots.push({
      slot: 'accessory',
      slotLabel: 'Accessories',
      closetItemId: accessory.id,
      name: accessory.name,
      category: accessory.subType || 'Accessories',
      brand: accessory.brand,
      color: accessory.color,
      fit: accessory.fit,
      formality: accessory.formality,
      imageUrl: accessory.imageUrl,
      icon: accessory.icon,
      status: 'owned',
      stylingNote: `Subtle luxury accent complementing warm neutral tones.`,
      isOptional: true,
    });
  } else {
    // Unverified / Wardrobe gap accessory
    slots.push({
      slot: 'accessory',
      slotLabel: 'Accessories',
      name: 'Ultra-Thin Mechanical Watch in Rose Gold',
      category: 'Accessories',
      color: 'Rose Gold / Dark Brown',
      icon: '⌚',
      status: 'missing',
      stylingNote: 'Tasteful horological finishing touch for evening wear.',
      isOptional: true,
    });
  }

  // Dynamic Editorial Titles & Subtitles based on occasion & vibes
  const vibePrefix = selectedMoods[0] ? `${selectedMoods[0]} ` : '';
  const titles = [
    `The ${vibePrefix}${occasion} Atelier`,
    `The Contemporary ${occasion} Edit`,
    `The Minimalist ${occasion} Ensemble`,
    `The Refined ${vibePrefix}Dossier`,
  ];
  const title = titles[variationIndex % titles.length];

  const fitText = profile.preferredFit ? ` tailored for ${profile.preferredFit.toLowerCase()} lines` : '';
  const subtitles = [
    `An effortlessly disciplined ensemble calibrated for ${venueName || occasion}'s ${venueCategory} atmosphere${fitText}.`,
    `Structured tailoring meets relaxed ease, balanced for ${weatherCondition || 'comfortable'} conditions.`,
    `Curated with chromatic harmony and ${profile.bodyShape || 'athletic'} proportions from your active digital wardrobe.`,
  ];
  const subtitle = subtitles[variationIndex % subtitles.length];

  // Transparent Sartorial Harmony Calculation (Frontend Calibrated Index)
  // 1. Wardrobe ownership ratio: up to 60 points
  const ownedCount = slots.filter((s) => s.status === 'owned').length;
  const wardrobeOwnershipPts = Math.round((ownedCount / Math.max(1, slots.length)) * 60);

  // 2. Formality & Dress-Code compliance: 28-30 points
  const formalityPts = isFormal ? 29 : isCasual ? 28 : 30;

  // 3. Climate & Comfort balance: 8-9 points
  const climateComfortPts = isHotWeather ? 8 : 9;

  // Total calibrated score
  const harmonyScore = Math.min(99, Math.max(70, wardrobeOwnershipPts + formalityPts + climateComfortPts));

  return {
    title,
    subtitle,
    harmonyScore,
    slots,
  };
}
