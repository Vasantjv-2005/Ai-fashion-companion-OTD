import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    trendFind: vi.fn(),
    trendFindById: vi.fn(),
    trendCountDocuments: vi.fn(),
    interactionCreate: vi.fn(),
    prefFindOne: vi.fn(),
}));

vi.mock("../../src/models/FashionTrend", () => ({
    default: {
        find: mocks.trendFind,
        findById: mocks.trendFindById,
        countDocuments: mocks.trendCountDocuments,
    },
}));

vi.mock("../../src/models/UserTrendInteraction", () => ({
    default: {
        create: mocks.interactionCreate,
    },
}));

vi.mock("../../src/models/UserPreference", () => ({
    default: {
        findOne: mocks.prefFindOne,
    },
}));

import {
    getTrends,
    getTrendById,
    recordTrendInteraction,
    getPersonalizedTrends,
    TrendServiceError,
} from "../../src/modules/trends/trends.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_TREND_ID = "507f1f77bcf86cd799439012";

describe("Trends service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("getTrends", () => {
        it("should return paginated trends", async () => {
            const mockTrends = [
                {
                    _id: new mongoose.Types.ObjectId(TEST_TREND_ID),
                    name: "Quiet Luxury",
                    popularityScore: 92,
                    isActive: true,
                },
            ];

            mocks.trendFind.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    skip: vi.fn().mockReturnValue({
                        limit: vi.fn().mockReturnValue({
                            lean: vi.fn().mockReturnValue({
                                exec: vi.fn().mockResolvedValue(mockTrends),
                            }),
                        }),
                    }),
                }),
            });

            mocks.trendCountDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(1),
            });

            const result = await getTrends();
            expect(result.trends.length).toBe(1);
            expect(result.trends[0].name).toBe("Quiet Luxury");
            expect(result.pagination.total).toBe(1);
        });
    });

    describe("getTrendById", () => {
        it("should return trend when found", async () => {
            const trend = {
                _id: new mongoose.Types.ObjectId(TEST_TREND_ID),
                name: "Normcore",
                isActive: true,
            };

            mocks.trendFindById.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(trend),
                }),
            });

            const result = await getTrendById(TEST_TREND_ID);
            expect(result.name).toBe("Normcore");
        });

        it("should throw 404 when trend not found", async () => {
            mocks.trendFindById.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(getTrendById(TEST_TREND_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Trend not found.",
            });
        });
    });

    describe("recordTrendInteraction", () => {
        it("should record interaction and increment popularityScore on save", async () => {
            const mockTrend = {
                _id: new mongoose.Types.ObjectId(TEST_TREND_ID),
                popularityScore: 50,
                save: vi.fn().mockResolvedValue(true),
            };

            mocks.trendFindById.mockReturnValue({
                exec: vi.fn().mockResolvedValue(mockTrend),
            });

            const mockInteraction = {
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                trendId: new mongoose.Types.ObjectId(TEST_TREND_ID),
                interactionType: "save",
            };

            mocks.interactionCreate.mockResolvedValue({
                toObject: () => mockInteraction,
            });

            const result = await recordTrendInteraction(TEST_USER_ID, {
                trendId: TEST_TREND_ID,
                interactionType: "save",
            });

            expect(result.interactionType).toBe("save");
            expect(mockTrend.popularityScore).toBe(51);
            expect(mockTrend.save).toHaveBeenCalled();
        });
    });
});

