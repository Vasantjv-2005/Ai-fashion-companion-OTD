import express, { type NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    class ProfileServiceError extends Error {
        constructor(
            message: string,
            public readonly statusCode: number,
        ) {
            super(message);
            this.name = "ProfileServiceError";
        }
    }

    return {
        getProfile: vi.fn(),
        createProfile: vi.fn(),
        updateProfile: vi.fn(),
        ProfileServiceError,
    };
});

vi.mock("../../src/modules/profile/profile.service", () => ({
    getProfile: mocks.getProfile,
    createProfile: mocks.createProfile,
    updateProfile: mocks.updateProfile,
    ProfileServiceError: mocks.ProfileServiceError,
}));

import profileRoutes from "../../src/modules/profile/profile.routes";

const JWT_SECRET = "test-secret-with-more-than-32-characters";
const USER_ID = "507f1f77bcf86cd799439011";

const testProfile = {
    _id: "507f1f77bcf86cd799439013",
    userId: USER_ID,
    displayName: "Vasant",
    bio: "Fashion enthusiast",
    preferredStyles: ["casual", "streetwear"],
    preferredColors: ["black", "blue"],
    preferredSeasons: ["summer", "winter"],
    preferredCategories: ["tops", "trousers"],
    fashionGoals: ["Build a stylish wardrobe"],
    isProfileComplete: false,
};

const validProfileInput = {
    displayName: "Vasant",
    bio: "Fashion enthusiast",
    preferredStyles: ["casual", "streetwear"],
    preferredColors: ["black", "blue"],
    preferredSeasons: ["summer", "winter"],
};

function createAccessToken(): string {
    return jwt.sign(
        {
            sub: USER_ID,
            email: "test@example.com",
            type: "access",
        },
        JWT_SECRET,
        {
            algorithm: "HS256",
            expiresIn: "15m",
        },
    );
}

const app = express();

app.use(express.json());
app.use("/api/profile", profileRoutes);

// Test-only error handler for unexpected errors.
app.use(
    (
        error: unknown,
        _req: Request,
        res: Response,
        _next: NextFunction,
    ) => {
        const message =
            error instanceof Error ? error.message : "Internal server error";

        res.status(500).json({
            success: false,
            message,
        });
    },
);

describe("Profile Routes Integration Tests", () => {
    let accessToken: string;

    beforeEach(() => {
        vi.resetAllMocks();

        process.env.JWT_ACCESS_SECRET = JWT_SECRET;
        accessToken = createAccessToken();

        mocks.getProfile.mockResolvedValue(testProfile);

        mocks.createProfile.mockResolvedValue({
            ...testProfile,
            ...validProfileInput,
        });

        mocks.updateProfile.mockResolvedValue({
            ...testProfile,
            displayName: "Updated Vasant",
        });
    });

    describe("Authentication", () => {
        it("returns 401 when no access token is provided", async () => {
            const response = await request(app).get("/api/profile");

            expect(response.status).toBe(401);
            expect(mocks.getProfile).not.toHaveBeenCalled();
        });

        it("returns 401 when an invalid access token is provided", async () => {
            const response = await request(app)
                .get("/api/profile")
                .set("Authorization", "Bearer invalid-token");

            expect(response.status).toBe(401);
            expect(mocks.getProfile).not.toHaveBeenCalled();
        });
    });

    describe("GET /api/profile", () => {
        it("returns the current user's profile", async () => {
            const response = await request(app)
                .get("/api/profile")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.displayName).toBe("Vasant");

            expect(mocks.getProfile).toHaveBeenCalledWith(USER_ID);
        });

        it("returns 404 when the profile does not exist", async () => {
            mocks.getProfile.mockRejectedValueOnce(
                new mocks.ProfileServiceError("Profile not found.", 404),
            );

            const response = await request(app)
                .get("/api/profile")
                .set("Authorization", `Bearer ${accessToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Profile not found.");
        });
    });

    describe("POST /api/profile", () => {
        it("creates a profile successfully", async () => {
            const response = await request(app)
                .post("/api/profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(validProfileInput);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);

            expect(mocks.createProfile).toHaveBeenCalledWith(
                USER_ID,
                validProfileInput,
            );
        });

        it("returns 400 when the request body is invalid", async () => {
            const response = await request(app)
                .post("/api/profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({
                    displayName: "A",
                    unknownField: "invalid",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(mocks.createProfile).not.toHaveBeenCalled();
        });

        it("returns 409 when a profile already exists", async () => {
            mocks.createProfile.mockRejectedValueOnce(
                new mocks.ProfileServiceError(
                    "A profile already exists for this user.",
                    409,
                ),
            );

            const response = await request(app)
                .post("/api/profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(validProfileInput);

            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(
                "A profile already exists for this user.",
            );
        });
    });

    describe("PATCH /api/profile", () => {
        it("updates the current user's profile", async () => {
            const updateInput = {
                displayName: "Updated Vasant",
            };

            const response = await request(app)
                .patch("/api/profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send(updateInput);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.displayName).toBe("Updated Vasant");

            expect(mocks.updateProfile).toHaveBeenCalledWith(
                USER_ID,
                updateInput,
            );
        });

        it("returns 400 when the update body is empty", async () => {
            const response = await request(app)
                .patch("/api/profile")
                .set("Authorization", `Bearer ${accessToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(mocks.updateProfile).not.toHaveBeenCalled();
        });
    });
});