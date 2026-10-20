
import type {
    Request,
    Response,
    NextFunction,
    RequestHandler,
} from "express";
import { ZodError, type ZodType } from "zod";

type RequestPart = "body" | "query" | "params";

interface ValidationOptions {
    body?: ZodType;
    query?: ZodType;
    params?: ZodType;
}

export function validateRequest(
    schema: ZodType,
    part: RequestPart = "body",
): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req[part]);

        if (!result.success) {
            res.status(400).json({
                success: false,
                message: "Request validation failed.",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
            return;
        }

        if (part === "body") {
            req.body = result.data;
        }

        next();
    };
}

export function validateParts(
    schemas: ValidationOptions,
): RequestHandler {
    return (req: Request, res: Response, next: NextFunction): void => {
        const errors: Array<{ field: string; message: string }> = [];

        for (const part of ["body", "query", "params"] as const) {
            const schema = schemas[part];

            if (!schema) {
                continue;
            }

            const result = schema.safeParse(req[part]);

            if (!result.success) {
                errors.push(
                    ...result.error.issues.map((issue) => ({
                        field: `${part}.${issue.path.join(".")}`,
                        message: issue.message,
                    })),
                );
                continue;
            }

            if (part === "body") {
                req.body = result.data;
            }
        }

        if (errors.length > 0) {
            res.status(400).json({
                success: false,
                message: "Request validation failed.",
                errors,
            });
            return;
        }

        next();
    };
}

export function handleValidationError(
    error: unknown,
    res: Response,
): boolean {
    if (!(error instanceof ZodError)) {
        return false;
    }

    res.status(400).json({
        success: false,
        message: "Request validation failed.",
        errors: error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        })),
    });

    return true;
}

export default validateRequest;
