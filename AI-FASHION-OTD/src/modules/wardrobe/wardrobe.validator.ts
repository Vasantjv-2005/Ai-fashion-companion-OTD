import { z } from "zod";

import {
    CLOTHING_CATEGORIES,
    CLOTHING_SEASONS,
    CLOTHING_STYLES,
} from "./wardrobe.types";

const nameSchema = z
    .string()
    .trim()
    .min(1, "Clothing item name is required.")
    .max(100, "Name must not exceed 100 characters.");

const colorSchema = z
    .string()
    .trim()
    .min(1, "Color is required.")
    .max(50, "Color must not exceed 50 characters.");

const brandSchema = z
    .string()
    .trim()
    .max(100, "Brand must not exceed 100 characters.")
    .optional();

const notesSchema = z
    .string()
    .trim()
    .max(1000, "Notes must not exceed 1000 characters.")
    .optional();

const imageFileIdSchema = z
    .string()
    .trim()
    .min(1, "Image file ID cannot be empty.")
    .optional();

export const createWardrobeItemSchema = z
    .object({
        name: nameSchema,
        category: z.enum(CLOTHING_CATEGORIES),
        color: colorSchema,
        style: z.enum(CLOTHING_STYLES),
        season: z
            .array(z.enum(CLOTHING_SEASONS))
            .min(1, "Select at least one season.")
            .max(CLOTHING_SEASONS.length)
            .refine(
                (seasons) => new Set(seasons).size === seasons.length,
                "Duplicate seasons are not allowed.",
            ),
        brand: brandSchema,
        notes: notesSchema,
        imageFileId: imageFileIdSchema,
    })
    .strict();

export const updateWardrobeItemSchema = z
    .object({
        name: nameSchema.optional(),
        category: z.enum(CLOTHING_CATEGORIES).optional(),
        color: colorSchema.optional(),
        style: z.enum(CLOTHING_STYLES).optional(),
        season: z
            .array(z.enum(CLOTHING_SEASONS))
            .min(1, "Select at least one season.")
            .max(CLOTHING_SEASONS.length)
            .refine(
                (seasons) => new Set(seasons).size === seasons.length,
                "Duplicate seasons are not allowed.",
            )
            .optional(),
        brand: brandSchema,
        notes: notesSchema,
        imageFileId: imageFileIdSchema,
    })
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "Provide at least one field to update.",
    );

export const wardrobeItemIdSchema = z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid wardrobe item ID.");

export const wardrobeListQuerySchema = z
    .object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        category: z.enum(CLOTHING_CATEGORIES).optional(),
        color: z.string().trim().max(50).optional(),
        style: z.enum(CLOTHING_STYLES).optional(),
        season: z.enum(CLOTHING_SEASONS).optional(),
        search: z.string().trim().max(100).optional(),
        sortBy: z
            .enum(["createdAt", "updatedAt", "name"])
            .default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
    })
    .strict();

export type CreateWardrobeItemValidated = z.infer<
    typeof createWardrobeItemSchema
>;

export type UpdateWardrobeItemValidated = z.infer<
    typeof updateWardrobeItemSchema
>;

export type WardrobeListQueryValidated = z.infer<
    typeof wardrobeListQuerySchema
>;

export function validateCreateWardrobeItem(input: unknown) {
    return createWardrobeItemSchema.safeParse(input);
}

export function validateUpdateWardrobeItem(input: unknown) {
    return updateWardrobeItemSchema.safeParse(input);
}

export function validateWardrobeItemId(input: unknown) {
    return wardrobeItemIdSchema.safeParse(input);
}

export function validateWardrobeListQuery(input: unknown) {
    return wardrobeListQuerySchema.safeParse(input);
}
