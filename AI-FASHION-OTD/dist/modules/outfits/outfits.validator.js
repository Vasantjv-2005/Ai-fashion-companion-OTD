"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOutfitSchema = exports.createOutfitSchema = void 0;
exports.validateCreateOutfit = validateCreateOutfit;
exports.validateUpdateOutfit = validateUpdateOutfit;
const zod_1 = require("zod");
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
];
const outfitSeasons = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
];
const outfitStatuses = ["generated", "saved", "worn"];
const objectIdSchema = zod_1.z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, "Must be a valid MongoDB ObjectId.");
exports.createOutfitSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2).max(150),
    description: zod_1.z.string().trim().max(1000).optional(),
    clothingItemIds: zod_1.z
        .array(objectIdSchema)
        .min(1, "An outfit must contain at least one clothing item.")
        .refine((ids) => new Set(ids).size === ids.length, "Duplicate clothing item IDs are not allowed."),
    occasion: zod_1.z.enum(outfitOccasions),
    style: zod_1.z.string().trim().min(1).max(100),
    season: zod_1.z.enum(outfitSeasons).optional(),
    colorPalette: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(50))
        .max(20)
        .optional(),
    status: zod_1.z.enum(outfitStatuses).optional(),
    aiGenerated: zod_1.z.boolean().optional(),
    rating: zod_1.z.number().min(1).max(5).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    wornAt: zod_1.z.coerce.date().optional(),
})
    .strict();
exports.updateOutfitSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(2).max(150).optional(),
    description: zod_1.z.string().trim().max(1000).optional(),
    clothingItemIds: zod_1.z
        .array(objectIdSchema)
        .min(1, "An outfit must contain at least one clothing item.")
        .refine((ids) => new Set(ids).size === ids.length, "Duplicate clothing item IDs are not allowed.")
        .optional(),
    occasion: zod_1.z.enum(outfitOccasions).optional(),
    style: zod_1.z.string().trim().min(1).max(100).optional(),
    season: zod_1.z.enum(outfitSeasons).optional(),
    colorPalette: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(50))
        .max(20)
        .optional(),
    status: zod_1.z.enum(outfitStatuses).optional(),
    aiGenerated: zod_1.z.boolean().optional(),
    rating: zod_1.z.number().min(1).max(5).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    wornAt: zod_1.z.coerce.date().optional(),
})
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for an update.",
});
function validateCreateOutfit(data) {
    return exports.createOutfitSchema.safeParse(data);
}
function validateUpdateOutfit(data) {
    return exports.updateOutfitSchema.safeParse(data);
}
