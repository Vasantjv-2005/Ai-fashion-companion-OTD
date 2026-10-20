import type { AuthTokens } from "../../src/modules/auth/auth.types";

export const TEST_ACCESS_TOKEN = "test-access-token";
export const TEST_REFRESH_TOKEN = "test-refresh-token";

export const TEST_AUTH_TOKENS: AuthTokens = {
    accessToken: TEST_ACCESS_TOKEN,
    refreshToken: TEST_REFRESH_TOKEN,
};

export const TEST_EXPIRED_ACCESS_TOKEN = "expired-test-access-token";
export const TEST_INVALID_ACCESS_TOKEN = "invalid-test-access-token";
export const TEST_INVALID_REFRESH_TOKEN = "invalid-test-refresh-token";
