import { z } from "zod";
import {
    USER_PREFERENCE_CATEGORIES,
    USER_PREFERENCE_FITS,
    USER_PREFERENCE_SEASONS,
    USER_PREFERENCE_STYLES,
} from "../../models/UserPreference";

export const updatePreferencesSchema = z
    .object({
        preferredStyles: z
            .array(z.enum(USER_PREFERENCE_STYLES))
            .max(20)
            .optional(),
        preferredColors: z
            .array(z.string().trim().min(1).max(50))
            .max(30)
            .optional(),
        preferredSeasons: z
            .array(z.enum(USER_PREFERENCE_SEASONS))
            .max(5)
            .optional(),
        preferredCategories: z
            .array(z.enum(USER_PREFERENCE_CATEGORIES))
            .max(30)
            .optional(),
        excludedColors: z
            .array(z.string().trim().min(1).max(50))
            .max(30)
            .optional(),
        budgetMin: z.number().min(0).optional(),
        budgetMax: z.number().min(0).optional(),
        preferredFit: z.enum(USER_PREFERENCE_FITS).optional(),
        recommendationSettings: z
            .object({
                useWeather: z.boolean().optional(),
                considerOccasion: z.boolean().optional(),
                avoidRecentOutfits: z.boolean().optional(),
            })
            .optional(),
    })
    .strict()
    .refine(
        (data) => {
            if (data.budgetMin !== undefined && data.budgetMax !== undefined) {
                return data.budgetMin <= data.budgetMax;
            }
            return true;
        },
        { message: "budgetMin must not exceed budgetMax." },
    )
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one preference field must be provided.",
    });

export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;

export function validateUpdatePreferences(data: unknown) {
    return updatePreferencesSchema.safeParse(data);
}

