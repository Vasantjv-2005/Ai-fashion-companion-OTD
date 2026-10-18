
import type {
    ErrorRequestHandler,
    Request,
    Response,
    NextFunction,
} from "express";
import { ZodError } from "zod";
import { logger } from "../config/logger";

interface ErrorWithStatus extends Error {
    status?: number;
    statusCode?: number;
    code?: number | string;
    type?: string;
}

export const errorMiddleware: ErrorRequestHandler = (
    error: unknown,
    req: Request,
    res: Response,
    _next: NextFunction,
): void => {
    if (res.headersSent) {
        return;
    }

    let statusCode = 500;
    let message = "An unexpected server error occurred.";
    let details: unknown;

    if (error instanceof ZodError) {
        statusCode = 400;
        message = "Request validation failed.";

        details = error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
    } else if (error instanceof Error) {
        const typedError = error as ErrorWithStatus;
        const candidateStatus = typedError.statusCode ?? typedError.status;

        if (
            typeof candidateStatus === "number" &&
            candidateStatus >= 400 &&
            candidateStatus <= 599
        ) {
            statusCode = candidateStatus;
        }

        if (statusCode < 500) {
            message = error.message;
        }

        // Handle malformed JSON request bodies.
        if (
            typedError instanceof SyntaxError &&
            "body" in typedError
        ) {
            statusCode = 400;
            message = "Invalid JSON request body.";
        }

        // Handle MongoDB duplicate-key errors.
        if (typedError.code === 11000) {
            statusCode = 409;
            message = "A record with this value already exists.";
        }

        // Handle oversized request bodies.
        if (typedError.type === "entity.too.large") {
            statusCode = 413;
            message = "Request body is too large.";
        }
    }

    logger.error("HTTP request failed", {
        method: req.method,
        path: req.originalUrl,
        statusCode,
        error: error instanceof Error ? error.message : String(error),
    });

    res.status(statusCode).json({
        success: false,
        message,
        ...(details ? { errors: details } : {}),
        ...(process.env.NODE_ENV !== "production" && error instanceof Error
            ? { debug: { name: error.name } }
            : {}),
    });
};

export default errorMiddleware;
