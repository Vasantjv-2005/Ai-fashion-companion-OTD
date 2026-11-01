import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

// Define mocks before importing the service.
const mocks = vi.hoisted(() => ({
    outfitSave: vi.fn(),
    outfitToObject: vi.fn(),

    outfitFind: vi.fn(),
    outfitFindOne: vi.fn(),
    outfitFindOneAndUpdate: vi.fn(),
    outfitFindOneAndDelete: vi.fn(),
    outfitCountDocuments: vi.fn(),

    wardrobeFind: vi.fn(),
}));

// Mock the Outfit model.
vi.mock("../../src/models/Outfit", () => {
    class MockOutfit {
        [key: string]: unknown;

        constructor(data: Record<string, unknown>) {
            Object.assign(this, data);
        }

        save = mocks.outfitSave;
        toObject = mocks.outfitToObject;
    }

    return {
        default: Object.assign(MockOutfit, {
            find: mocks.outfitFind,
            findOne: mocks.outfitFindOne,
            findOneAndUpdate: mocks.outfitFindOneAndUpdate,
            findOneAndDelete: mocks.outfitFindOneAndDelete,
            countDocuments: mocks.outfitCountDocuments,
        }),
    };
});

// Mock the WardrobeItem model.
vi.mock("../../src/models/WardrobeItem", () => ({
    default: {
        find: mocks.wardrobeFind,
    },
}));

import {
    createOutfit,
    getOutfits,
    getOutfitById,
    updateOutfit,
    deleteOutfit,
} from "../../src/modules/outfits/outfits.service";

const userId = "507f1f77bcf86cd799439011";
const outfitId = "507f1f77bcf86cd799439012";
const clothingItemId = "507f1f77bcf86cd799439013";

const validInput = {
    name: "Summer Casual",
    description: "A casual summer outfit",
    clothingItemIds: [clothingItemId],
    occasion: "casual" as const,
    style: "casual",
    season: "summer" as const,
    colorPalette: ["blue", "white"],
};

function createQueryChain<T>(result: T) {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {};

    const returnChain = () => chain;

    chain.select = vi.fn(returnChain);
    chain.sort = vi.fn(returnChain);
    chain.skip = vi.fn(returnChain);
    chain.limit = vi.fn(returnChain);
    chain.lean = vi.fn(returnChain);
    chain.exec = vi.fn().mockResolvedValue(result);

    return chain;
}

function objectId(id: string) {
    return new mongoose.Types.ObjectId(id);
}

