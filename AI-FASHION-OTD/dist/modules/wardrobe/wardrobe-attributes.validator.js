"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wardrobeAttributesSchema = exports.clothingCategorySchema = void 0;
exports.validateWardrobeAttributes = validateWardrobeAttributes;
exports.validateWardrobeAttributesList = validateWardrobeAttributesList;
const zod_1 = require("zod");
/**
 * Validates clothing attributes returned by the AI service.
 * AI predictions must be validated before being used by the backend.
 */
exports.clothingCategorySchema = zod_1.z.enum([
    "shirt",
    "tshirt",
    "top",
    "blouse",
    "trousers",
    "jeans",
    "shorts",
    "skirt",
    "dress",
    "jacket",
    "coat",
    "sweater",
    "hoodie",
    "suit",
    "shoes",
    "accessory",
    "other",
]);
exports.wardrobeAttributesSchema = zod_1.z.object({
    category: exports.clothingCategorySchema,
    color: zod_1.z.string().trim().min(1).max(50).optional(),
    secondaryColor: zod_1.z.string().trim().min(1).max(50).optional(),
    material: zod_1.z.string().trim().min(1).max(80).optional(),
    pattern: zod_1.z.string().trim().min(1).max(80).optional(),
    style: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(50))
        .max(20)
        .optional(),
    season: zod_1.z
        .array(zod_1.z.enum([
        "spring",
        "summer",
        "autumn",
        "winter",
        "all-season",
    ]))
        .max(5)
        .optional(),
    occasions: zod_1.z
        .array(zod_1.z.string().trim().min(1).max(50))
        .max(20)
        .optional(),
    confidence: zod_1.z.number().min(0).max(1),
});
/**
 * Validates a single AI clothing prediction.
 * Throws a Zod validation error if the data is invalid.
 */
function validateWardrobeAttributes(input) {
    return exports.wardrobeAttributesSchema.parse(input);
}
/**
 * Validates multiple AI clothing predictions.
 */
function validateWardrobeAttributesList(input) {
    return zod_1.z.array(exports.wardrobeAttributesSchema).parse(input);
}
