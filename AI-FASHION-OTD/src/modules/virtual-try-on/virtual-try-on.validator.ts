import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";
import { VIRTUAL_TRY_ON_TYPES } from "../../models/VirtualTryOn";

export const createTryOnSchema = z.object({
    wardrobeItemIds: z
        .array(objectIdSchema)
        .min(1, "At least one wardrobe item is required for virtual try-on.")
        .max(5, "Maximum 5 items per try-on session."),
    userImageUrl: z.string().url("Must be a valid image URL").optional(),
    tryOnType: z.enum(VIRTUAL_TRY_ON_TYPES).optional().default("single_item"),
    prompt: z.string().trim().max(1000).optional(),
});

export type CreateTryOnDto = z.infer<typeof createTryOnSchema>;

export function validateCreateTryOn(data: unknown) {
    return createTryOnSchema.safeParse(data);
}

