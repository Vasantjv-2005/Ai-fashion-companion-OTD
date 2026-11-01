import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";
import { WARDROBE_GAP_PRIORITIES, WARDROBE_GAP_STATUSES } from "../../models/WardrobeGap";
import { WARDROBE_USAGE_OCCASIONS } from "../../models/WardrobeUsage";

export const logUsageSchema = z.object({
    wardrobeItemId: objectIdSchema,
    outfitId: objectIdSchema.optional(),
    eventId: objectIdSchema.optional(),
    occasion: z.enum(WARDROBE_USAGE_OCCASIONS).optional().default("daily"),
    usedAt: z
        .union([z.string().datetime(), z.date()])
        .optional()
        .transform((d) => (d ? new Date(d) : new Date())),
    notes: z.string().trim().max(1000).optional(),
});

export const updateGapStatusSchema = z.object({
    status: z.enum(WARDROBE_GAP_STATUSES),
});

export const gapQuerySchema = z.object({
    status: z.enum(WARDROBE_GAP_STATUSES).optional(),
    priority: z.enum(WARDROBE_GAP_PRIORITIES).optional(),
    category: z.string().trim().max(100).optional(),
});

export type LogUsageDto = z.infer<typeof logUsageSchema>;
export type UpdateGapStatusDto = z.infer<typeof updateGapStatusSchema>;
export type GapQueryDto = z.infer<typeof gapQuerySchema>;

export function validateLogUsage(data: unknown) {
    return logUsageSchema.safeParse(data);
}

export function validateUpdateGapStatus(data: unknown) {
    return updateGapStatusSchema.safeParse(data);
}

export function validateGapQuery(data: unknown) {
    return gapQuerySchema.safeParse(data);
}

