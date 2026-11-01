import { z } from "zod";

const outfitOccasions = [
    "casual",
    "work",
    "party",
    "wedding",
    "date",
    "travel",
    "gym",
    "formal",
    "other",
] as const;

const outfitSeasons = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
] as const;

const outfitStatuses = ["generated", "saved", "worn"] as const;

const objectIdSchema = z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Must be a valid MongoDB ObjectId.");

export const createOutfitSchema = z
    .object({
        name: z.string().trim().min(2).max(150),

        description: z.string().trim().max(1000).optional(),

        clothingItemIds: z
            .array(objectIdSchema)
            .min(1, "An outfit must contain at least one clothing item.")
            .refine(
                (ids) => new Set(ids).size === ids.length,
                "Duplicate clothing item IDs are not allowed."
            ),

        occasion: z.enum(outfitOccasions),

        style: z.string().trim().min(1).max(100),

        season: z.enum(outfitSeasons).optional(),

        colorPalette: z
            .array(z.string().trim().min(1).max(50))
            .max(20)
            .optional(),

        status: z.enum(outfitStatuses).optional(),

        aiGenerated: z.boolean().optional(),

        rating: z.number().min(1).max(5).optional(),

        notes: z.string().trim().max(1000).optional(),

        wornAt: z.coerce.date().optional(),
    })
    .strict();

export const updateOutfitSchema = z
    .object({
        name: z.string().trim().min(2).max(150).optional(),

        description: z.string().trim().max(1000).optional(),

        clothingItemIds: z
            .array(objectIdSchema)
            .min(1, "An outfit must contain at least one clothing item.")
            .refine(
                (ids) => new Set(ids).size === ids.length,
                "Duplicate clothing item IDs are not allowed."
            )
            .optional(),

        occasion: z.enum(outfitOccasions).optional(),

        style: z.string().trim().min(1).max(100).optional(),

        season: z.enum(outfitSeasons).optional(),

        colorPalette: z
            .array(z.string().trim().min(1).max(50))
            .max(20)
            .optional(),

        status: z.enum(outfitStatuses).optional(),

        aiGenerated: z.boolean().optional(),

        rating: z.number().min(1).max(5).optional(),

        notes: z.string().trim().max(1000).optional(),

        wornAt: z.coerce.date().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for an update.",
    });

export type CreateOutfitInput = z.infer<typeof createOutfitSchema>;

export type UpdateOutfitInput = z.infer<typeof updateOutfitSchema>;

export function validateCreateOutfit(data: unknown) {
    return createOutfitSchema.safeParse(data);
}

export function validateUpdateOutfit(data: unknown) {
    return updateOutfitSchema.safeParse(data);
}
