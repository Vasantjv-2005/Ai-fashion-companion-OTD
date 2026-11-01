import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";

export const sendMessageSchema = z.object({
    conversationId: z.string().trim().max(100).optional(),
    content: z
        .string()
        .trim()
        .min(1, "Message content cannot be empty.")
        .max(5000, "Message content cannot exceed 5000 characters."),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const stylistAdviceSchema = z.object({
    message: z
        .string()
        .trim()
        .min(1, "Message is required.")
        .max(2000, "Message cannot exceed 2000 characters."),
    occasion: z.string().trim().max(100).optional(),
    season: z.string().trim().max(50).optional(),
    style: z.string().trim().max(100).optional(),
    conversationId: z.string().trim().max(100).optional(),
});

export const outfitPipelineSchema = z.object({
    occasion: z.string().trim().max(100).optional().default("casual"),
    season: z.string().trim().max(50).optional(),
    style: z.string().trim().max(100).optional(),
    location: z.string().trim().max(200).optional(),
    coordinates: z
        .object({
            latitude: z.number().min(-90).max(90),
            longitude: z.number().min(-180).max(180),
        })
        .optional(),
    excludedItemIds: z.array(objectIdSchema).optional(),
    preferredColor: z.string().trim().max(50).optional(),
});

export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type StylistAdviceDto = z.infer<typeof stylistAdviceSchema>;
export type OutfitPipelineDto = z.infer<typeof outfitPipelineSchema>;

export function validateSendMessage(data: unknown) {
    return sendMessageSchema.safeParse(data);
}

export function validateStylistAdvice(data: unknown) {
    return stylistAdviceSchema.safeParse(data);
}

export function validateOutfitPipeline(data: unknown) {
    return outfitPipelineSchema.safeParse(data);
}

