"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.booleanStringSchema = exports.dateRangeSchema = exports.dateSchema = exports.emailSchema = exports.idParamSchema = exports.objectIdSchema = void 0;
exports.validateId = validateId;
const zod_1 = require("zod");
exports.objectIdSchema = zod_1.z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hexadecimal ID");
exports.idParamSchema = zod_1.z
    .object({
    id: exports.objectIdSchema,
})
    .strict();
exports.emailSchema = zod_1.z
    .string()
    .trim()
    .toLowerCase()
    .email("Must be a valid email address")
    .max(254, "Email must not exceed 254 characters");
exports.dateSchema = zod_1.z
    .union([zod_1.z.string().datetime(), zod_1.z.date()])
    .transform((val) => new Date(val));
exports.dateRangeSchema = zod_1.z
    .object({
    startDate: zod_1.z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
    endDate: zod_1.z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
})
    .refine((data) => {
    if (data.startDate && data.endDate) {
        return data.startDate <= data.endDate;
    }
    return true;
}, { message: "startDate must be before or equal to endDate" });
exports.booleanStringSchema = zod_1.z
    .union([zod_1.z.boolean(), zod_1.z.enum(["true", "false"])])
    .transform((val) => val === true || val === "true");
function validateId(id) {
    return exports.objectIdSchema.parse(id);
}
