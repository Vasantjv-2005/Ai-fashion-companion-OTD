import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    userFindOne: vi.fn(),
    userCreate: vi.fn(),
    refreshTokenCreate: vi.fn(),
    refreshTokenFindOne: vi.fn(),
    refreshTokenUpdateOne: vi.fn(),
    hash: vi.fn(),
    verify: vi.fn(),
    sign: vi.fn(),
    jwtVerify: vi.fn(),
    randomUUID: vi.fn(),
}));

vi.mock("argon2", () => ({
    default: {
        hash: mocks.hash,
        verify: mocks.verify,
    },
}));

vi.mock("jsonwebtoken", () => ({
    default: {
        sign: mocks.sign,
        verify: mocks.jwtVerify,
    },
}));

vi.mock("node:crypto", async (importOriginal) => {
    const actual =
        await importOriginal<typeof import("node:crypto")>();

    return {
        ...actual,
        randomBytes: vi.fn(() => ({
            toString: vi.fn(() => "a".repeat(96)),
        })),
        createHash: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            digest: vi.fn(() => "mocked-refresh-token-hash"),
        })),
        randomUUID: mocks.randomUUID,
    };
});

vi.mock("../../src/models/User", () => ({
    User: {
        findOne: mocks.userFindOne,
        create: mocks.userCreate,
    },
}));

vi.mock("../../src/models/RefreshToken", () => ({
    RefreshToken: {
        create: mocks.refreshTokenCreate,
        findOne: mocks.refreshTokenFindOne,
        updateOne: mocks.refreshTokenUpdateOne,
    },
}));

import {
    registerUser,
    loginUser,
    refreshSession,
    logoutUser,
} from "../../src/modules/auth/auth.service";

const userId = "507f1f77bcf86cd799439011";

const userDocument = {
    _id: userId,
    name: "Test User",
    email: "test@example.com",
    passwordHash: "hashed-password",
    isActive: true,
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

/**
 * Supports the two query patterns used by the auth service:
 * findOne(...).lean() and findOne(...).select("+passwordHash").
 */
function mockUserFindOne(result: unknown) {
    mocks.userFindOne.mockReturnValue({
        lean: vi.fn().mockResolvedValue(result),
        select: vi.fn().mockResolvedValue(result),
    });
}

describe("Authentication service unit tests", () => {
    beforeEach(() => {
        vi.resetAllMocks();

        process.env.JWT_ACCESS_SECRET = "a".repeat(64);
        process.env.JWT_REFRESH_SECRET = "b".repeat(64);

        mockUserFindOne(null);

        mocks.userCreate.mockResolvedValue(userDocument);
        mocks.hash.mockResolvedValue("hashed-password");
        mocks.verify.mockResolvedValue(true);

        mocks.sign.mockReturnValue("test-token");

        mocks.jwtVerify.mockReturnValue({
            sub: userId,
            type: "refresh",
            jti: "test-token-id",
        });

        mocks.randomUUID.mockReturnValue("test-token-id");

        mocks.refreshTokenCreate.mockResolvedValue({});
        mocks.refreshTokenFindOne.mockResolvedValue(null);
        mocks.refreshTokenUpdateOne.mockResolvedValue({
            modifiedCount: 1,
            matchedCount: 1,
        });
    });

    describe("registerUser", () => {
        it("registers a new user successfully", async () => {
            const result = await registerUser(validRegistration);

            expect(mocks.userFindOne).toHaveBeenCalled();
            expect(mocks.hash).toHaveBeenCalledWith(
                validRegistration.password
            );
            expect(mocks.userCreate).toHaveBeenCalled();
            expect(mocks.refreshTokenCreate).toHaveBeenCalled();

            expect(result.user.email).toBe(validRegistration.email);
            expect(result.user.name).toBe(validRegistration.name);
            expect(result.tokens.accessToken).toBeDefined();
            expect(result.tokens.refreshToken).toBeDefined();
        });

        it("rejects an email that is already registered", async () => {
            mockUserFindOne(userDocument);

            await expect(
                registerUser(validRegistration)
            ).rejects.toThrow(
                "An account with this email already exists."
            );

            expect(mocks.userCreate).not.toHaveBeenCalled();
        });
    });

    describe("loginUser", () => {
        it("logs in a user with valid credentials", async () => {
            mockUserFindOne(userDocument);

            const result = await loginUser(validLogin);

            expect(mocks.verify).toHaveBeenCalledWith(
                "hashed-password",
                validLogin.password
            );
            expect(result.user.email).toBe(validLogin.email);
            expect(result.tokens.accessToken).toBeDefined();
            expect(result.tokens.refreshToken).toBeDefined();
        });

        it("rejects an unknown email", async () => {
            mockUserFindOne(null);

            await expect(
                loginUser(validLogin)
            ).rejects.toThrow("Invalid email or password.");
        });

        it("rejects an incorrect password", async () => {
            mockUserFindOne(userDocument);
            mocks.verify.mockResolvedValue(false);

            await expect(
                loginUser(validLogin)
            ).rejects.toThrow("Invalid email or password.");
        });

        it("rejects an inactive account", async () => {
            mockUserFindOne({
                ...userDocument,
                isActive: false,
            });

            await expect(loginUser(validLogin)).rejects.toThrow();
        });
    });

    describe("refreshSession", () => {
        it("rejects an invalid refresh token", async () => {
            await expect(
                refreshSession("invalid-refresh-token")
            ).rejects.toThrow();
        });

        it("rejects a refresh token without a matching stored session", async () => {
            mocks.refreshTokenFindOne.mockResolvedValue(null);

            await expect(
                refreshSession("test-refresh-token")
            ).rejects.toThrow();
        });
    });

    describe("logoutUser", () => {
        it("revokes a refresh-token session", async () => {
            await logoutUser("test-refresh-token");

            expect(mocks.refreshTokenUpdateOne).toHaveBeenCalled();
        });

        it("does not throw when no matching session exists", async () => {
            mocks.refreshTokenUpdateOne.mockResolvedValue({
                modifiedCount: 0,
                matchedCount: 0,
            });

            await expect(
                logoutUser("unknown-refresh-token")
            ).resolves.not.toThrow();
        });
    });
});