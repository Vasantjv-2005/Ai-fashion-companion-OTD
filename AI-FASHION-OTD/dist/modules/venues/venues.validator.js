"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.venueIntelligenceQuerySchema = exports.venueQuerySchema = exports.createVenueSchema = void 0;
exports.validateCreateVenue = validateCreateVenue;
exports.validateVenueQuery = validateVenueQuery;
exports.validateVenueIntelligenceQuery = validateVenueIntelligenceQuery;
const zod_1 = require("zod");
const Venue_1 = require("../../models/Venue");
exports.createVenueSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(200),
    venueType: zod_1.z.enum(Venue_1.VENUE_TYPES).optional().default("other"),
    description: zod_1.z.string().trim().max(2000).optional(),
    address: zod_1.z.string().trim().min(2).max(500),
    city: zod_1.z.string().trim().max(100).optional(),
    state: zod_1.z.string().trim().max(100).optional(),
    country: zod_1.z.string().trim().max(100).optional(),
    latitude: zod_1.z.number().min(-90).max(90).optional(),
    longitude: zod_1.z.number().min(-180).max(180).optional(),
    dressCode: zod_1.z.string().trim().max(200).optional().default("casual"),
    indoor: zod_1.z.boolean().optional().default(true),
    suitableOccasions: zod_1.z.array(zod_1.z.string().trim().max(100)).optional().default([]),
    imageUrl: zod_1.z.string().url().max(2048).optional(),
    websiteUrl: zod_1.z.string().url().max(2048).optional(),
});
exports.venueQuerySchema = zod_1.z.object({
    city: zod_1.z.string().trim().max(100).optional(),
    venueType: zod_1.z.enum(Venue_1.VENUE_TYPES).optional(),
    search: zod_1.z.string().trim().max(100).optional(),
    indoor: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.enum(["true", "false"])])
        .optional()
        .transform((v) => (v !== undefined ? v === true || v === "true" : undefined)),
    page: zod_1.z.coerce.number().int().min(1).optional().default(1),
    limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
});
exports.venueIntelligenceQuerySchema = zod_1.z.object({
    occasion: zod_1.z.string().trim().max(100).optional(),
});
function validateCreateVenue(data) {
    return exports.createVenueSchema.safeParse(data);
}
function validateVenueQuery(data) {
    return exports.venueQuerySchema.safeParse(data);
}
function validateVenueIntelligenceQuery(data) {
    return exports.venueIntelligenceQuerySchema.safeParse(data);
}
