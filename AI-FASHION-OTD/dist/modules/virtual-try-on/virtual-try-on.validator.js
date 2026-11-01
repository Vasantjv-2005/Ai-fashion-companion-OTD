"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTryOnSchema = void 0;
exports.validateCreateTryOn = validateCreateTryOn;
const zod_1 = require("zod");
const common_validator_1 = require("../../validators/common.validator");
const VirtualTryOn_1 = require("../../models/VirtualTryOn");
exports.createTryOnSchema = zod_1.z.object({
    wardrobeItemIds: zod_1.z
        .array(common_validator_1.objectIdSchema)
        .min(1, "At least one wardrobe item is required for virtual try-on.")
        .max(5, "Maximum 5 items per try-on session."),
    userImageUrl: zod_1.z.string().url("Must be a valid image URL").optional(),
    tryOnType: zod_1.z.enum(VirtualTryOn_1.VIRTUAL_TRY_ON_TYPES).optional().default("single_item"),
    prompt: zod_1.z.string().trim().max(1000).optional(),
});
function validateCreateTryOn(data) {
    return exports.createTryOnSchema.safeParse(data);
}
