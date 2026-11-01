import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    prefFindOne: vi.fn(),
    prefCreate: vi.fn(),
    prefFindOneAndUpdate: vi.fn(),
    prefFindOneAndDelete: vi.fn(),
}));

vi.mock("../../src/models/UserPreference", () => ({
    default: {
        findOne: mocks.prefFindOne,
        create: mocks.prefCreate,
        findOneAndUpdate: mocks.prefFindOneAndUpdate,
        findOneAndDelete: mocks.prefFindOneAndDelete,
    },
}));

import {
    getPreferences,
    updatePreferences,
    resetPreferences,
    PreferenceServiceError,
} from "../../src/modules/preferences/preferences.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";

describe("User preferences service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("getPreferences", () => {
        it("should return existing preferences", async () => {
            const existing = {
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                preferredStyles: ["minimalist", "casual"],
            };

            mocks.prefFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(existing),
                }),
            });

            const result = await getPreferences(TEST_USER_ID);
            expect(result).toEqual(existing);
        });

        it("should initialize default preferences if none exist", async () => {
            mocks.prefFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            const defaultPrefs = {
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                preferredStyles: ["casual"],
                preferredSeasons: ["all-season"],
            };

            mocks.prefCreate.mockResolvedValue({
                toObject: () => defaultPrefs,
            });

            const result = await getPreferences(TEST_USER_ID);
            expect(result).toEqual(defaultPrefs);
            expect(mocks.prefCreate).toHaveBeenCalled();
        });

        it("should throw 400 for invalid user ID", async () => {
            await expect(getPreferences("invalid-user")).rejects.toThrow(
                PreferenceServiceError,
            );
        });
    });

    describe("updatePreferences", () => {
        it("should update preferences and flatten nested recommendationSettings", async () => {
            const updateInput = {
                preferredStyles: ["streetwear" as const],
                recommendationSettings: {
                    useWeather: false,
                },
            };

            const updated = {
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                preferredStyles: ["streetwear"],
                recommendationSettings: {
                    useWeather: false,
                    considerOccasion: true,
                },
            };

            mocks.prefFindOneAndUpdate.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(updated),
                }),
            });

            const result = await updatePreferences(TEST_USER_ID, updateInput);
            expect(result).toEqual(updated);
            expect(mocks.prefFindOneAndUpdate).toHaveBeenCalledWith(
                expect.any(Object),
                {
                    $set: expect.objectContaining({
                        preferredStyles: ["streetwear"],
                        "recommendationSettings.useWeather": false,
                    }),
                },
                expect.any(Object),
            );
        });
    });

    describe("resetPreferences", () => {
        it("should delete existing preferences and return defaults", async () => {
            mocks.prefFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue({}),
            });

            mocks.prefFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(null),
                }),
            });

            const defaultPrefs = {
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                preferredStyles: ["casual"],
            };

            mocks.prefCreate.mockResolvedValue({
                toObject: () => defaultPrefs,
            });

            const result = await resetPreferences(TEST_USER_ID);
            expect(result).toEqual(defaultPrefs);
            expect(mocks.prefFindOneAndDelete).toHaveBeenCalled();
        });
    });
});
