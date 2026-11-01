"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wardrobeListQuerySchema = exports.wardrobeItemIdSchema = exports.updateWardrobeItemSchema = exports.createWardrobeItemSchema = void 0;
exports.validateCreateWardrobeItem = validateCreateWardrobeItem;
exports.validateUpdateWardrobeItem = validateUpdateWardrobeItem;
exports.validateWardrobeItemId = validateWardrobeItemId;
exports.validateWardrobeListQuery = validateWardrobeListQuery;
const zod_1 = require("zod");
const wardrobe_types_1 = require("./wardrobe.types");
const nameSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Clothing item name is required.")
    .max(100, "Name must not exceed 100 characters.");
const colorSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Color is required.")
    .max(50, "Color must not exceed 50 characters.");
const brandSchema = zod_1.z
    .string()
    .trim()
    .max(100, "Brand must not exceed 100 characters.")
    .optional();
const notesSchema = zod_1.z
    .string()
    .trim()
    .max(1000, "Notes must not exceed 1000 characters.")
    .optional();
const imageFileIdSchema = zod_1.z
    .string()
    .trim()
    .min(1, "Image file ID cannot be empty.")
    .optional();
exports.createWardrobeItemSchema = zod_1.z
    .object({
    name: nameSchema,
    category: zod_1.z.enum(wardrobe_types_1.CLOTHING_CATEGORIES),
    color: colorSchema,
    style: zod_1.z.enum(wardrobe_types_1.CLOTHING_STYLES),
    season: zod_1.z
        .array(zod_1.z.enum(wardrobe_types_1.CLOTHING_SEASONS))
        .min(1, "Select at least one season.")
        .max(wardrobe_types_1.CLOTHING_SEASONS.length)
        .refine((seasons) => new Set(seasons).size === seasons.length, "Duplicate seasons are not allowed."),
    brand: brandSchema,
    notes: notesSchema,
    imageFileId: imageFileIdSchema,
})
    .strict();
exports.updateWardrobeItemSchema = zod_1.z
    .object({
    name: nameSchema.optional(),
    category: zod_1.z.enum(wardrobe_types_1.CLOTHING_CATEGORIES).optional(),
    color: colorSchema.optional(),
    style: zod_1.z.enum(wardrobe_types_1.CLOTHING_STYLES).optional(),
    season: zod_1.z
        .array(zod_1.z.enum(wardrobe_types_1.CLOTHING_SEASONS))
        .min(1, "Select at least one season.")
        .max(wardrobe_types_1.CLOTHING_SEASONS.length)
        .refine((seasons) => new Set(seasons).size === seasons.length, "Duplicate seasons are not allowed.")
        .optional(),
    brand: brandSchema,
    notes: notesSchema,
    imageFileId: imageFileIdSchema,
})
    .strict()
    .refine((data) => Object.keys(data).length > 0, "Provide at least one field to update.");
exports.wardrobeItemIdSchema = zod_1.z
    .string()
    .trim()
    .regex(/^[a-f\d]{24}$/i, "Invalid wardrobe item ID.");
exports.wardrobeListQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce.number().int().min(1).default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
    category: zod_1.z.enum(wardrobe_types_1.CLOTHING_CATEGORIES).optional(),
    color: zod_1.z.string().trim().max(50).optional(),
    style: zod_1.z.enum(wardrobe_types_1.CLOTHING_STYLES).optional(),
    season: zod_1.z.enum(wardrobe_types_1.CLOTHING_SEASONS).optional(),
    search: zod_1.z.string().trim().max(100).optional(),
    sortBy: zod_1.z
        .enum(["createdAt", "updatedAt", "name"])
        .default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).default("desc"),
})
    .strict();
function validateCreateWardrobeItem(input) {
    return exports.createWardrobeItemSchema.safeParse(input);
}
function validateUpdateWardrobeItem(input) {
    return exports.updateWardrobeItemSchema.safeParse(input);
}
function validateWardrobeItemId(input) {
    return exports.wardrobeItemIdSchema.safeParse(input);
}
function validateWardrobeListQuery(input) {
    return exports.wardrobeListQuerySchema.safeParse(input);
}
