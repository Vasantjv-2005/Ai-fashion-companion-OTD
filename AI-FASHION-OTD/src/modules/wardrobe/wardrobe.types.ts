
export type ClothingCategory =
  | "shirt"
  | "tshirt"
  | "trousers"
  | "jeans"
  | "dress"
  | "skirt"
  | "jacket"
  | "coat"
  | "sweater"
  | "shoes"
  | "accessory"
  | "other";

export type ClothingStyle =
  | "casual"
  | "formal"
  | "sport"
  | "traditional"
  | "party"
  | "other";

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
  fabric: string | null;
  pattern: string | null;
  season: string | null;
  occasion: string | null;
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
  color: string;
  secondaryColor: string | null;
  attributes: ClothingAttributes;
  confidence: ClothingConfidence;
  image: ClothingImageReference;
}

export type ClothingReviewStatus =
  | "suggested"
  | "needs_attribute_review"
  | "needs_user_review";
