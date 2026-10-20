import type { AuthenticatedUser, LoginInput, RegisterInput } from "../../src/modules/auth/auth.types";

export const TEST_USER_ID = "507f1f77bcf86cd799439011";

export const TEST_USER: AuthenticatedUser = {
    id: TEST_USER_ID,
    name: "Test User",
    email: "testuser@example.com",
};

export const TEST_REGISTER_INPUT: RegisterInput = {
    name: "Test User",
    email: "testuser@example.com",
    password: "TestPassword123!",
};

export const TEST_LOGIN_INPUT: LoginInput = {
    email: "testuser@example.com",
    password: "TestPassword123!",
};

export const TEST_EXISTING_USER = {
    _id: TEST_USER_ID,
    name: "Test User",
    email: "testuser@example.com",
    passwordHash: "$argon2id$test-password-hash",
    isActive: true,
};

export const TEST_INVALID_LOGIN_INPUT: LoginInput = {
    email: "testuser@example.com",
    password: "WrongPassword123!",
};
