import mongoose from "mongoose";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UpdateProfileInput } from "../../src/modules/profile/profile.validator";

const mocks = vi.hoisted(() => ({
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    save: vi.fn(),
    profileConstructor: vi.fn(),
}));

vi.mock("../../src/models/Profile", () => {
    class MockProfile {
        userId: unknown;
        [key: string]: unknown;

        constructor(data: Record<string, unknown>) {
            mocks.profileConstructor(data);
            Object.assign(this, data);
        }

        save = mocks.save;

        toObject() {
            return {
                _id: "507f1f77bcf86cd799439013",
                ...this,
            };
        }

        static findOne = mocks.findOne;
        static findOneAndUpdate = mocks.findOneAndUpdate;
    }

    return {
        default: MockProfile,
        Profile: MockProfile,
    };
});

import {
    createProfile,
    getProfile,
    updateProfile,
    ProfileServiceError,
} from "../../src/modules/profile/profile.service";

const USER_ID = "507f1f77bcf86cd799439011";

const validProfileInput: UpdateProfileInput = {
    displayName: "Vasant",
    bio: "Fashion enthusiast",
    preferredStyles: ["casual", "streetwear"],
    preferredColors: ["black", "blue"],
    preferredSeasons: ["summer", "winter"],
};

const mockProfile = {
    _id: new mongoose.Types.ObjectId("507f1f77bcf86cd799439013"),
    userId: new mongoose.Types.ObjectId(USER_ID),
    ...validProfileInput,
    preferredCategories: ["tops", "trousers"],
    fashionGoals: ["Build a stylish wardrobe"],
    isProfileComplete: false,
};

describe("Profile Service Unit Tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("getProfile", () => {
        it("returns the profile when it exists", async () => {
            mocks.findOne.mockReturnValue({
                lean: () => ({
                    exec: vi.fn().mockResolvedValue(mockProfile),
                }),
            });

            const result = await getProfile(USER_ID);

            expect(result).toEqual(mockProfile);

            expect(mocks.findOne).toHaveBeenCalledWith({
                userId: new mongoose.Types.ObjectId(USER_ID),
            });
        });

        it("throws 404 when the profile does not exist", async () => {
            mocks.findOne.mockReturnValue({
                lean: () => ({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(getProfile(USER_ID)).rejects.toMatchObject({
                name: "ProfileServiceError",
                message: "Profile not found.",
                statusCode: 404,
            });
        });

        it("throws 400 when the user ID is invalid", async () => {
            await expect(
                getProfile("invalid-id"),
            ).rejects.toBeInstanceOf(ProfileServiceError);

            await expect(
                getProfile("invalid-id"),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid user ID.",
            });

            expect(mocks.findOne).not.toHaveBeenCalled();
        });
    });

    describe("createProfile", () => {
        it("creates and returns a profile", async () => {
            mocks.findOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            mocks.save.mockResolvedValue(undefined);

            const result = await createProfile(
                USER_ID,
                validProfileInput,
            );

            expect(result).toHaveProperty("displayName", "Vasant");

            expect(mocks.profileConstructor).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: expect.any(mongoose.Types.ObjectId),
                    ...validProfileInput,
                }),
            );

            expect(mocks.save).toHaveBeenCalledOnce();
        });

        it("throws 409 when a profile already exists", async () => {
            mocks.findOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue(mockProfile),
            });

            await expect(
                createProfile(USER_ID, validProfileInput),
            ).rejects.toMatchObject({
                name: "ProfileServiceError",
                message: "A profile already exists for this user.",
                statusCode: 409,
            });

            expect(mocks.save).not.toHaveBeenCalled();
        });

        it("throws 400 when the user ID is invalid", async () => {
            await expect(
                createProfile("invalid-id", validProfileInput),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid user ID.",
            });

            expect(mocks.findOne).not.toHaveBeenCalled();
        });
    });

    describe("updateProfile", () => {
        it("updates and returns the profile", async () => {
            const updatedProfile = {
                ...mockProfile,
                displayName: "Updated Vasant",
            };

            mocks.findOneAndUpdate.mockReturnValue({
                lean: () => ({
                    exec: vi.fn().mockResolvedValue(updatedProfile),
                }),
            });

            const result = await updateProfile(USER_ID, {
                displayName: "Updated Vasant",
            });

            expect(result).toEqual(updatedProfile);

            expect(mocks.findOneAndUpdate).toHaveBeenCalledWith(
                {
                    userId: new mongoose.Types.ObjectId(USER_ID),
                },
                {
                    $set: {
                        displayName: "Updated Vasant",
                    },
                },
                {
                    new: true,
                    runValidators: true,
                },
            );
        });

        it("throws 404 when the profile to update does not exist", async () => {
            mocks.findOneAndUpdate.mockReturnValue({
                lean: () => ({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            await expect(
                updateProfile(USER_ID, {
                    displayName: "Updated Vasant",
                }),
            ).rejects.toMatchObject({
                name: "ProfileServiceError",
                message: "Profile not found.",
                statusCode: 404,
            });
        });

        it("throws 400 when the user ID is invalid", async () => {
            await expect(
                updateProfile("invalid-id", {
                    displayName: "Updated Vasant",
                }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: "Invalid user ID.",
            });

            expect(mocks.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });
});
