"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.outfitPipelineSchema = exports.stylistAdviceSchema = exports.sendMessageSchema = void 0;
exports.validateSendMessage = validateSendMessage;
exports.validateStylistAdvice = validateStylistAdvice;
exports.validateOutfitPipeline = validateOutfitPipeline;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
exports.sendMessageSchema = zod_1.z.object({
    conversationId: zod_1.z.string().trim().max(100).optional(),
    content: zod_1.z
        .string()
        .trim()
        .min(1, "Message content cannot be empty.")
        .max(5000, "Message content cannot exceed 5000 characters."),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.stylistAdviceSchema = zod_1.z.object({
    message: zod_1.z
        .string()
        .trim()
        .min(1, "Message is required.")
        .max(2000, "Message cannot exceed 2000 characters."),
    occasion: zod_1.z.string().trim().max(100).optional(),
    season: zod_1.z.string().trim().max(50).optional(),
    style: zod_1.z.string().trim().max(100).optional(),
    conversationId: zod_1.z.string().trim().max(100).optional(),
});
exports.outfitPipelineSchema = zod_1.z.object({
    occasion: zod_1.z.string().trim().max(100).optional().default("casual"),
    season: zod_1.z.string().trim().max(50).optional(),
    style: zod_1.z.string().trim().max(100).optional(),
    location: zod_1.z.string().trim().max(200).optional(),
    coordinates: zod_1.z
        .object({
        latitude: zod_1.z.number().min(-90).max(90),
        longitude: zod_1.z.number().min(-180).max(180),
    })
        .optional(),
    excludedItemIds: zod_1.z.array(common_validator_1.objectIdSchema).optional(),
    preferredColor: zod_1.z.string().trim().max(50).optional(),
});
function validateSendMessage(data) {
    return exports.sendMessageSchema.safeParse(data);
}
function validateStylistAdvice(data) {
    return exports.stylistAdviceSchema.safeParse(data);
}
function validateOutfitPipeline(data) {
    return exports.outfitPipelineSchema.safeParse(data);
}
