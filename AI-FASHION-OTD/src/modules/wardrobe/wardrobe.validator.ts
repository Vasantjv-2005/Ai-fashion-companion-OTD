
import { z } from "zod";

const confidenceScore = z.number().min(0).max(1);

export const clothingItemInferenceSchema = z.object({
  name: z.string().trim().min(1),
  category: z.enum([
    "shirt",
    "tshirt",
    "trousers",
    "jeans",
    "dress",
    "skirt",
    "jacket",
    "coat",
    "sweater",
    "shoes",
    "accessory",
    "other",
  ]),
  color: z.string().trim().min(1),
  secondaryColor: z.string().nullable(),

  attributes: z.object({
    style: z.enum([
      "casual",
      "formal",
      "sport",
      "traditional",
      "party",
      "other",
    ]).nullable(),
    sleeveLength: z.enum([
      "sleeveless",
      "short",
      "three-quarter",
      "full",
      "not-applicable",
      "unknown",
    ]),
    fabric: z.string().nullable(),
    pattern: z.string().nullable(),
    season: z.string().nullable(),
    occasion: z.string().nullable(),
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

export type ValidatedClothingItem = z.infer<
  typeof clothingItemInferenceSchema
>;
