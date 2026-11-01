"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialFeedQuerySchema = exports.addCommentSchema = exports.shareOutfitSchema = void 0;
exports.validateShareOutfit = validateShareOutfit;
exports.validateAddComment = validateAddComment;
exports.validateSocialFeedQuery = validateSocialFeedQuery;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
const OutfitShare_1 = require("../../models/OutfitShare");
exports.shareOutfitSchema = zod_1.z.object({
    outfitId: common_validator_1.objectIdSchema,
    title: zod_1.z.string().trim().max(150).optional().default(""),
    description: zod_1.z.string().trim().max(1000).optional().default(""),
    visibility: zod_1.z.enum(OutfitShare_1.OUTFIT_SHARE_VISIBILITY).optional().default("public"),
    expiresAt: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]).optional().transform((d) => (d ? new Date(d) : undefined)),
});
exports.addCommentSchema = zod_1.z.object({
    content: zod_1.z
        .string()
        .trim()
        .min(1, "Comment cannot be empty.")
        .max(2000, "Comment cannot exceed 2000 characters."),
    parentCommentId: common_validator_1.objectIdSchema.optional(),
});
exports.socialFeedQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
});
function validateShareOutfit(data) {
    return exports.shareOutfitSchema.safeParse(data);
}
function validateAddComment(data) {
    return exports.addCommentSchema.safeParse(data);
}
function validateSocialFeedQuery(data) {
    return exports.socialFeedQuerySchema.safeParse(data);
}
