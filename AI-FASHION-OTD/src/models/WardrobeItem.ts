import { Schema, model, Types } from "mongoose";

export const CLOTHING_CATEGORIES = [
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

export const CLOTHING_COLORS = [
  "black",
  "white",
  "gray",
  "navy",
  "blue",
  "light_blue",
  "teal",
  "green",
  "olive",
  "yellow",
  "orange",
  "red",
  "burgundy",
  "pink",
  "purple",
  "brown",
  "tan",
  "beige",
  "cream",
  "gold",
  "silver",
  "multicolor",
] as const;

export const CLOTHING_FABRICS = [
  "cotton",
  "denim",
  "wool",
  "linen",
  "silk",
  "leather",
  "suede",
  "polyester",
  "nylon",
  "rayon",
  "viscose",
  "acrylic",
  "cashmere",
  "spandex",
  "canvas",
  "rubber",
  "synthetic_blend",
  "natural_blend",
  "other",
] as const;

export const CLOTHING_PATTERNS = [
  "solid",
  "striped",
  "checked",
  "plaid",
  "polka_dot",
  "floral",
  "graphic",
  "abstract",
  "animal_print",
  "colorblock",
  "other",
] as const;

export const CLOTHING_STYLES = [
  "classic",
  "minimalist",
  "preppy",
  "bohemian",
  "streetwear",
  "sporty",
  "workwear",
  "vintage",
  "romantic",
  "edgy",
  "avant_garde",
  "utility",
  "elegant",
  "casual",
  "other",
] as const;

export const CLOTHING_SEASONS = [
  "spring",
  "summer",
  "autumn",
  "winter",
  "all_season",
] as const;

export const CLOTHING_OCCASIONS = [
  "everyday",
  "work",
  "business",
  "formal",
  "party",
  "wedding",
  "athletic",
  "travel",
  "outdoor",
  "lounge",
] as const;

export interface IWardrobeItem {
  _id: Types.ObjectId;
  name: string;
  category: string;
  color: string;
  secondary_color: string | null;
  fabric: string | null;
  pattern: string | null;
  style: string | null;
  season: string | null;
  occasion: string | null;
  brand: string | null;
  description: string | null;
  is_favorite: boolean;
  user_id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const nullableEnum = (values: readonly string[]) => ({
  type: String,
  default: null,
  trim: true,
  lowercase: true,
  enum: [...values, null],
});

const wardrobeItemSchema = new Schema<IWardrobeItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: CLOTHING_CATEGORIES,
    },
    color: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: CLOTHING_COLORS,
    },
    secondary_color: nullableEnum(CLOTHING_COLORS),
    fabric: nullableEnum(CLOTHING_FABRICS),
    pattern: nullableEnum(CLOTHING_PATTERNS),
    style: nullableEnum(CLOTHING_STYLES),
    season: nullableEnum(CLOTHING_SEASONS),
    occasion: nullableEnum(CLOTHING_OCCASIONS),
    brand: {
      type: String,
      default: null,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: 1000,
    },
    is_favorite: {
      type: Boolean,
      default: false,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "wardrobe_items",
  },
);

export const WardrobeItem = model<IWardrobeItem>(
  "WardrobeItem",
  wardrobeItemSchema,
);
