"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationQuerySchema = void 0;
exports.validatePaginationQuery = validatePaginationQuery;
const zod_1 = require("zod");
exports.paginationQuerySchema = zod_1.z.object({
    page: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .optional()
        .transform((val) => {
        if (val === undefined)
            return 1;
        const parsed = Number(val);
        return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
    }),
    limit: zod_1.z
        .union([zod_1.z.string(), zod_1.z.number()])
        .optional()
        .transform((val) => {
        if (val === undefined)
            return 20;
        const parsed = Number(val);
        if (!Number.isInteger(parsed) || parsed < 1)
            return 20;
        return Math.min(100, parsed);
    }),
    sortBy: zod_1.z.string().trim().max(50).optional().default("createdAt"),
    sortOrder: zod_1.z.enum(["asc", "desc"]).optional().default("desc"),
    search: zod_1.z.string().trim().max(100).optional(),
});
function validatePaginationQuery(query) {
    return exports.paginationQuerySchema.safeParse(query);
}
