import { beforeEach, describe, expect, it, vi } from "vitest";
import mongoose from "mongoose";

const mocks = vi.hoisted(() => ({
    vibeUpdateMany: vi.fn(),
    vibeCreate: vi.fn(),
    vibeFindOne: vi.fn(),
    vibeFind: vi.fn(),
    vibeFindOneAndDelete: vi.fn(),
}));

vi.mock("../../src/models/UserVibe", () => ({
    default: {
        updateMany: mocks.vibeUpdateMany,
        create: mocks.vibeCreate,
        findOne: mocks.vibeFindOne,
        find: mocks.vibeFind,
        findOneAndDelete: mocks.vibeFindOneAndDelete,
    },
}));

import {
    setUserVibe,
    getActiveVibe,
    getUserVibes,
    getPresetVibes,
    deleteVibe,
    VibeServiceError,
} from "../../src/modules/vibes/vibes.service";

const TEST_USER_ID = "507f1f77bcf86cd799439011";
const TEST_VIBE_ID = "507f1f77bcf86cd799439012";

describe("Vibes service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    describe("setUserVibe", () => {
        it("should deactivate old vibes and create a new active vibe", async () => {
            mocks.vibeUpdateMany.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
            });

            const newVibe = {
                _id: new mongoose.Types.ObjectId(TEST_VIBE_ID),
                userId: new mongoose.Types.ObjectId(TEST_USER_ID),
                mood: "minimalist",
                isActive: true,
            };

            mocks.vibeCreate.mockResolvedValue({
                toObject: () => newVibe,
            });

            const result = await setUserVibe(TEST_USER_ID, {
                mood: "minimalist",
                preferredStyles: ["minimalist"],
                preferredColors: ["black", "white"],
                preferredSeasons: ["all-season"],
            });

            expect(result.mood).toBe("minimalist");
            expect(mocks.vibeUpdateMany).toHaveBeenCalledWith(
                { userId: new mongoose.Types.ObjectId(TEST_USER_ID), isActive: true },
                { $set: { isActive: false } },
            );
            expect(mocks.vibeCreate).toHaveBeenCalled();
        });
    });

    describe("getActiveVibe", () => {
        it("should return the currently active vibe", async () => {
            const active = {
                _id: new mongoose.Types.ObjectId(TEST_VIBE_ID),
                mood: "streetwear",
                isActive: true,
            };

            mocks.vibeFindOne.mockReturnValue({
                lean: vi.fn().mockReturnValue({
                    exec: vi.fn().mockResolvedValue(active),
                }),
            });

            const result = await getActiveVibe(TEST_USER_ID);
            expect(result).toEqual(active);
        });
    });

    describe("getPresetVibes", () => {
        it("should return predefined vibe palettes", () => {
            const presets = getPresetVibes();
            expect(presets.length).toBeGreaterThan(0);
            expect(presets.some((p) => p.mood === "elegant")).toBe(true);
        });
    });

    describe("deleteVibe", () => {
        it("should remove user vibe", async () => {
            mocks.vibeFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ _id: new mongoose.Types.ObjectId(TEST_VIBE_ID) }),
            });

            const result = await deleteVibe(TEST_USER_ID, TEST_VIBE_ID);
            expect(result.success).toBe(true);
        });

        it("should throw 404 if vibe not found", async () => {
            mocks.vibeFindOneAndDelete.mockReturnValue({
                exec: vi.fn().mockResolvedValue(null),
            });

            await expect(deleteVibe(TEST_USER_ID, TEST_VIBE_ID)).rejects.toMatchObject({
                statusCode: 404,
                message: "Vibe record not found.",
            });
        });
    });
});
