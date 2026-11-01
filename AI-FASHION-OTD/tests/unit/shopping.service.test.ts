import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    recCreate: vi.fn(),
    recFind: vi.fn(),
    recFindOne: vi.fn(),
    recFindOneAndUpdate: vi.fn(),
    recFindOneAndDelete: vi.fn(),
    recCountDocuments: vi.fn(),
    gapFind: vi.fn(),
}));

vi.mock("../../src/models/ShoppingRecommendation", () => ({
    default: {
        create: mocks.recCreate,
        find: mocks.recFind,
        findOne: mocks.recFindOne,
        findOneAndUpdate: mocks.recFindOneAndUpdate,
        findOneAndDelete: mocks.recFindOneAndDelete,
        countDocuments: mocks.recCountDocuments,
    },
}));

vi.mock("../../src/models/WardrobeGap", () => ({
    default: {
        find: mocks.gapFind,
    },
}));

import {
    createRecommendation,
    getRecommendations,
    updateRecommendationStatus,
    generateGapShoppingList,
    deleteRecommendation,
    ShoppingServiceError,
} from "../../src/modules/shopping/shopping.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_REC_ID = "507f1f77bcf86cd799439012";

describe("Shopping service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("createRecommendation", () => {
        it("should create shopping recommendation", async () => {
            const input = {
                productName: "Classic Oxford White Shirt",
                brand: "Uniqlo",
                category: "tops",
                price: 39.9,
                currency: "USD",
                productUrl: "https://example.com/shirt",
                source: "manual" as const,
                relatedWardrobeItemIds: [],
            };

            const created = {
                _id: new mongoose.Types.ObjectId(TEST_REC_ID),
                ...input,
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
            };

            mocks.recCreate.mockResolvedValue({
                toObject: () => created,
            });

            const result = await createRecommendation(TEST_USER_ID, input);
            expect(result.productName).toBe(input.productName);
            expect(mocks.recCreate).toHaveBeenCalled();
        });
    });

    describe("updateRecommendationStatus", () => {
        it("should update recommendation status", async () => {
            const updated = {
                _id: new mongoose.Types.ObjectId(TEST_REC_ID),
                status: "saved",
            };

            mocks.recFindOneAndUpdate.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(updated),
                }),
            });

            const result = await updateRecommendationStatus(TEST_USER_ID, TEST_REC_ID, "saved");
            expect(result.status).toBe("saved");
        });

        it("should throw 404 if recommendation not found", async () => {
            mocks.recFindOneAndUpdate.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(
                updateRecommendationStatus(TEST_USER_ID, TEST_REC_ID, "saved"),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Shopping recommendation not found.",
            });
        });
    });

    describe("generateGapShoppingList", () => {
        it("should convert wardrobe gaps into shopping recommendations", async () => {
            const mockGaps = [
                {
                    category: "bottoms",
                    title: "Missing Trousers",
                    description: "Add chinos or jeans",
                    reason: "Category missing",
                    suggestedItemTypes: ["chinos"],
                    suggestedColors: ["navy"],
                    suggestedStyles: ["casual"],
                    suggestedSeasons: ["all-season"],
                },
            ];

            mocks.gapFind.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(mockGaps),
                }),
            });

            mocks.recFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null), // No existing recommendation
            });

            const newRec = {
                productName: "Essential navy chinos",
                category: "bottoms",
                status: "suggested",
            };

            mocks.recCreate.mockResolvedValue({
                toObject: () => newRec,
            });

            const results = await generateGapShoppingList(TEST_USER_ID);
            expect(results.length).toBe(1);
            expect(results[0].productName).toBe("Essential navy chinos");
            expect(mocks.recCreate).toHaveBeenCalled();
        });
    });

    describe("deleteRecommendation", () => {
        it("should delete recommendation for user", async () => {
            mocks.recFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(TEST_REC_ID) }),
            });

            const result = await deleteRecommendation(TEST_USER_ID, TEST_REC_ID);
            expect(result.success).toBe(true);
        });

        it("should throw 404 if recommendation not found", async () => {
            mocks.recFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(deleteRecommendation(TEST_USER_ID, TEST_REC_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Recommendation not found.",
            });
        });
    });
});
