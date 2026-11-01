import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    itemFind: vi.fn(),
    itemFindOne: vi.fn(),
    gapFind: vi.fn(),
    gapFindOneAndUpdate: vi.fn(),
    usageFind: vi.fn(),
    usageCreate: vi.fn(),
    usageAggregate: vi.fn(),
}));

vi.mock("../../src/models/WardrobeItem", () => ({
    default: {
        find: mocks.itemFind,
        findOne: mocks.itemFindOne,
    },
}));

vi.mock("../../src/models/WardrobeGap", () => ({
    default: {
        find: mocks.gapFind,
        findOneAndUpdate: mocks.gapFindOneAndUpdate,
    },
}));

vi.mock("../../src/models/WardrobeUsage", () => ({
    default: {
        find: mocks.usageFind,
        create: mocks.usageCreate,
        aggregate: mocks.usageAggregate,
    },
}));

import {
    getWardrobeAnalytics,
    analyzeWardrobeGaps,
    getWardrobeGaps,
    updateGapStatus,
    logWardrobeUsage,
    getItemUsageStats,
    WardrobeIntelligenceServiceError,
} from "../../src/modules/wardrobe-intelligence/wardrobe-intelligence.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_ITEM_ID = "507f1f77bcf86cd799439012";
const TEST_GAP_ID = "507f1f77bcf86cd799439013";

describe("Wardrobe Intelligence service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("getWardrobeAnalytics", () => {
        it("should calculate category, style, and wear breakdowns", async () => {
            const mockItems = [
                {
                    _id: new mongoose.Types.ObjectId(TEST_ITEM_ID),
                    userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                    name: "White Shirt",
                    category: "tops",
                    style: "casual",
                    color: "white",
                    season: ["summer", "spring"],
                    createdAt: new Date(),
                },
            ];

            mocks.itemFind.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(mockItems),
                }),
            });

            mocks.usageAggregate.mockReturnValue({
                exec: vi.fn().mockResolvedValue([
                    {
                        _id: new mongoose.Types.ObjectId(TEST_ITEM_ID),
                        totalWears: 5,
                        lastWorn: new Date(),
                    },
                ]),
            });

            const analytics = await getWardrobeAnalytics(TEST_USER_ID);
            expect(analytics.totalItems).toBe(1);
            expect(analytics.categories.tops).toBe(1);
            expect(analytics.styles.casual).toBe(1);
            expect(analytics.colors.white).toBe(1);
            expect(analytics.mostWornItems.length).toBe(1);
            expect(analytics.mostWornItems[0].wearCount).toBe(5);
        });
    });

    describe("analyzeWardrobeGaps", () => {
        it("should identify missing categories and upsert gaps", async () => {
            mocks.itemFind.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue([]), // Empty wardrobe
                }),
            });

            mocks.gapFindOneAndUpdate.mockReturnValue({
                exec: vi.fn().mockResolvedValue({}),
            });

            mocks.gapFind.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue([
                            { category: "tops", priority: "high" },
                            { category: "bottoms", priority: "high" },
                            { category: "shoes", priority: "high" },
                        ]),
                    }),
                }),
            });

            const gaps = await analyzeWardrobeGaps(TEST_USER_ID);
            expect(gaps.length).toBe(3);
            expect(mocks.gapFindOneAndUpdate).toHaveBeenCalled();
        });
    });

    describe("logWardrobeUsage", () => {
        it("should verify ownership and log usage", async () => {
            mocks.itemFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue({
                    _id: new mongoose.Types.ObjectId(TEST_ITEM_ID),
                    userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                }),
            });

            const mockLog = {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                wardrobeItemId: new mongoose.Types.ObjectId(TEST_ITEM_ID),
                occasion: "daily",
            };

            mocks.usageCreate.mockResolvedValue({
                toObject: () => mockLog,
            });

            const result = await logWardrobeUsage(TEST_USER_ID, {
                wardrobeItemId: TEST_ITEM_ID,
                occasion: "daily",
                usedAt: new Date(),
            });

            expect(result).toEqual(mockLog);
            expect(mocks.usageCreate).toHaveBeenCalled();
        });

        it("should throw 404 when item does not belong to user", async () => {
            mocks.itemFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(
                logWardrobeUsage(TEST_USER_ID, {
                    wardrobeItemId: TEST_ITEM_ID,
                    occasion: "daily",
                    usedAt: new Date(),
                }),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Wardrobe item not found or access denied.",
            });
        });
    });

    describe("getItemUsageStats", () => {
        it("should aggregate item usage statistics", async () => {
            const usageRecords = [
                {
                    occasion: "casual",
                    usedAt: new Date("2026-02-01"),
                },
                {
                    occasion: "casual",
                    usedAt: new Date("2026-02-10"),
                },
                {
                    occasion: "party",
                    usedAt: new Date("2026-02-15"),
                },
            ];

            mocks.usageFind.mockReturnValue({
                sort: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue(usageRecords),
                    }),
                }),
            });

            const stats = await getItemUsageStats(TEST_USER_ID, TEST_ITEM_ID);
            expect(stats.totalWears).toBe(3);
            expect(stats.occasions.casual).toBe(2);
            expect(stats.occasions.party).toBe(1);
        });
    });
});
