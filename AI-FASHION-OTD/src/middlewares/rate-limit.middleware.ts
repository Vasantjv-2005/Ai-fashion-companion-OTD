
import rateLimit from "express-rate-limit";
import type { Request, Response, NextFunction } from "express";

const standardRateLimitOptions = {
    standardHeaders: "draft-8" as const,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    handler: (
        _req: Request,
        res: Response,
        _next: NextFunction,
        options: { statusCode: number; message: unknown },
    ): void => {
        res.status(options.statusCode).json(options.message);
    },
};

export const generalRateLimiter = rateLimit({
    ...standardRateLimitOptions,
    windowMs: 15 * 60 * 1000,
    limit: 200,
});

export const authRateLimiter = rateLimit({
    ...standardRateLimitOptions,
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
    },
});

export const aiRateLimiter = rateLimit({
    ...standardRateLimitOptions,
    windowMs: 60 * 1000,
    limit: 15,
    message: {
        success: false,
        message: "Too many AI requests. Please wait before trying again.",
    },
});

export default generalRateLimiter;
