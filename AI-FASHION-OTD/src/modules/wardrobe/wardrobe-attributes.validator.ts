
import { z } from "zod";

/**
 * Validates clothing attributes returned by the AI service.
 * AI predictions must be validated before being used by the backend.
 */

export const clothingCategorySchema = z.enum([
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
]);

export const wardrobeAttributesSchema = z.object({
    category: clothingCategorySchema,

    color: z.string().trim().min(1).max(50).optional(),

    secondaryColor: z.string().trim().min(1).max(50).optional(),

    material: z.string().trim().min(1).max(80).optional(),

    pattern: z.string().trim().min(1).max(80).optional(),

    style: z
        .array(z.string().trim().min(1).max(50))
        .max(20)
        .optional(),

    season: z
        .array(
            z.enum([
                "spring",
                "summer",
                "autumn",
                "winter",
                "all-season",
            ]),
        )
        .max(5)
        .optional(),

    occasions: z
        .array(z.string().trim().min(1).max(50))
        .max(20)
        .optional(),

    confidence: z.number().min(0).max(1),
});

export type WardrobeAttributes = z.infer<
    typeof wardrobeAttributesSchema
>;

/**
 * Validates a single AI clothing prediction.
 * Throws a Zod validation error if the data is invalid.
 */
export function validateWardrobeAttributes(
    input: unknown,
): WardrobeAttributes {
    return wardrobeAttributesSchema.parse(input);
}

/**
 * Validates multiple AI clothing predictions.
 */
export function validateWardrobeAttributesList(
    input: unknown,
): WardrobeAttributes[] {
    return z.array(wardrobeAttributesSchema).parse(input);
}
