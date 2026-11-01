"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
exports.validateUpdateProfile = validateUpdateProfile;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z
    .object({
    displayName: zod_1.z
        .string()
        .trim()
        .min(2, "Display name must contain at least 2 characters.")
        .max(100, "Display name cannot exceed 100 characters.")
        .optional(),
    bio: zod_1.z
        .string()
        .trim()
        .max(500, "Bio cannot exceed 500 characters.")
        .optional(),
    // Your Profile model uses avatarFileId, not avatarUrl.
    avatarFileId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, "Please provide a valid avatar file ID.").optional(),
    preferredStyles: zod_1.z
        .array(zod_1.z.enum([
        "casual",
        "formal",
        "smart-casual",
        "streetwear",
        "sporty",
        "traditional",
        "party",
        "minimalist",
        "other",
    ]))
        .max(20, "You can select up to 20 preferred styles.")
        .optional(),
    preferredColors: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(50))
        .max(30, "You can select up to 30 preferred colors.")
        .optional(),
    preferredSeasons: zod_1.z
        .array(zod_1.z.enum([
        "spring",
        "summer",
        "autumn",
        "winter",
        "all-season",
    ]))
        .max(5, "Too many preferred seasons.")
        .optional(),
    preferredCategories: zod_1.z.array(zod_1.z.string().trim().min(1).max(50)).max(30).optional(),
    bodyType: zod_1.z.string().trim().max(50).optional(),
    heightCm: zod_1.z.number().min(50).max(300).optional(),
    fashionGoals: zod_1.z.array(zod_1.z.string().trim().min(1).max(100)).max(20).optional(),
})
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one profile field must be provided.",
});
function validateUpdateProfile(data) {
    return exports.updateProfileSchema.safeParse(data);
}
