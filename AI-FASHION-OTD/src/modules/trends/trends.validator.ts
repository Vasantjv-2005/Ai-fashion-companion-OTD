import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";
import { FASHION_TREND_CATEGORIES } from "../../models/FashionTrend";
import { USER_TREND_INTERACTION_TYPES } from "../../models/UserTrendInteraction";

export const trendQuerySchema = z.object({
    category: z.enum(FASHION_TREND_CATEGORIES).optional(),
    season: z.string().trim().max(50).optional(),
    year: z.coerce.number().int().min(2000).max(2100).optional(),
    search: z.string().trim().max(100).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const interactTrendSchema = z.object({
    trendId: objectIdSchema,
    interactionType: z.enum(USER_TREND_INTERACTION_TYPES),
});

export type TrendQueryDto = z.infer<typeof trendQuerySchema>;
export type InteractTrendDto = z.infer<typeof interactTrendSchema>;

export function validateTrendQuery(data: unknown) {
    return trendQuerySchema.safeParse(data);
}

export function validateInteractTrend(data: unknown) {
    return interactTrendSchema.safeParse(data);
}

