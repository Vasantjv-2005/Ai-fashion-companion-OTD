
import { describe, expect, it } from "vitest";

import {
    validateRegistration,
    validateLogin,
    validateRefreshToken,
} from "../../src/modules/auth/auth.validator";

describe("Authentication validator unit tests", () => {
    describe("validateRegistration", () => {
        it("accepts valid registration data", () => {
            const result = validateRegistration({
                name: "Test User",
                email: "test@example.com",
                password: "StrongPassword123",
            });

            expect(result.email).toBe("test@example.com");
            expect(result.name).toBe("Test User");
        });

        it("normalizes email to lowercase", () => {
            const result = validateRegistration({
                name: "Test User",
                email: "TEST@EXAMPLE.COM",
                password: "StrongPassword123",
            });

            expect(result.email).toBe("test@example.com");
        });

        it("rejects an invalid email", () => {
            expect(() =>
                validateRegistration({
                    name: "Test User",
                    email: "invalid-email",
                    password: "StrongPassword123",
                })
            ).toThrow();
        });

        it("rejects a password that is too short", () => {
            expect(() =>
                validateRegistration({
                    name: "Test User",
                    email: "test@example.com",
                    password: "123",
                })
            ).toThrow();
        });

        it("rejects a name that is too short", () => {
            expect(() =>
                validateRegistration({
                    name: "A",
                    email: "test@example.com",
                    password: "StrongPassword123",
                })
            ).toThrow();
        });

        it("rejects missing registration fields", () => {
            expect(() =>
                validateRegistration({
                    email: "test@example.com",
                } as never)
            ).toThrow();
        });

        it("rejects unexpected registration fields", () => {
            expect(() =>
                validateRegistration({
                    name: "Test User",
                    email: "test@example.com",
                    password: "StrongPassword123",
                    isAdmin: true,
                } as never)
            ).toThrow();
        });
    });

    describe("validateLogin", () => {
        it("accepts valid login data", () => {
            const result = validateLogin({
                email: "test@example.com",
                password: "StrongPassword123",
            });

            expect(result.email).toBe("test@example.com");
            expect(result.password).toBe("StrongPassword123");
        });

        it("rejects an invalid email", () => {
            expect(() =>
                validateLogin({
                    email: "not-an-email",
                    password: "StrongPassword123",
                })
            ).toThrow();
        });

        it("rejects an empty password", () => {
            expect(() =>
                validateLogin({
                    email: "test@example.com",
                    password: "",
                })
            ).toThrow();
        });

        it("rejects missing login fields", () => {
            expect(() =>
                validateLogin({
                    email: "test@example.com",
                } as never)
            ).toThrow();
        });
    });

    describe("validateRefreshToken", () => {
        it("accepts a valid refresh token", () => {
            const result = validateRefreshToken({
                refreshToken: "valid-refresh-token",
            });

            expect(result.refreshToken).toBe("valid-refresh-token");
        });

        it("rejects a missing refresh token", () => {
            expect(() =>
                validateRefreshToken({})
            ).toThrow();
        });

        it("rejects an empty refresh token", () => {
            expect(() =>
                validateRefreshToken({
                    refreshToken: "",
                })
            ).toThrow();
        });
    });
});
