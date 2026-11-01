import { z } from "zod";
import { VENUE_TYPES } from "../../models/Venue";
import { objectIdSchema } from "../../validators/common.validator";

export const createVenueSchema = z.object({
    name: z.string().trim().min(2).max(200),
    venueType: z.enum(VENUE_TYPES).optional().default("other"),
    description: z.string().trim().max(2000).optional(),
    address: z.string().trim().min(2).max(500),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    dressCode: z.string().trim().max(200).optional().default("casual"),
    indoor: z.boolean().optional().default(true),
    suitableOccasions: z.array(z.string().trim().max(100)).optional().default([]),
    imageUrl: z.string().url().max(2048).optional(),
    websiteUrl: z.string().url().max(2048).optional(),
});

export const venueQuerySchema = z.object({
    city: z.string().trim().max(100).optional(),
    venueType: z.enum(VENUE_TYPES).optional(),
    search: z.string().trim().max(100).optional(),
    indoor: z
        .union([z.boolean(), z.enum(["true", "false"])])
        .optional()
        .transform((v) => (v !== undefined ? v === true || v === "true" : undefined)),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const venueIntelligenceQuerySchema = z.object({
    occasion: z.string().trim().max(100).optional(),
});

export type CreateVenueDto = z.infer<typeof createVenueSchema>;
export type VenueQueryDto = z.infer<typeof venueQuerySchema>;
export type VenueIntelligenceQueryDto = z.infer<typeof venueIntelligenceQuerySchema>;

export function validateCreateVenue(data: unknown) {
    return createVenueSchema.safeParse(data);
}

export function validateVenueQuery(data: unknown) {
    return venueQuerySchema.safeParse(data);
}

export function validateVenueIntelligenceQuery(data: unknown) {
    return venueIntelligenceQuerySchema.safeParse(data);
}

