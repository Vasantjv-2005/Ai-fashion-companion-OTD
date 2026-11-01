import { z } from "zod";
import { objectIdSchema } from "../../validators/common.validator";
import {
    SHOPPING_RECOMMENDATION_SOURCES,
    SHOPPING_RECOMMENDATION_STATUSES,
} from "../../models/ShoppingRecommendation";

export const createRecommendationSchema = z.object({
    productName: z.string().trim().min(2).max(200),
    brand: z.string().trim().max(100).optional(),
    description: z.string().trim().max(2000).optional(),
    category: z.string().trim().min(1).max(100),
    color: z.string().trim().max(50).optional(),
    style: z.string().trim().max(50).optional(),
    season: z.string().trim().max(50).optional(),
    productUrl: z.string().url().max(2048),
    imageUrl: z.string().url().max(2048).optional(),
    price: z.number().min(0).optional(),
    currency: z.string().trim().length(3).optional().default("INR"),
    source: z.enum(SHOPPING_RECOMMENDATION_SOURCES).optional().default("manual"),
    recommendationReason: z.string().trim().max(1000).optional(),
    relatedWardrobeItemIds: z.array(objectIdSchema).optional().default([]),
});

export const updateRecommendationStatusSchema = z.object({
    status: z.enum(SHOPPING_RECOMMENDATION_STATUSES),
});

export const shoppingQuerySchema = z.object({
    category: z.string().trim().max(100).optional(),
    status: z.enum(SHOPPING_RECOMMENDATION_STATUSES).optional(),
    source: z.enum(SHOPPING_RECOMMENDATION_SOURCES).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateRecommendationDto = z.infer<typeof createRecommendationSchema>;
export type UpdateRecommendationStatusDto = z.infer<typeof updateRecommendationStatusSchema>;
export type ShoppingQueryDto = z.infer<typeof shoppingQuerySchema>;

export function validateCreateRecommendation(data: unknown) {
    return createRecommendationSchema.safeParse(data);
}

export function validateUpdateRecommendationStatus(data: unknown) {
    return updateRecommendationStatusSchema.safeParse(data);
}

export function validateShoppingQuery(data: unknown) {
    return shoppingQuerySchema.safeParse(data);
}

