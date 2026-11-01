"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.loginSchema = exports.registerSchema = void 0;
exports.validateRegistration = validateRegistration;
exports.validateLogin = validateLogin;
exports.validateRefreshToken = validateRefreshToken;
const zod_1 = require("zod");
const auth_constants_1 = require("../../constants/auth.constants");
exports.registerSchema = zod_1.z
    .object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, "Name must contain at least 2 characters.")
        .max(100, "Name cannot exceed 100 characters."),
    email: zod_1.z
        .string()
        .trim()
        .min(1, "Email is required.")
        .max(auth_constants_1.AUTH_CONSTANTS.EMAIL_MAX_LENGTH, "Email is too long.")
        .email("Enter a valid email address.")
        .transform((value) => value.toLowerCase()),
    password: zod_1.z
        .string()
        .min(auth_constants_1.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH, `Password must contain at least ${auth_constants_1.AUTH_CONSTANTS.PASSWORD_MIN_LENGTH} characters.`)
        .max(auth_constants_1.AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, `Password cannot exceed ${auth_constants_1.AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters.`),
})
    .strict();
exports.loginSchema = zod_1.z
    .object({
    email: zod_1.z
        .string()
        .trim()
        .min(1, "Email is required.")
        .max(auth_constants_1.AUTH_CONSTANTS.EMAIL_MAX_LENGTH, "Email is too long.")
        .email("Enter a valid email address.")
        .transform((value) => value.toLowerCase()),
    password: zod_1.z
        .string()
        .min(1, "Password is required.")
        .max(auth_constants_1.AUTH_CONSTANTS.PASSWORD_MAX_LENGTH, `Password cannot exceed ${auth_constants_1.AUTH_CONSTANTS.PASSWORD_MAX_LENGTH} characters.`),
})
    .strict();
exports.refreshTokenSchema = zod_1.z
    .object({
    refreshToken: zod_1.z.string().min(1, "Refresh token is required."),
})
    .strict();
function validateRegistration(input) {
    return exports.registerSchema.parse(input);
}
function validateLogin(input) {
    return exports.loginSchema.parse(input);
}
function validateRefreshToken(input) {
    return exports.refreshTokenSchema.parse(input);
}
