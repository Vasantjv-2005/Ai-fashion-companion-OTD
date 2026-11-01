import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    venueCreate: vi.fn(),
    venueFind: vi.fn(),
    venueFindById: vi.fn(),
    venueCountDocuments: vi.fn(),
    intelCreate: vi.fn(),
}));

vi.mock("../../src/models/Venue", () => ({
    default: {
        create: mocks.venueCreate,
        find: mocks.venueFind,
        findById: mocks.venueFindById,
        countDocuments: mocks.venueCountDocuments,
    },
}));

vi.mock("../../src/models/VenueIntelligence", () => ({
    default: {
        create: mocks.intelCreate,
    },
}));

import {
    createVenue,
    getVenues,
    getVenueById,
    getVenueIntelligence,
    VenueServiceError,
} from "../../src/modules/venues/venues.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_VENUE_ID = "507f1f77bcf86cd799439012";

describe("Venues service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("createVenue", () => {
        it("should create venue record", async () => {
            const input = {
                name: "The Grand Ballroom",
                venueType: "wedding_hall" as const,
                address: "123 Main St",
                city: "London",
                indoor: true,
                dressCode: "formal",
                suitableOccasions: ["wedding"],
            };

            const created = {
                _id: new mongoose.Types.ObjectId(TEST_VENUE_ID),
                ...input,
                createdBy: new mongoose.Types.ObjectId(TEST_USER_ID),
            };

            mocks.venueCreate.mockResolvedValue({
                toObject: () => created,
            });

            const result = await createVenue(TEST_USER_ID, input);
            expect(result.name).toBe("The Grand Ballroom");
            expect(mocks.venueCreate).toHaveBeenCalled();
        });
    });

    describe("getVenueIntelligence", () => {
        it("should generate formal dress code recommendations for wedding halls", async () => {
            const venue = {
                _id: new mongoose.Types.ObjectId(TEST_VENUE_ID),
                name: "Ritz Hotel",
                venueType: "wedding_hall",
                dressCode: "formal",
                indoor: true,
                suitableOccasions: ["wedding", "gala"],
            };

            mocks.venueFindById.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(venue),
                }),
            });

            const intelligenceRecord = {
                venueId: new mongoose.Types.ObjectId(TEST_VENUE_ID),
                venueName: "Ritz Hotel",
                recommendedStyles: ["formal", "smart-casual"],
                recommendedColors: ["navy", "black", "burgundy", "charcoal"],
            };

            mocks.intelCreate.mockResolvedValue({
                toObject: () => intelligenceRecord,
            });

            const result = await getVenueIntelligence(TEST_USER_ID, TEST_VENUE_ID, "wedding");
            expect(result.venueName).toBe("Ritz Hotel");
            expect(result.recommendedStyles).toContain("formal");
            expect(mocks.intelCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    recommendedStyles: expect.arrayContaining(["formal"]),
                }),
            );
        });

        it("should throw 404 when venue not found", async () => {
            mocks.venueFindById.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(
                getVenueIntelligence(TEST_USER_ID, TEST_VENUE_ID),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Venue not found.",
            });
        });
    });
});
