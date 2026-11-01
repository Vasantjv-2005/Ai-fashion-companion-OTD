"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventListQuerySchema = exports.eventIdSchema = exports.updateEventSchema = exports.createEventSchema = void 0;
exports.validateCreateEvent = validateCreateEvent;
exports.validateUpdateEvent = validateUpdateEvent;
exports.validateEventId = validateEventId;
exports.validateEventListQuery = validateEventListQuery;
const zod_1 = require("zod");
const eventTypeSchema = zod_1.z
    .string()
    .trim()
    .min(2, "Event type must contain at least 2 characters.")
    .max(50, "Event type cannot exceed 50 characters.");
const dressCodeSchema = zod_1.z
    .string()
    .trim()
    .min(2, "Dress code must contain at least 2 characters.")
    .max(50, "Dress code cannot exceed 50 characters.");
exports.createEventSchema = zod_1.z
    .object({
    title: zod_1.z
        .string()
        .trim()
        .min(2, "Title must contain at least 2 characters.")
        .max(100, "Title cannot exceed 100 characters."),
    description: zod_1.z
        .string()
        .trim()
        .max(1000, "Description cannot exceed 1000 characters.")
        .optional(),
    eventType: eventTypeSchema,
    date: zod_1.z.coerce.date({
        error: "A valid event date is required.",
    }),
    location: zod_1.z
        .string()
        .trim()
        .max(200, "Location cannot exceed 200 characters.")
        .optional(),
    dressCode: dressCodeSchema.optional(),
})
    .strict();
exports.updateEventSchema = exports.createEventSchema
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, "At least one field must be provided for an update.");
exports.eventIdSchema = zod_1.z
    .string()
    .regex(/^[a-f\d]{24}$/i, "Invalid event ID.");
exports.eventListQuerySchema = zod_1.z
    .object({
    page: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .default(1),
    limit: zod_1.z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20),
    eventType: zod_1.z
        .string()
        .trim()
        .min(2)
        .max(50)
        .optional(),
    fromDate: zod_1.z.coerce.date().optional(),
    toDate: zod_1.z.coerce.date().optional(),
    search: zod_1.z
        .string()
        .trim()
        .max(100)
        .optional(),
    sortBy: zod_1.z
        .enum(["date", "createdAt", "title"])
        .default("date"),
    sortOrder: zod_1.z
        .enum(["asc", "desc"])
        .default("asc"),
})
    .strict()
    .refine((data) => !data.fromDate ||
    !data.toDate ||
    data.fromDate <= data.toDate, {
    message: "fromDate must be before or equal to toDate.",
    path: ["fromDate"],
});
function validateCreateEvent(input) {
    return exports.createEventSchema.parse(input);
}
function validateUpdateEvent(input) {
    return exports.updateEventSchema.parse(input);
}
function validateEventId(input) {
    return exports.eventIdSchema.parse(input);
}
function validateEventListQuery(input) {
    return exports.eventListQuerySchema.parse(input);
}
