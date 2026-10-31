
import { z } from "zod";

import {
    CLOTHING_CATEGORIES,
    CLOTHING_SEASONS,
    CLOTHING_STYLES,
} from "../wardrobe/types";

import {
    CLOTHING_TYPES,
    SLEEVE_TYPES,
    CLOTHING_PATTERNS,
    CLOTHING_MATERIALS,
    CLOTHING_FORMALITIES,
} from "./wardrobe-intelligence.types";

const nameSchema = z.string().trim().min(1).max(100);

const colorSchema = z.string().trim().min(1).max(50);

const confidenceSchema = z
    .number()
    .finite()
    .min(0)
    .max(1);

export const clothingInferenceSchema = z.object({
    name: nameSchema,

    category: z.enum(CLOTHING_CATEGORIES),

    clothingType: z.enum(CLOTHING_TYPES),

    color: colorSchema,

    secondaryColor: z
        .string()
        .trim()
        .min(1)
        .max(50)
        .nullable()
        .optional(),

    sleeveType: z.enum(SLEEVE_TYPES).optional(),

    pattern: z.enum(CLOTHING_PATTERNS).optional(),

    material: z.enum(CLOTHING_MATERIALS).optional(),

    style: z.enum(CLOTHING_STYLES),

    formality: z.enum(CLOTHING_FORMALITIES).optional(),

    season: z
        .array(z.enum(CLOTHING_SEASONS))
        .min(1)
        .max(CLOTHING_SEASONS.length)
        .refine(
            (seasons) => new Set(seasons).size === seasons.length,
            "Duplicate seasons are not allowed.",
        )
        .optional(),

    confidence: confidenceSchema,
}).strict();

export const clothingInferenceListSchema = z
    .array(clothingInferenceSchema)
    .min(1, "At least one clothing prediction is required.");

export type ValidatedClothingInference = z.infer<
    typeof clothingInferenceSchema
>;

export function validateClothingInference(input: unknown) {
    return clothingInferenceSchema.safeParse(input);
}

export function validateClothingInferenceList(input: unknown) {
    return clothingInferenceListSchema.safeParse(input);
}
