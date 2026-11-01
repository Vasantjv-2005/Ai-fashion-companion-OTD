"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
class ApiError extends Error {
    statusCode;
    errors;
    isOperational;
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
    static badRequest(message = "Bad request", errors = []) {
        return new ApiError(400, message, errors);
    }
    static unauthorized(message = "Authentication is required", errors = []) {
        return new ApiError(401, message, errors);
    }
    static forbidden(message = "Forbidden access", errors = []) {
        return new ApiError(403, message, errors);
    }
    static notFound(message = "Resource not found", errors = []) {
        return new ApiError(404, message, errors);
    }
    static conflict(message = "Conflict occurred", errors = []) {
        return new ApiError(409, message, errors);
    }
    static payloadTooLarge(message = "Payload too large", errors = []) {
        return new ApiError(413, message, errors);
    }
    static unsupportedMediaType(message = "Unsupported media type", errors = []) {
        return new ApiError(415, message, errors);
    }
    static unprocessableEntity(message = "Validation failed", errors = []) {
        return new ApiError(422, message, errors);
    }
    static internal(message = "Internal server error", errors = []) {
        return new ApiError(500, message, errors);
    }
    static serviceUnavailable(message = "Service temporarily unavailable", errors = []) {
        return new ApiError(503, message, errors);
    }
}
exports.ApiError = ApiError;
exports.default = ApiError;
