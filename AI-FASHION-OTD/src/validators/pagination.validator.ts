import { z } from "zod";

export const paginationQuerySchema = z.object({
    page: z
        .union([z.string(), z.number()])
        .optional()
        .transform((val) => {
            if (val === undefined) return 1;
            const parsed = Number(val);
            return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
        }),
    limit: z
        .union([z.string(), z.number()])
        .optional()
        .transform((val) => {
            if (val === undefined) return 20;
            const parsed = Number(val);
            if (!Number.isInteger(parsed) || parsed < 1) return 20;
            return Math.min(100, parsed);
        }),
    sortBy: z.string().trim().max(50).optional().default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    search: z.string().trim().max(100).optional(),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function validatePaginationQuery(query: unknown) {
    return paginationQuerySchema.safeParse(query);
}

