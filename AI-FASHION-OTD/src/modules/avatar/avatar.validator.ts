import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";

export const createAvatarSchema = z.object({
    displayName: z.string().trim().max(100).optional().default(""),
    source: z.enum(["upload", "generated", "preset"]).optional().default("upload"),
    imageUrl: z.string().url().max(2048).optional(),
    imageFileId: objectIdSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateAvatarSchema = z.object({
    displayName: z.string().trim().max(100).optional(),
    source: z.enum(["upload", "generated", "preset"]).optional(),
    imageUrl: z.string().url().max(2048).optional(),
    imageFileId: objectIdSchema.optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    isActive: z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
});

export type CreateAvatarDto = z.infer<typeof createAvatarSchema>;
export type UpdateAvatarDto = z.infer<typeof updateAvatarSchema>;

export function validateCreateAvatar(data: unknown) {
    return createAvatarSchema.safeParse(data);
}

export function validateUpdateAvatar(data: unknown) {
    return updateAvatarSchema.safeParse(data);
}

