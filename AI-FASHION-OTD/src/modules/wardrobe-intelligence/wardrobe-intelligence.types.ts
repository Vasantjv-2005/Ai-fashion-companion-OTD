
import type {
    ClothingCategory,
    ClothingSeason,
    ClothingStyle,
} from "../wardrobe/types";

// Specific clothing items identified by AI.
export const CLOTHING_TYPES = [
    "shirt",
    "tshirt",
    "top",
    "blouse",
    "trousers",
    "jeans",
    "shorts",
    "skirt",
    "dress",
    "jacket",
    "coat",
    "sweater",
    "hoodie",
    "suit",
    "shoes",
    "accessory",
    "other",
] as const;

export type ClothingType = (typeof CLOTHING_TYPES)[number];

// Sleeve styles.
export const SLEEVE_TYPES = [
    "sleeveless",
    "short-sleeve",
    "three-quarter-sleeve",
    "long-sleeve",
    "strapless",
    "unknown",
] as const;

export type SleeveType = (typeof SLEEVE_TYPES)[number];

// Common clothing patterns.
export const CLOTHING_PATTERNS = [
    "solid",
    "striped",
    "checked",
    "plaid",
    "floral",
    "polka-dot",
    "printed",
    "abstract",
    "graphic",
    "other",
    "unknown",
] as const;

export type ClothingPattern =
    (typeof CLOTHING_PATTERNS)[number];

// Clothing materials.
export const CLOTHING_MATERIALS = [
    "cotton",
    "denim",
    "wool",
    "silk",
    "linen",
    "leather",
    "polyester",
    "nylon",
    "rayon",
    "other",
    "unknown",
] as const;

export type ClothingMaterial =
    (typeof CLOTHING_MATERIALS)[number];

// Formality is separate from the existing style attribute.
export const CLOTHING_FORMALITIES = [
    "casual",
    "smart-casual",
    "formal",
    "athletic",
    "party",
    "traditional",
    "unknown",
] as const;

export type ClothingFormality =
    (typeof CLOTHING_FORMALITIES)[number];

// AI prediction review status.
export type ClothingReviewStatus =
    | "suggested"
    | "needs_attribute_review"
    | "needs_user_review";

// Structured clothing information predicted by AI.
export interface ClothingItemInference {
    name: string;
    category: ClothingCategory;
    clothingType: ClothingType;
    color: string;
    secondaryColor?: string | null;
    sleeveType?: SleeveType;
    pattern?: ClothingPattern;
    material?: ClothingMaterial;
    style: ClothingStyle;
    formality?: ClothingFormality;
    season?: ClothingSeason[];
    confidence: number;
}
