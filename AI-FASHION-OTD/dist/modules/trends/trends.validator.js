"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interactTrendSchema = exports.trendQuerySchema = void 0;
exports.validateTrendQuery = validateTrendQuery;
exports.validateInteractTrend = validateInteractTrend;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
const FashionTrend_1 = require("../../models/FashionTrend");
const UserTrendInteraction_1 = require("../../models/UserTrendInteraction");
exports.trendQuerySchema = zod_1.z.object({
    category: zod_1.z.enum(FashionTrend_1.FASHION_TREND_CATEGORIES).optional(),
    season: zod_1.z.string().trim().max(50).optional(),
    year: zod_1.z.coerce.number().int().min(2000).max(2100).optional(),
    search: zod_1.z.string().trim().max(100).optional(),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
});
exports.interactTrendSchema = zod_1.z.object({
    trendId: common_validator_1.objectIdSchema,
    interactionType: zod_1.z.enum(UserTrendInteraction_1.USER_TREND_INTERACTION_TYPES),
});
function validateTrendQuery(data) {
    return exports.trendQuerySchema.safeParse(data);
}
function validateInteractTrend(data) {
    return exports.interactTrendSchema.safeParse(data);
}
