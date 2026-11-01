import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    outfitFindOne: vi.fn(),
    shareCreate: vi.fn(),
    shareFind: vi.fn(),
    shareFindByIdAndUpdate: vi.fn(),
    shareFindOneAndUpdate: vi.fn(),
    shareFindOne: vi.fn(),
    shareCountDocuments: vi.fn(),
    likeFindOneAndDelete: vi.fn(),
    likeCreate: vi.fn(),
    likeAggregate: vi.fn(),
    likeCountDocuments: vi.fn(),
    likeExists: vi.fn(),
    likeFind: vi.fn(),
    commentCreate: vi.fn(),
    commentFind: vi.fn(),
    commentCountDocuments: vi.fn(),
    commentAggregate: vi.fn(),
}));

vi.mock("../../src/models/Outfit", () => ({
    default: {
        findOne: mocks.outfitFindOne,
    },
}));

vi.mock("../../src/models/OutfitShare", () => ({
    default: {
        create: mocks.shareCreate,
        find: mocks.shareFind,
        findByIdAndUpdate: mocks.shareFindByIdAndUpdate,
        findOneAndUpdate: mocks.shareFindOneAndUpdate,
        findOne: mocks.shareFindOne,
        countDocuments: mocks.shareCountDocuments,
    },
}));

vi.mock("../../src/models/SocialLike", () => ({
    default: {
        findOneAndDelete: mocks.likeFindOneAndDelete,
        create: mocks.likeCreate,
        aggregate: mocks.likeAggregate,
        countDocuments: mocks.likeCountDocuments,
        exists: mocks.likeExists,
        find: mocks.likeFind,
    },
}));

vi.mock("../../src/models/SocialComment", () => ({
    default: {
        create: mocks.commentCreate,
        find: mocks.commentFind,
        countDocuments: mocks.commentCountDocuments,
        aggregate: mocks.commentAggregate,
    },
}));

import {
    shareOutfit,
    toggleLikePost,
    addCommentToPost,
    deleteShare,
    SocialServiceError,
} from "../../src/modules/social/social.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_OUTFIT_ID = "507f1f77bcf86cd799439012";
const TEST_POST_ID = "507f1f77bcf86cd799439013";

describe("Social service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("shareOutfit", () => {
        it("should verify ownership and create a share", async () => {
            mocks.outfitFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue({
                    _id: new mongoose.Types.ObjectId(TEST_OUTFIT_ID),
                    userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                    name: "Summer Look",
                    description: "Beach vibes",
                }),
            });

            const createdShare = {
                _id: new mongoose.Types.ObjectId(TEST_POST_ID),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                outfitId: new mongoose.Types.ObjectId(TEST_OUTFIT_ID),
                title: "Summer Look",
                visibility: "public",
            };

            mocks.shareCreate.mockResolvedValue({
                toObject: () => createdShare,
            });

            const result = await shareOutfit(TEST_USER_ID, {
                outfitId: TEST_OUTFIT_ID,
                title: "Summer Look",
                description: "Beach vibes",
                visibility: "public" as const,
                expiresAt: undefined,
            });

            expect(result).toEqual(createdShare);
            expect(mocks.shareCreate).toHaveBeenCalled();
        });

        it("should throw 404 when outfit does not exist or belong to user", async () => {
            mocks.outfitFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(
                shareOutfit(TEST_USER_ID, {
                    outfitId: TEST_OUTFIT_ID,
                    title: "Summer Look",
                    description: "Beach vibes",
                    visibility: "public" as const,
                    expiresAt: undefined,
                }),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Outfit not found or access denied.",
            });
        });
    });

    describe("toggleLikePost", () => {
        it("should unlike when already liked", async () => {
            mocks.likeFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId() }),
            });

            const result = await toggleLikePost(TEST_USER_ID, TEST_POST_ID);
            expect(result.liked).toBe(false);
            expect(mocks.likeCreate).not.toHaveBeenCalled();
        });

        it("should like when not yet liked", async () => {
            mocks.likeFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            mocks.likeCreate.mockResolvedValue({});

            const result = await toggleLikePost(TEST_USER_ID, TEST_POST_ID);
            expect(result.liked).toBe(true);
            expect(mocks.likeCreate).toHaveBeenCalled();
        });
    });

    describe("addCommentToPost", () => {
        it("should create comment for active post", async () => {
            mocks.shareFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(TEST_POST_ID) }),
            });

            const mockComment = {
                _id: new mongoose.Types.ObjectId(),
                content: "Looks great!",
            };

            mocks.commentCreate.mockResolvedValue({
                toObject: () => mockComment,
            });

            const result = await addCommentToPost(TEST_USER_ID, TEST_POST_ID, {
                content: "Looks great!",
            });

            expect(result).toEqual(mockComment);
            expect(mocks.commentCreate).toHaveBeenCalled();
        });

        it("should throw 404 if post does not exist", async () => {
            mocks.shareFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(
                addCommentToPost(TEST_USER_ID, TEST_POST_ID, { content: "Nice" }),
            ).rejects.toMatchObject({
                statusCode: 404,
                message: "Post not found.",
            });
        });
    });

    describe("deleteShare", () => {
        it("should soft delete share owned by user", async () => {
            mocks.shareFindOneAndUpdate.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(TEST_POST_ID) }),
            });

            const result = await deleteShare(TEST_USER_ID, TEST_POST_ID);
            expect(result.success).toBe(true);
        });

        it("should throw 404 if share not found or not owned by user", async () => {
            mocks.shareFindOneAndUpdate.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(deleteShare(TEST_USER_ID, TEST_POST_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Share not found or access denied.",
            });
        });
    });
});
