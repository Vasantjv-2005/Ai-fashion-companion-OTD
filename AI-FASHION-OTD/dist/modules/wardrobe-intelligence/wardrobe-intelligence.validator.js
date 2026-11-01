"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gapQuerySchema = exports.updateGapStatusSchema = exports.logUsageSchema = void 0;
exports.validateLogUsage = validateLogUsage;
exports.validateUpdateGapStatus = validateUpdateGapStatus;
exports.validateGapQuery = validateGapQuery;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
const WardrobeGap_1 = require("../../models/WardrobeGap");
const WardrobeUsage_1 = require("../../models/WardrobeUsage");
exports.logUsageSchema = zod_1.z.object({
    wardrobeItemId: common_validator_1.objectIdSchema,
    outfitId: common_validator_1.objectIdSchema.optional(),
    eventId: common_validator_1.objectIdSchema.optional(),
    occasion: zod_1.z.enum(WardrobeUsage_1.WARDROBE_USAGE_OCCASIONS).optional().default("daily"),
    usedAt: zod_1.z
        .union([zod_1.z.string().datetime(), zod_1.z.date()])
        .optional()
        .transform((d) => (d ? new Date(d) : new Date())),
    notes: zod_1.z.string().trim().max(1000).optional(),
});
exports.updateGapStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(WardrobeGap_1.WARDROBE_GAP_STATUSES),
});
exports.gapQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(WardrobeGap_1.WARDROBE_GAP_STATUSES).optional(),
    priority: zod_1.z.enum(WardrobeGap_1.WARDROBE_GAP_PRIORITIES).optional(),
    category: zod_1.z.string().trim().max(100).optional(),
});
function validateLogUsage(data) {
    return exports.logUsageSchema.safeParse(data);
}
function validateUpdateGapStatus(data) {
    return exports.updateGapStatusSchema.safeParse(data);
}
function validateGapQuery(data) {
    return exports.gapQuerySchema.safeParse(data);
}
