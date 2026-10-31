
export type ClothingCategory =
  (typeof import("../../models/WardrobeItem").CLOTHING_CATEGORIES)[number];

export type ClothingColor =
  (typeof import("../../models/WardrobeItem").CLOTHING_COLORS)[number];

export type ClothingFabric =
  (typeof import("../../models/WardrobeItem").CLOTHING_FABRICS)[number];

export type ClothingPattern =
  (typeof import("../../models/WardrobeItem").CLOTHING_PATTERNS)[number];

export type ClothingStyle =
  (typeof import("../../models/WardrobeItem").CLOTHING_STYLES)[number];

export type ClothingSeason =
  (typeof import("../../models/WardrobeItem").CLOTHING_SEASONS)[number];

export type ClothingOccasion =
  (typeof import("../../models/WardrobeItem").CLOTHING_OCCASIONS)[number];

export type SleeveLength =
  | "sleeveless"
  | "short"
  | "three-quarter"
  | "full"
  | "not-applicable"
  | "unknown";

export interface ClothingAttributes {
  style: ClothingStyle | null;
  sleeveLength: SleeveLength;
  fabric: ClothingFabric | null;
  pattern: ClothingPattern | null;
  season: ClothingSeason | null;
  occasion: ClothingOccasion | null;
  brand: string | null;
}

export interface ClothingConfidence {
  overall: number;
  category: number;
  color: number;
  style: number | null;
  fabric: number | null;
}

export interface ClothingImageReference {
  imageUrl: string;
  storageKey: string;
}

export interface ClothingItemInference {
  name: string;
  category: ClothingCategory;
  color: ClothingColor;
  secondaryColor: ClothingColor | null;
  attributes: ClothingAttributes;
  confidence: ClothingConfidence;
  image: ClothingImageReference;
}

export type ClothingReviewStatus =
  | "suggested"
  | "needs_attribute_review"
  | "needs_user_review";
