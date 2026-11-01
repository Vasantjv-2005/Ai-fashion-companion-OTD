"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shoppingQuerySchema = exports.updateRecommendationStatusSchema = exports.createRecommendationSchema = void 0;
exports.validateCreateRecommendation = validateCreateRecommendation;
exports.validateUpdateRecommendationStatus = validateUpdateRecommendationStatus;
exports.validateShoppingQuery = validateShoppingQuery;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
const ShoppingRecommendation_1 = require("../../models/ShoppingRecommendation");
exports.createRecommendationSchema = zod_1.z.object({
    productName: zod_1.z.string().trim().min(2).max(200),
    brand: zod_1.z.string().trim().max(100).optional(),
    description: zod_1.z.string().trim().max(2000).optional(),
    category: zod_1.z.string().trim().min(1).max(100),
    color: zod_1.z.string().trim().max(50).optional(),
    style: zod_1.z.string().trim().max(50).optional(),
    season: zod_1.z.string().trim().max(50).optional(),
    productUrl: zod_1.z.string().url().max(2048),
    imageUrl: zod_1.z.string().url().max(2048).optional(),
    price: zod_1.z.number().min(0).optional(),
    currency: zod_1.z.string().trim().length(3).optional().default("INR"),
    source: zod_1.z.enum(ShoppingRecommendation_1.SHOPPING_RECOMMENDATION_SOURCES).optional().default("manual"),
    recommendationReason: zod_1.z.string().trim().max(1000).optional(),
    relatedWardrobeItemIds: zod_1.z.array(common_validator_1.objectIdSchema).optional().default([]),
});
exports.updateRecommendationStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(ShoppingRecommendation_1.SHOPPING_RECOMMENDATION_STATUSES),
});
exports.shoppingQuerySchema = zod_1.z.object({
    category: zod_1.z.string().trim().max(100).optional(),
    status: zod_1.z.enum(ShoppingRecommendation_1.SHOPPING_RECOMMENDATION_STATUSES).optional(),
    source: zod_1.z.enum(ShoppingRecommendation_1.SHOPPING_RECOMMENDATION_SOURCES).optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
});
function validateCreateRecommendation(data) {
    return exports.createRecommendationSchema.safeParse(data);
}
function validateUpdateRecommendationStatus(data) {
    return exports.updateRecommendationStatusSchema.safeParse(data);
}
function validateShoppingQuery(data) {
    return exports.shoppingQuerySchema.safeParse(data);
}
