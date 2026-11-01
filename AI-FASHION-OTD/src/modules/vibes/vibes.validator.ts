import { z } from "zod";
import { USER_VIBE_MOODS, USER_VIBE_OCCASIONS } from "../../models/UserVibe";

export const createVibeSchema = z.object({
    mood: z.enum(USER_VIBE_MOODS),
    preferredStyles: z.array(z.string().trim().max(50)).optional().default([]),
    preferredColors: z.array(z.string().trim().max(50)).optional().default([]),
    preferredSeasons: z.array(z.string().trim().max(50)).optional().default([]),
    occasion: z.enum(USER_VIBE_OCCASIONS).optional(),
    notes: z.string().trim().max(1000).optional(),
});

export const updateVibeSchema = z
    .object({
        mood: z.enum(USER_VIBE_MOODS).optional(),
        preferredStyles: z.array(z.string().trim().max(50)).optional(),
        preferredColors: z.array(z.string().trim().max(50)).optional(),
        preferredSeasons: z.array(z.string().trim().max(50)).optional(),
        occasion: z.enum(USER_VIBE_OCCASIONS).optional(),
        notes: z.string().trim().max(1000).optional(),
        isActive: z.boolean().optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one field must be provided for update.",
    });

export type CreateVibeDto = z.infer<typeof createVibeSchema>;
export type UpdateVibeDto = z.infer<typeof updateVibeSchema>;

export function validateCreateVibe(data: unknown) {
    return createVibeSchema.safeParse(data);
}

export function validateUpdateVibe(data: unknown) {
    return updateVibeSchema.safeParse(data);
}

