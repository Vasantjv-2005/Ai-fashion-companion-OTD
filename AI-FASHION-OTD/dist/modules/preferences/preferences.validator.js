"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePreferencesSchema = void 0;
exports.validateUpdatePreferences = validateUpdatePreferences;
const zod_1 = require("zod");
const UserPreference_1 = require("../../models/UserPreference");
exports.updatePreferencesSchema = zod_1.z
    .object({
    preferredStyles: zod_1.z
        .array(zod_1.z.enum(UserPreference_1.USER_PREFERENCE_STYLES))
        .max(20)
        .optional(),
    preferredColors: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(50))
        .max(30)
        .optional(),
    preferredSeasons: zod_1.z
        .array(zod_1.z.enum(UserPreference_1.USER_PREFERENCE_SEASONS))
        .max(5)
        .optional(),
    preferredCategories: zod_1.z
        .array(zod_1.z.enum(UserPreference_1.USER_PREFERENCE_CATEGORIES))
        .max(30)
        .optional(),
    excludedColors: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(50))
        .max(30)
        .optional(),
    budgetMin: zod_1.z.number().min(0).optional(),
    budgetMax: zod_1.z.number().min(0).optional(),
    preferredFit: zod_1.z.enum(UserPreference_1.USER_PREFERENCE_FITS).optional(),
    recommendationSettings: zod_1.z
        .object({
        useWeather: zod_1.z.boolean().optional(),
        considerOccasion: zod_1.z.boolean().optional(),
        avoidRecentOutfits: zod_1.z.boolean().optional(),
    })
        .optional(),
})
    .strict()
    .refine((data) => {
    if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
        return data.budgetMin <= data.budgetMax;
    }
    return true;
}, { message: "budgetMin must not exceed budgetMax." })
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one preference field must be provided.",
});
function validateUpdatePreferences(data) {
    return exports.updatePreferencesSchema.safeParse(data);
}
