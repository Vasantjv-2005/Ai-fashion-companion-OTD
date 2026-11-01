"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_ERROR_MESSAGES = exports.AUTH_COOKIE_NAMES = exports.AUTH_CONSTANTS = void 0;
exports.AUTH_CONSTANTS = {
    ACCESS_TOKEN_EXPIRY: "15m",
    REFRESH_TOKEN_EXPIRY_DAYS: 7,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    EMAIL_MAX_LENGTH: 254,
};
exports.AUTH_COOKIE_NAMES = {
    ACCESS_TOKEN: "accessToken",
    REFRESH_TOKEN: "refreshToken",
};
exports.AUTH_ERROR_MESSAGES = {
    INVALID_CREDENTIALS: "Invalid email or password.",
    EMAIL_ALREADY_REGISTERED: "An account with this email already exists.",
    UNAUTHORIZED: "Authentication is required.",
    INVALID_REFRESH_TOKEN: "Invalid or expired refresh token.",
    VALIDATION_FAILED: "Request validation failed.",
};
