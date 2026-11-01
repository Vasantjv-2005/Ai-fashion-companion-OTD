import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    avatarFindOne: vi.fn(),
    avatarFindOneAndUpdate: vi.fn(),
    avatarFindOneAndDelete: vi.fn(),
    profileUpdateOne: vi.fn(),
    saveImage: vi.fn(),
    removeImage: vi.fn(),
    validateImageFile: vi.fn(),
}));

vi.mock("../../src/models/Avatar", () => ({
    default: {
        findOne: mocks.avatarFindOne,
        findOneAndUpdate: mocks.avatarFindOneAndUpdate,
        findOneAndDelete: mocks.avatarFindOneAndDelete,
    },
}));

vi.mock("../../src/models/Profile", () => ({
    default: {
        updateOne: mocks.profileUpdateOne,
    },
}));

vi.mock("../../src/integrations/storage/gridfs.service", () => ({
    saveImage: mocks.saveImage,
    removeImage: mocks.removeImage,
}));

vi.mock("../../src/utils/file-validation", () => ({
    validateImageFile: mocks.validateImageFile,
}));

import {
    getAvatar,
    createOrUpdateAvatar,
    uploadAvatarImage,
    deleteAvatar,
    AvatarServiceError,
} from "../../src/modules/avatar/avatar.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const FILE_ID = "507f1f77bcf86cd799439099";

describe("Avatar service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("getAvatar", () => {
        it("should return avatar when it exists", async () => {
            const mockAvatar = {
                _id: new mongoose.Types.ObjectId(),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                skinTone: "medium",
                bodyShape: "athletic",
            };

            mocks.avatarFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(mockAvatar),
                }),
            });

            const result = await getAvatar(TEST_USER_ID);
            expect(result).toEqual(mockAvatar);
        });

        it("should throw 404 when avatar is not found", async () => {
            mocks.avatarFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(getAvatar(TEST_USER_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Avatar not found.",
            });
        });

        it("should throw 400 for invalid user ID", async () => {
            await expect(getAvatar("invalid-id")).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid user ID.",
            });
        });
    });

    describe("createOrUpdateAvatar", () => {
        it("should upsert avatar and update Profile if imageFileId is present", async () => {
            const avatarData = {
                skinTone: "olive",
                bodyShape: "hourglass",
                imageFileId: FILE_ID,
            };

            const mockSaved = {
                ...avatarData,
                imageFileId: new mongoose.Types.ObjectId(FILE_ID),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
            };

            mocks.avatarFindOneAndUpdate.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(mockSaved),
                }),
            });

            mocks.profileUpdateOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ acknowledged: true }),
            });

            const result = await createOrUpdateAvatar(TEST_USER_ID, avatarData);
            expect(result).toEqual(mockSaved);
            expect(mocks.profileUpdateOne).toHaveBeenCalled();
        });
    });

    describe("uploadAvatarImage", () => {
        it("should throw 400 when file validation fails", async () => {
            mocks.validateImageFile.mockReturnValue({
                isValid: false,
                error: "Invalid file type.",
            });

            await expect(
                uploadAvatarImage(TEST_USER_ID, undefined),
            ).rejects.toThrow(AvatarServiceError);
        });

        it("should save image to GridFS and update avatar and profile", async () => {
            const mockFile = {
                fieldname: "image",
                originalname: "test.png",
                mimetype: "image/png",
                buffer: Buffer.from("fake-image"),
                size: 1024,
            } as Express.Multer.File;

            mocks.validateImageFile.mockReturnValue({ isValid: true });
            mocks.saveImage.mockResolvedValue({ fileId: FILE_ID });

            mocks.avatarFindOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            const updatedAvatar = {
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                imageFileId: new mongoose.Types.ObjectId(FILE_ID),
                source: "upload",
                isActive: true,
            };

            mocks.avatarFindOneAndUpdate.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(updatedAvatar),
                }),
            });

            mocks.profileUpdateOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ acknowledged: true }),
            });

            const result = await uploadAvatarImage(TEST_USER_ID, mockFile);
            expect(result).toEqual(updatedAvatar);
            expect(mocks.saveImage).toHaveBeenCalled();
            expect(mocks.profileUpdateOne).toHaveBeenCalled();
        });
    });

    describe("deleteAvatar", () => {
        it("should delete avatar, clean up image, and unset profile avatarFileId", async () => {
            const existingAvatar = {
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                imageFileId: new mongoose.Types.ObjectId(FILE_ID),
            };

            mocks.avatarFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue(existingAvatar),
            });

            mocks.removeImage.mockResolvedValue(undefined);
            mocks.profileUpdateOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ acknowledged: true }),
            });

            const result = await deleteAvatar(TEST_USER_ID);
            expect(result.success).toBe(true);
            expect(mocks.removeImage).toHaveBeenCalledWith(FILE_ID);
            expect(mocks.profileUpdateOne).toHaveBeenCalled();
        });

        it("should throw 404 when avatar to delete does not exist", async () => {
            mocks.avatarFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(deleteAvatar(TEST_USER_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Avatar not found.",
            });
        });
    });
});

