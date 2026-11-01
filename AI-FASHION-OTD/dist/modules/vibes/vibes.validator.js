"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVibeSchema = exports.createVibeSchema = void 0;
exports.validateCreateVibe = validateCreateVibe;
exports.validateUpdateVibe = validateUpdateVibe;
const zod_1 = require("zod");
const UserVibe_1 = require("../../models/UserVibe");
exports.createVibeSchema = zod_1.z.object({
    mood: zod_1.z.enum(UserVibe_1.USER_VIBE_MOODS),
    preferredStyles: zod_1.z.array(zod_1.z.string().trim().max(50)).optional().default([]),
    preferredColors: zod_1.z.array(zod_1.z.string().trim().max(50)).optional().default([]),
    preferredSeasons: zod_1.z.array(zod_1.z.string().trim().max(50)).optional().default([]),
    occasion: zod_1.z.enum(UserVibe_1.USER_VIBE_OCCASIONS).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
});
exports.updateVibeSchema = zod_1.z
    .object({
    mood: zod_1.z.enum(UserVibe_1.USER_VIBE_MOODS).optional(),
    preferredStyles: zod_1.z.array(zod_1.z.string().trim().max(50)).optional(),
    preferredColors: zod_1.z.array(zod_1.z.string().trim().max(50)).optional(),
    preferredSeasons: zod_1.z.array(zod_1.z.string().trim().max(50)).optional(),
    occasion: zod_1.z.enum(UserVibe_1.USER_VIBE_OCCASIONS).optional(),
    notes: zod_1.z.string().trim().max(1000).optional(),
    isActive: zod_1.z.boolean().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update.",
});
function validateCreateVibe(data) {
    return exports.createVibeSchema.safeParse(data);
}
function validateUpdateVibe(data) {
    return exports.updateVibeSchema.safeParse(data);
}
