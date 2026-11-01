export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly errors: unknown[];
    public readonly isOperational: boolean;

    constructor(
        statusCode: number,
        message: string = "Something went wrong",
        errors: unknown[] = [],
        stack: string = "",
    ) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = true;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    static badRequest(message: string = "Bad request", errors: unknown[] = []): ApiError {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message: string = "Authentication is required", errors: unknown[] = []): ApiError {
        return new ApiError(401, message, errors);
    }

    static forbidden(message: string = "Forbidden access", errors: unknown[] = []): ApiError {
        return new ApiError(403, message, errors);
    }

    static notFound(message: string = "Resource not found", errors: unknown[] = []): ApiError {
        return new ApiError(404, message, errors);
    }

    static conflict(message: string = "Conflict occurred", errors: unknown[] = []): ApiError {
        return new ApiError(409, message, errors);
    }

    static payloadTooLarge(message: string = "Payload too large", errors: unknown[] = []): ApiError {
        return new ApiError(413, message, errors);
    }

    static unsupportedMediaType(message: string = "Unsupported media type", errors: unknown[] = []): ApiError {
        return new ApiError(415, message, errors);
    }

    static unprocessableEntity(message: string = "Validation failed", errors: unknown[] = []): ApiError {
        return new ApiError(422, message, errors);
    }

    static internal(message: string = "Internal server error", errors: unknown[] = []): ApiError {
        return new ApiError(500, message, errors);
    }

    static serviceUnavailable(message: string = "Service temporarily unavailable", errors: unknown[] = []): ApiError {
        return new ApiError(503, message, errors);
    }
}

export default ApiError;