describe("Outfits Service", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mocks.outfitSave.mockResolvedValue(undefined);
        mocks.outfitToObject.mockReturnValue({
            _id: outfitId,
            userId,
            ...validInput,
        });

        mocks.outfitFind.mockReturnValue(createQueryChain([]));
        mocks.outfitFindOne.mockReturnValue(createQueryChain(null));
        mocks.outfitFindOneAndUpdate.mockReturnValue(
            createQueryChain(null),
        );
        mocks.outfitFindOneAndDelete.mockReturnValue(
            createQueryChain(null),
        );
        mocks.outfitCountDocuments.mockReturnValue({
            exec: vi.fn().mockResolvedValue(0),
        });

        mocks.wardrobeFind.mockReturnValue(
            createQueryChain([{ _id: objectId(clothingItemId) }]),
        );
    });

    describe("createOutfit", () => {
        it("should create an outfit successfully", async () => {
            const result = await createOutfit(userId, validInput);

            expect(result).toMatchObject({
                _id: outfitId,
                userId,
            });

            expect(mocks.wardrobeFind).toHaveBeenCalled();
            expect(mocks.outfitSave).toHaveBeenCalledOnce();
        });

        it("should reject an invalid user ID", async () => {
            await expect(
                createOutfit("invalid-id", validInput),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid ID.",
            });
        });

        it("should reject an invalid clothing item ID", async () => {
            await expect(
                createOutfit(userId, {
                    ...validInput,
                    clothingItemIds: ["invalid-id"],
                }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid ID.",
            });
        });

        it("should reject duplicate clothing item IDs", async () => {
            await expect(
                createOutfit(userId, {
                    ...validInput,
                    clothingItemIds: [
                        clothingItemId,
                        clothingItemId,
                    ],
                }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Duplicate clothing item IDs are not allowed.",
            });
        });

        it("should reject clothing items not owned by the user", async () => {
            mocks.wardrobeFind.mockReturnValue(
                createQueryChain([]),
            );

            await expect(
                createOutfit(userId, validInput),
            ).rejects.toMatchObject({
                statusCode: 400,
                message:
                    "One or more clothing items were not found in your wardrobe.",
            });
        });
    });

    describe("getOutfits", () => {
        it("should return outfits with pagination", async () => {
            const outfits = [{ _id: outfitId, name: "Summer Casual" }];

            mocks.outfitFind.mockReturnValue(
                createQueryChain(outfits),
            );
            mocks.outfitCountDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(25),
            });

            const result = await getOutfits(userId, {
                page: 2,
                limit: 10,
            });

            expect(result.outfits).toEqual(outfits);
            expect(result.pagination).toEqual({
                page: 2,
                limit: 10,
                total: 25,
                totalPages: 3,
            });

            expect(mocks.outfitFind).toHaveBeenCalledWith({
                userId: objectId(userId),
            });
        });

        it("should apply occasion and status filters", async () => {
            await getOutfits(userId, {
                occasion: "casual",
                status: "saved",
            });

            expect(mocks.outfitFind).toHaveBeenCalledWith({
                userId: objectId(userId),
                occasion: "casual",
                status: "saved",
            });
        });

        it("should use default pagination values", async () => {
            const result = await getOutfits(userId);

            expect(result.pagination).toEqual({
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            });

            expect(mocks.outfitFind).toHaveBeenCalledWith({
                userId: objectId(userId),
            });
        });

        it("should reject an invalid user ID", async () => {
            await expect(
                getOutfits("invalid-id"),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid ID.",
            });
        });
    });

    describe("getOutfitById", () => {
        it("should return an outfit belonging to the user", async () => {
            const outfit = {
                _id: outfitId,
                userId: objectId(userId),
                name: "Summer Casual",
            };

            mocks.outfitFindOne.mockReturnValue(
                createQueryChain(outfit),
            );

            const result = await getOutfitById(userId, outfitId);

            expect(result).toEqual(outfit);
            expect(mocks.outfitFindOne).toHaveBeenCalledWith({
                _id: objectId(outfitId),
                userId: objectId(userId),
            });
        });

        it("should return 404 when the outfit does not exist", async () => {
            mocks.outfitFindOne.mockReturnValue(
                createQueryChain(null),
            );

            await expect(
                getOutfitById(userId, outfitId),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Outfit not found.",
            });
        });

        it("should reject an invalid outfit ID", async () => {
            await expect(
                getOutfitById(userId, "invalid-id"),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid ID.",
            });
        });
    });

    describe("updateOutfit", () => {
        it("should update an existing outfit", async () => {
            const updatedOutfit = {
                _id: outfitId,
                userId: objectId(userId),
                name: "Updated Outfit",
            };

            mocks.outfitFindOne.mockReturnValue(
                createQueryChain({ _id: objectId(outfitId) }),
            );

            mocks.outfitFindOneAndUpdate.mockReturnValue(
                createQueryChain(updatedOutfit),
            );

            const result = await updateOutfit(userId, outfitId, {
                name: "Updated Outfit",
            });

            expect(result).toEqual(updatedOutfit);
            expect(mocks.outfitFindOneAndUpdate).toHaveBeenCalledWith(
                {
                    _id: objectId(outfitId),
                    userId: objectId(userId),
                },
                {
                    $set: { name: "Updated Outfit" },
                },
                {
                    new: true,
                    runValidators: true,
                },
            );
        });

        it("should verify wardrobe ownership when updating clothing items", async () => {
            mocks.outfitFindOne.mockReturnValue(
                createQueryChain({ _id: objectId(outfitId) }),
            );

            const updatedOutfit = {
                _id: outfitId,
                clothingItemIds: [objectId(clothingItemId)],
            };

            mocks.outfitFindOneAndUpdate.mockReturnValue(
                createQueryChain(updatedOutfit),
            );

            const result = await updateOutfit(userId, outfitId, {
                clothingItemIds: [clothingItemId],
            });

            expect(result).toEqual(updatedOutfit);
            expect(mocks.wardrobeFind).toHaveBeenCalled();
        });

        it("should reject updates to a nonexistent outfit", async () => {
            mocks.outfitFindOne.mockReturnValue(
                createQueryChain(null),
            );

            await expect(
                updateOutfit(userId, outfitId, {
                    name: "Updated Outfit",
                }),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Outfit not found.",
            });
        });
    });

    describe("deleteOutfit", () => {
        it("should delete an existing outfit", async () => {
            mocks.outfitFindOneAndDelete.mockReturnValue(
                createQueryChain({ _id: outfitId }),
            );

            const result = await deleteOutfit(userId, outfitId);

            expect(result).toEqual({
                message: "Outfit deleted successfully.",
                outfitId,
            });

            expect(
                mocks.outfitFindOneAndDelete,
            ).toHaveBeenCalledWith({
                _id: objectId(outfitId),
                userId: objectId(userId),
            });
        });

        it("should return 404 when the outfit cannot be deleted", async () => {
            mocks.outfitFindOneAndDelete.mockReturnValue(
                createQueryChain(null),
            );

            await expect(
                deleteOutfit(userId, outfitId),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Outfit not found.",
            });
        });

        it("should reject an invalid outfit ID", async () => {
            await expect(
                deleteOutfit(userId, "invalid-id"),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid ID.",
            });
        });
    });
});