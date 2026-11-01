"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerController = registerController;
exports.loginController = loginController;
exports.refreshController = refreshController;
exports.logoutController = logoutController;
const auth_service_1 = require("./auth.service");
const auth_validator_1 = require("./auth.validator");
const auth_constants_1 = require("../../constants/auth.constants");
const isProduction = process.env.NODE_ENV === "production";
const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    path: "/api/auth",
};
function getErrorStatus(error) {
    if (error instanceof auth_service_1.AuthServiceError) {
        return error.statusCode;
    }
    return 500;
}
function getErrorMessage(error) {
    if (error instanceof auth_service_1.AuthServiceError) {
        return error.message;
    }
    return "An unexpected error occurred.";
}
function handleError(error, res, next) {
    if (error instanceof auth_service_1.AuthServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    if (typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "ZodError") {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
        });
        return;
    }
    next(error);
}
async function registerController(req, res, next) {
    try {
        const input = (0, auth_validator_1.validateRegistration)(req.body);
        const result = await (0, auth_service_1.registerUser)(input);
        res.cookie(auth_constants_1.AUTH_COOKIE_NAMES.REFRESH_TOKEN, result.tokens.refreshToken, {
            ...refreshCookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            success: true,
            message: "Registration successful.",
            user: result.user,
            accessToken: result.tokens.accessToken,
        });
    }
    catch (error) {
        handleError(error, res, next);
    }
}
async function loginController(req, res, next) {
    try {
        const input = (0, auth_validator_1.validateLogin)(req.body);
        const result = await (0, auth_service_1.loginUser)(input);
        res.cookie(auth_constants_1.AUTH_COOKIE_NAMES.REFRESH_TOKEN, result.tokens.refreshToken, {
            ...refreshCookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            success: true,
            message: "Login successful.",
            user: result.user,
            accessToken: result.tokens.accessToken,
        });
    }
    catch (error) {
        handleError(error, res, next);
    }
}
async function refreshController(req, res, next) {
    try {
        const rawToken = req.cookies?.[auth_constants_1.AUTH_COOKIE_NAMES.REFRESH_TOKEN] ??
            req.body?.refreshToken;
        const input = (0, auth_validator_1.validateRefreshToken)({
            refreshToken: rawToken,
        });
        const result = await (0, auth_service_1.refreshSession)(input.refreshToken);
        res.cookie(auth_constants_1.AUTH_COOKIE_NAMES.REFRESH_TOKEN, result.tokens.refreshToken, {
            ...refreshCookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            success: true,
            message: "Session refreshed.",
            user: result.user,
            accessToken: result.tokens.accessToken,
        });
    }
    catch (error) {
        handleError(error, res, next);
    }
}
async function logoutController(req, res, next) {
    try {
        const rawToken = req.cookies?.[auth_constants_1.AUTH_COOKIE_NAMES.REFRESH_TOKEN] ??
            req.body?.refreshToken;
        if (typeof rawToken === "string" && rawToken.length > 0) {
            await (0, auth_service_1.logoutUser)(rawToken);
        }
        res.clearCookie(auth_constants_1.AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshCookieOptions);
        res.status(200).json({
            success: true,
            message: "Logout successful.",
        });
    }
    catch (error) {
        handleError(error, res, next);
    }
}
