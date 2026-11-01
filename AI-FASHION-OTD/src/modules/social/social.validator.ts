import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";
import { OUTFIT_SHARE_VISIBILITY } from "../../models/OutfitShare";

export const shareOutfitSchema = z.object({
    outfitId: objectIdSchema,
    title: z.string().trim().max(150).optional().default(""),
    description: z.string().trim().max(1000).optional().default(""),
    visibility: z.enum(OUTFIT_SHARE_VISIBILITY).optional().default("public"),
    expiresAt: z.union([z.string().datetime(), z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
});

export const addCommentSchema = z.object({
    content: z
        .string()
        .trim()
        .min(1, "Comment cannot be empty.")
        .max(2000, "Comment cannot exceed 2000 characters."),
    parentCommentId: objectIdSchema.optional(),
});

export const socialFeedQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type ShareOutfitDto = z.infer<typeof shareOutfitSchema>;
export type AddCommentDto = z.infer<typeof addCommentSchema>;
export type SocialFeedQueryDto = z.infer<typeof socialFeedQuerySchema>;

export function validateShareOutfit(data: unknown) {
    return shareOutfitSchema.safeParse(data);
}

export function validateAddComment(data: unknown) {
    return addCommentSchema.safeParse(data);
}

export function validateSocialFeedQuery(data: unknown) {
    return socialFeedQuerySchema.safeParse(data);
}

