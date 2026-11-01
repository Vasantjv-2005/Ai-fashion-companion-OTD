import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    tryOnCreate: vi.fn(),
    tryOnFindOne: vi.fn(),
    tryOnFind: vi.fn(),
    tryOnCountDocuments: vi.fn(),
    wardrobeFind: vi.fn(),
    avatarFindOne: vi.fn(),
    saveImage: vi.fn(),
    validateImageFile: vi.fn(),
}));

vi.mock("../../src/models/VirtualTryOn", () => ({
    default: {
        create: mocks.tryOnCreate,
        findOne: mocks.tryOnFindOne,
        find: mocks.tryOnFind,
        countDocuments: mocks.tryOnCountDocuments,
    },
}));

vi.mock("../../src/models/WardrobeItem", () => ({
    default: {
        find: mocks.wardrobeFind,
    },
}));

vi.mock("../../src/models/Avatar", () => ({
    default: {
        findOne: mocks.avatarFindOne,
    },
}));

vi.mock("../../src/integrations/storage/gridfs.service", () => ({
    saveImage: mocks.saveImage,
}));

vi.mock("../../src/utils/file-validation", () => ({
    validateImageFile: mocks.validateImageFile,
}));

import {
    createTryOnSession,
    getTryOnSession,
    getUserTryOns,
    VirtualTryOnServiceError,
} from "../../src/modules/virtual-try-on/virtual-try-on.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_ITEM_ID = "507f1f77bcf86cd799439012";
const TEST_TRYON_ID = "507f1f77bcf86cd799439013";

describe("Virtual Try-On service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
        delete process.env.AI_SERVICE_URL;
    });

    describe("createTryOnSession", () => {
        it("should return explicit unavailable status when AI service is not configured", async () => {
            mocks.wardrobeFind.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(TEST_ITEM_ID) }]),
                    }),
                }),
            });

            const createdSession = {
                _id: new mongoose.Types.ObjectId(TEST_TRYON_ID),
                status: "failed",
                errorMessage: "Virtual try-on AI service is currently unconfigured or offline.",
            };

            mocks.tryOnCreate.mockResolvedValue({
                toObject: () => createdSession,
            });

            const result = await createTryOnSession(TEST_USER_ID, {
                wardrobeItemIds: [TEST_ITEM_ID],
                tryOnType: "full_outfit",
                userImageUrl: "https://example.com/user.jpg",
            });

            expect(result.status).toBe("failed");
            expect(result.errorMessage).toContain("unconfigured or offline");
            expect(mocks.tryOnCreate).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: "failed",
                    errorMessage: expect.stringContaining("unconfigured or offline"),
                }),
            );
        });

        it("should set status to processing when AI_SERVICE_URL is configured", async () => {
            process.env.AI_SERVICE_URL = "https://ai.internal.service";

            mocks.wardrobeFind.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue([{ _id: new mongoose.Types.ObjectId(TEST_ITEM_ID) }]),
                    }),
                }),
            });

            const createdSession = {
                _id: new mongoose.Types.ObjectId(TEST_TRYON_ID),
                status: "processing",
                aiProvider: "external-tryon-ai",
            };

            mocks.tryOnCreate.mockResolvedValue({
                toObject: () => createdSession,
            });

            const result = await createTryOnSession(TEST_USER_ID, {
                wardrobeItemIds: [TEST_ITEM_ID],
                tryOnType: "full_outfit",
                userImageUrl: "https://example.com/user.jpg",
            });

            expect(result.status).toBe("processing");
        });

        it("should throw 400 when clothing items are not found in user wardrobe", async () => {
            mocks.wardrobeFind.mockReturnValue({
                select: vi.fn().mockReturnValue({
                    lean: vi.fn().mockReturnValue({
                        exec: vi.fn().mockResolvedValue([]), // Missing item
                    }),
                }),
            });

            await expect(
                createTryOnSession(TEST_USER_ID, {
                    wardrobeItemIds: [TEST_ITEM_ID],
                    tryOnType: "full_outfit",
                    userImageUrl: "https://example.com/user.jpg",
                }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "One or more clothing items were not found in your wardrobe.",
            });
        });

        it("should throw 400 when no user image or avatar is available", async () => {
            mocks.avatarFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(
                createTryOnSession(TEST_USER_ID, {
                    wardrobeItemIds: [TEST_ITEM_ID],
                    tryOnType: "full_outfit",
                }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: expect.stringContaining("User image is required"),
            });
        });
    });

    describe("getTryOnSession", () => {
        it("should return session for user", async () => {
            const mockSession = {
                _id: new mongoose.Types.ObjectId(TEST_TRYON_ID),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                status: "completed",
            };

            mocks.tryOnFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(mockSession),
                }),
            });

            const result = await getTryOnSession(TEST_USER_ID, TEST_TRYON_ID);
            expect(result).toEqual(mockSession);
        });

        it("should throw 404 when session not found", async () => {
            mocks.tryOnFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(getTryOnSession(TEST_USER_ID, TEST_TRYON_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Virtual try-on session not found.",
            });
        });
    });
});
