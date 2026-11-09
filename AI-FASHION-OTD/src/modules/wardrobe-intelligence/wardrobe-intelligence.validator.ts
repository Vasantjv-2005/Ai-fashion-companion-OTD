import { z } from "zod";

import {
  CLOTHING_CATEGORIES,
  CLOTHING_COLORS,
  CLOTHING_FABRICS,
  CLOTHING_PATTERNS,
  CLOTHING_STYLES,
  CLOTHING_SEASONS,
  CLOTHING_OCCASIONS,
} from "../../models/WardrobeItem";

const confidenceScore = z.number().min(0).max(1);
const scoreZeroToOneHundred = z.number().min(0).max(100);

export const clothingInferenceSchema = z.object({
  name: z.string().trim().min(1).max(120),

  category: z.enum(CLOTHING_CATEGORIES),

  color: z.enum(CLOTHING_COLORS),
  secondaryColor: z.enum(CLOTHING_COLORS).nullable(),

  attributes: z.object({
    style: z.enum(CLOTHING_STYLES).nullable(),
    sleeveLength: z.enum([
      "sleeveless",
      "short",
      "three-quarter",
      "full",
      "not-applicable",
      "unknown",
    ]),
    fabric: z.enum(CLOTHING_FABRICS).nullable(),
    pattern: z.enum(CLOTHING_PATTERNS).nullable(),
    season: z.enum(CLOTHING_SEASONS).nullable(),
    occasion: z.enum(CLOTHING_OCCASIONS).nullable(),
    brand: z.string().nullable(),
  }),

  confidence: z.object({
    overall: confidenceScore,
    category: confidenceScore,
    color: confidenceScore,
    style: confidenceScore.nullable(),
    fabric: confidenceScore.nullable(),
  }),

  image: z.object({
    imageUrl: z.string().url(),
    storageKey: z.string().min(1),
  }),
});

export function validateClothingInference(data: unknown) {
  return clothingInferenceSchema.safeParse(data);
}

const categoryMatchSchema = z.object({
  category: z.string().trim().min(1),
  match_score: confidenceScore,
});

const materialMatchSchema = z.object({
  material: z.string().trim().min(1),
  match_score: scoreZeroToOneHundred,
});

export const fashionClipResponseSchema = z.object({
  status: z.literal("success"),
  data: z.object({
    category: z.string().trim().min(1),
    color: z.string().trim().min(1),
    secondaryColor: z.string().nullable(),

    attributes: z.object({
      material: z.string().nullable(),
      pattern: z.string().nullable(),
      occasion: z.string().nullable(),
      sleeve: z.string().nullable(),
      neckline: z.string().nullable(),
    }),

    categoryMatches: z.array(categoryMatchSchema),

    confidenceScores: z.object({
      category: confidenceScore,
      pattern: scoreZeroToOneHundred,
      occasion: scoreZeroToOneHundred,
      material: scoreZeroToOneHundred,
    }),

    materialMatches: z.array(materialMatchSchema),

    colorRGB: z.tuple([
      z.number().int().min(0).max(255),
      z.number().int().min(0).max(255),
      z.number().int().min(0).max(255),
    ]),
  }),
});

export type FashionClipResponse = z.infer<
  typeof fashionClipResponseSchema
>;

export function validateFashionClipResponse(data: unknown) {
  return fashionClipResponseSchema.safeParse(data);
}
