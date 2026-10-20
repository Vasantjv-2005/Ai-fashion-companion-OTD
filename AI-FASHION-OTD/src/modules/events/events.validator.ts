
import { z } from "zod";

const eventTypeSchema = z
    .string()
    .trim()
    .min(2, "Event type must contain at least 2 characters.")
    .max(50, "Event type cannot exceed 50 characters.");

const dressCodeSchema = z
    .string()
    .trim()
    .min(2, "Dress code must contain at least 2 characters.")
    .max(50, "Dress code cannot exceed 50 characters.");

export const createEventSchema = z
    .object({
        title: z
            .string()
            .trim()
            .min(2, "Title must contain at least 2 characters.")
            .max(100, "Title cannot exceed 100 characters."),

        description: z
            .string()
            .trim()
            .max(1000, "Description cannot exceed 1000 characters.")
            .optional(),

        eventType: eventTypeSchema,

        date: z.coerce.date({
            error: "A valid event date is required.",
        }),

        location: z
            .string()
            .trim()
            .max(200, "Location cannot exceed 200 characters.")
            .optional(),

        dressCode: dressCodeSchema.optional(),
    })
    .strict();

export const updateEventSchema = createEventSchema
    .partial()
    .strict()
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field must be provided for an update."
    );

export const eventIdSchema = z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid event ID.");

export const eventListQuerySchema = z
    .object({
        page: z.coerce
            .number()
            .int()
            .min(1)
            .default(1),

        limit: z.coerce
            .number()
            .int()
            .min(1)
            .max(100)
            .default(20),

        eventType: z
            .string()
            .trim()
            .min(2)
            .max(50)
            .optional(),

        fromDate: z.coerce.date().optional(),

        toDate: z.coerce.date().optional(),

        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        sortBy: z
            .enum(["date", "createdAt", "title"])
            .default("date"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("asc"),
    })
    .strict()
    .refine(
        (data) =>
            !data.fromDate ||
            !data.toDate ||
            data.fromDate <= data.toDate,
        {
            message: "fromDate must be before or equal to toDate.",
            path: ["fromDate"],
        }
    );

export type CreateEventSchemaInput = z.infer<
    typeof createEventSchema
>;

export type UpdateEventSchemaInput = z.infer<
    typeof updateEventSchema
>;

export type EventListQueryInput = z.infer<
    typeof eventListQuerySchema
>;

export function validateCreateEvent(input: unknown) {
    return createEventSchema.parse(input);
}

export function validateUpdateEvent(input: unknown) {
    return updateEventSchema.parse(input);
}

export function validateEventId(input: unknown) {
    return eventIdSchema.parse(input);
}

export function validateEventListQuery(input: unknown) {
    return eventListQuerySchema.parse(input);
}
