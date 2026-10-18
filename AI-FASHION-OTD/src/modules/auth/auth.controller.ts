
import type { Request, Response, NextFunction } from "express";
import {
    registerUser,
    loginUser,
    refreshSession,
    logoutUser,
    AuthServiceError,
} from "./auth.service";
import {
    validateRegistration,
    validateLogin,
    validateRefreshToken,
} from "./auth.validator";
import { AUTH_COOKIE_NAMES } from "../../constants/auth.constants";

const isProduction = process.env.NODE_ENV === "production";

const refreshCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/api/auth",
};

function getErrorStatus(error: unknown): number {
    if (error instanceof AuthServiceError) {
        return error.statusCode;
    }

    return 500;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof AuthServiceError) {
        return error.message;
    }

    return "An unexpected error occurred.";
}

function handleError(
    error: unknown,
    res: Response,
    next: NextFunction,
): void {
    if (error instanceof AuthServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }

    if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "ZodError"
    ) {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
        });
        return;
    }

    next(error);
}

export async function registerController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const input = validateRegistration(req.body);
        const result = await registerUser(input);

        res.cookie(
            AUTH_COOKIE_NAMES.REFRESH_TOKEN,
            result.tokens.refreshToken,
            {
                ...refreshCookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            },
        );

        res.status(201).json({
            success: true,
            message: "Registration successful.",
            user: result.user,
            accessToken: result.tokens.accessToken,
        });
    } catch (error: unknown) {
        handleError(error, res, next);
    }
}

export async function loginController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const input = validateLogin(req.body);
        const result = await loginUser(input);

        res.cookie(
            AUTH_COOKIE_NAMES.REFRESH_TOKEN,
            result.tokens.refreshToken,
            {
                ...refreshCookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            },
        );

        res.status(200).json({
            success: true,
            message: "Login successful.",
            user: result.user,
            accessToken: result.tokens.accessToken,
        });
    } catch (error: unknown) {
        handleError(error, res, next);
    }
}

export async function refreshController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const rawToken =
            req.cookies?.[AUTH_COOKIE_NAMES.REFRESH_TOKEN] ??
            req.body?.refreshToken;

        const input = validateRefreshToken({
            refreshToken: rawToken,
        });

        const result = await refreshSession(input.refreshToken);

        res.cookie(
            AUTH_COOKIE_NAMES.REFRESH_TOKEN,
            result.tokens.refreshToken,
            {
                ...refreshCookieOptions,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            },
        );

        res.status(200).json({
            success: true,
            message: "Session refreshed.",
            user: result.user,
            accessToken: result.tokens.accessToken,
        });
    } catch (error: unknown) {
        handleError(error, res, next);
    }
}

export async function logoutController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const rawToken =
            req.cookies?.[AUTH_COOKIE_NAMES.REFRESH_TOKEN] ??
            req.body?.refreshToken;

        if (typeof rawToken === "string" && rawToken.length > 0) {
            await logoutUser(rawToken);
        }

        res.clearCookie(
            AUTH_COOKIE_NAMES.REFRESH_TOKEN,
            refreshCookieOptions,
        );

        res.status(200).json({
            success: true,
            message: "Logout successful.",
        });
    } catch (error: unknown) {
        handleError(error, res, next);
    }
}
