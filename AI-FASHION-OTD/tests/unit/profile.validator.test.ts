import { describe, it, expect } from "vitest";
import { validateUpdateProfile } from "../../src/modules/profile/profile.validator";

describe("Profile Validator", () => {
    describe("Valid profile data", () => {
        it("should accept valid profile data", () => {
            const result = validateUpdateProfile({
                displayName: "Vasant",
                bio: "Fashion enthusiast",
                preferredStyles: ["casual", "streetwear"],
                preferredColors: ["black", "blue"],
                preferredSeasons: ["summer", "winter"],
                preferredCategories: ["shirts", "trousers"],
                bodyType: "athletic",
                heightCm: 175,
                fashionGoals: ["improve my style"],
            });

            expect(result.success).toBe(true);
        });

        it("should accept a partial profile update", () => {
            const result = validateUpdateProfile({
                displayName: "Vasant J",
            });

            expect(result.success).toBe(true);
        });

        it("should accept an empty bio", () => {
            const result = validateUpdateProfile({
                bio: "",
            });

            expect(result.success).toBe(true);
        });

        it("should accept valid avatarFileId", () => {
            const result = validateUpdateProfile({
                avatarFileId: "507f1f77bcf86cd799439011",
            });

            expect(result.success).toBe(true);
        });
    });

    describe("Invalid profile data", () => {
        it("should reject a display name shorter than 2 characters", () => {
            const result = validateUpdateProfile({
                displayName: "V",
            });

            expect(result.success).toBe(false);
        });

        it("should reject a display name exceeding 100 characters", () => {
            const result = validateUpdateProfile({
                displayName: "V".repeat(101),
            });

            expect(result.success).toBe(false);
        });

        it("should reject a bio exceeding 500 characters", () => {
            const result = validateUpdateProfile({
                bio: "A".repeat(501),
            });

            expect(result.success).toBe(false);
        });

        it("should reject an unsupported preferred style", () => {
            const result = validateUpdateProfile({
                preferredStyles: ["unrecognized-style"],
            });

            expect(result.success).toBe(false);
        });

        it("should reject an unsupported preferred season", () => {
            const result = validateUpdateProfile({
                preferredSeasons: ["monsoon"],
            });

            expect(result.success).toBe(false);
        });

        it("should reject an invalid avatarFileId", () => {
            const result = validateUpdateProfile({
                avatarFileId: "invalid-id",
            });

            expect(result.success).toBe(false);
        });

        it("should reject a height below 50 cm", () => {
            const result = validateUpdateProfile({
                heightCm: 40,
            });

            expect(result.success).toBe(false);
        });

        it("should reject a height above 300 cm", () => {
            const result = validateUpdateProfile({
                heightCm: 310,
            });

            expect(result.success).toBe(false);
        });

        it("should reject an empty update object", () => {
            const result = validateUpdateProfile({});

            expect(result.success).toBe(false);
        });

        it("should reject unknown fields", () => {
            const result = validateUpdateProfile({
                displayName: "Vasant",
                unknownField: "not allowed",
            });

            expect(result.success).toBe(false);
        });
    });
});
