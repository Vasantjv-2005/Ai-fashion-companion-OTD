import { z } from "zod";

export const updateProfileSchema = z
    .object({
        displayName: z
            .string()
            .trim()
            .min(2, "Display name must contain at least 2 characters.")
            .max(100, "Display name cannot exceed 100 characters.")
            .optional(),

        bio: z
            .string()
            .trim()
            .max(500, "Bio cannot exceed 500 characters.")
            .optional(),

        // Your Profile model uses avatarFileId, not avatarUrl.
        avatarFileId: z.string().regex(
            /^[0-9a-fA-F]{24}$/,
            "Please provide a valid avatar file ID."
        ).optional(),

        preferredStyles: z
            .array(
                z.enum([
                    "casual",
                    "formal",
                    "smart-casual",
                    "streetwear",
                    "sporty",
                    "traditional",
                    "party",
                    "minimalist",
                    "other",
                ])
            )
            .max(20, "You can select up to 20 preferred styles.")
            .optional(),

        preferredColors: z
            .array(z.string().trim().min(1).max(50))
            .max(30, "You can select up to 30 preferred colors.")
            .optional(),

        preferredSeasons: z
            .array(
                z.enum([
                    "spring",
                    "summer",
                    "autumn",
                    "winter",
                    "all-season",
                ])
            )
            .max(5, "Too many preferred seasons.")
            .optional(),

        preferredCategories: z.array(z.string().trim().min(1).max(50)).max(30).optional(),

        bodyType: z.string().trim().max(50).optional(),

        heightCm: z.number().min(50).max(300).optional(),

        fashionGoals: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "At least one profile field must be provided.",
    });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export function validateUpdateProfile(data: unknown) {
    return updateProfileSchema.safeParse(data);
}