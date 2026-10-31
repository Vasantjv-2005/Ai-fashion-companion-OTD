
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
