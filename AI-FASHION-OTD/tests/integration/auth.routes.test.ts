
import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    registerUser: vi.fn(),
    loginUser: vi.fn(),
    refreshSession: vi.fn(),
    logoutUser: vi.fn(),
}));

vi.mock("../../src/modules/auth/auth.service", () => ({
    registerUser: mocks.registerUser,
    loginUser: mocks.loginUser,
    refreshSession: mocks.refreshSession,
    logoutUser: mocks.logoutUser,
    AuthServiceError: class AuthServiceError extends Error {
        constructor(
            message: string,
            public readonly statusCode: number
        ) {
            super(message);
            this.name = "AuthServiceError";
        }
    },
}));

import authRoutes from "../../src/modules/auth/auth.routes";
import { AuthServiceError } from "../../src/modules/auth/auth.service";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

const testUser = {
    id: "507f1f77bcf86cd799439011",
    name: "Test User",
    email: "test@example.com",
};

const testAuthResult = {
    user: testUser,
    tokens: {
        accessToken: "test-access-token",
        refreshToken: "test-refresh-token",
    },
};

const validRegistration = {
    name: "Test User",
    email: "test@example.com",
    password: "StrongPassword123",
};

const validLogin = {
    email: "test@example.com",
    password: "StrongPassword123",
};

describe("Authentication routes integration tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        mocks.registerUser.mockResolvedValue(testAuthResult);
        mocks.loginUser.mockResolvedValue(testAuthResult);
        mocks.refreshSession.mockResolvedValue(testAuthResult);
        mocks.logoutUser.mockResolvedValue(undefined);
    });

    describe("POST /api/auth/register", () => {
        it("registers a user successfully", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send(validRegistration);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(mocks.registerUser).toHaveBeenCalledWith(
                expect.objectContaining(validRegistration)
            );
        });

        it("rejects invalid registration data", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    name: "",
                    email: "not-an-email",
                    password: "123",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(mocks.registerUser).not.toHaveBeenCalled();
        });
    });

    describe("POST /api/auth/login", () => {
        it("logs in a user successfully", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send(validLogin);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mocks.loginUser).toHaveBeenCalledWith(
                expect.objectContaining(validLogin)
            );
        });

        it("rejects invalid login input", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "invalid-email",
                    password: "",
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(mocks.loginUser).not.toHaveBeenCalled();
        });

        it("returns an error when credentials are incorrect", async () => {
            mocks.loginUser.mockRejectedValue(
                new AuthServiceError("Invalid email or password.", 401)
            );

            const response = await request(app)
                .post("/api/auth/login")
                .send(validLogin);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/auth/refresh", () => {
        it("refreshes a session using a refresh token", async () => {
            const response = await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken: "test-refresh-token" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mocks.refreshSession).toHaveBeenCalledWith(
                "test-refresh-token"
            );
        });

        it("rejects a missing refresh token", async () => {
            const response = await request(app)
                .post("/api/auth/refresh")
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(mocks.refreshSession).not.toHaveBeenCalled();
        });
    });

    describe("POST /api/auth/logout", () => {
        it("logs out a user with a refresh token", async () => {
            const response = await request(app)
                .post("/api/auth/logout")
                .send({ refreshToken: "test-refresh-token" });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(mocks.logoutUser).toHaveBeenCalledWith(
                "test-refresh-token"
            );
        });
    });

    describe("Unknown authentication routes", () => {
        it("returns 404 for an unknown route", async () => {
            const response = await request(app).get("/api/auth/unknown");

            expect(response.status).toBe(404);
        });
    });
});
