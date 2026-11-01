"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAvatarSchema = exports.createAvatarSchema = void 0;
exports.validateCreateAvatar = validateCreateAvatar;
exports.validateUpdateAvatar = validateUpdateAvatar;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
exports.createAvatarSchema = zod_1.z.object({
    displayName: zod_1.z.string().trim().max(100).optional().default(""),
    source: zod_1.z.enum(["upload", "generated", "preset"]).optional().default("upload"),
    imageUrl: zod_1.z.string().url().max(2048).optional(),
    imageFileId: common_validator_1.objectIdSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.updateAvatarSchema = zod_1.z.object({
    displayName: zod_1.z.string().trim().max(100).optional(),
    source: zod_1.z.enum(["upload", "generated", "preset"]).optional(),
    imageUrl: zod_1.z.string().url().max(2048).optional(),
    imageFileId: common_validator_1.objectIdSchema.optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    isActive: zod_1.z.boolean().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
});
function validateCreateAvatar(data) {
    return exports.createAvatarSchema.safeParse(data);
}
function validateUpdateAvatar(data) {
    return exports.updateAvatarSchema.safeParse(data);
}
