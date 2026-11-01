import { z } from "zod";

export const objectIdSchema = z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Must be a valid 24-character hexadecimal ID");

export const idParamSchema = z
    .object({
        id: objectIdSchema,
    })
    .strict();

export const emailSchema = z
    .string()
    .trim()
    .toLowerCase()
    .email("Must be a valid email address")
    .max(254, "Email must not exceed 254 characters");

export const dateSchema = z
    .union([z.string().datetime(), z.date()])
    .transform((val) => new Date(val));

export const dateRangeSchema = z
    .object({
        startDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
        endDate: z.string().datetime().optional().transform((d) => (d ? new Date(d) : undefined)),
    })
    .refine(
        (data) => {
            if (data.startDate && data.endDate) {
                return data.startDate <= data.endDate;
            }
            return true;
        },
        { message: "startDate must be before or equal to endDate" },
    );

export const booleanStringSchema = z
    .union([z.boolean(), z.enum(["true", "false"])])
    .transform((val) => val === true || val === "true");

export function validateId(id: unknown): string {
    return objectIdSchema.parse(id);
}

