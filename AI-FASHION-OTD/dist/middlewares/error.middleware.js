"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = void 0;
const zod_1 = require("zod");
const logger_1 = require("../config/logger");
const errorMiddleware = (error, req, res, _next) => {
    if (res.headersSent) {
        return;
    }
    let statusCode = 500;
    let message = "An unexpected server error occurred.";
    let details;
    if (error instanceof zod_1.ZodError) {
        statusCode = 400;
        message = "Request validation failed.";
        details = error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));
    }
    else if (error instanceof Error) {
        const typedError = error;
        const candidateStatus = typedError.statusCode ?? typedError.status;
        if (typeof candidateStatus === "number" &&
            candidateStatus >= 400 &&
            candidateStatus <= 599) {
            statusCode = candidateStatus;
        }
        if (statusCode < 500) {
            message = error.message;
        }
        // Handle malformed JSON request bodies.
        if (typedError instanceof SyntaxError &&
            "body" in typedError) {
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
    logger_1.logger.error("HTTP request failed", {
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
exports.errorMiddleware = errorMiddleware;
exports.default = exports.errorMiddleware;
