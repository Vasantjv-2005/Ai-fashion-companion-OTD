"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validateParts = validateParts;
exports.handleValidationError = handleValidationError;
const zod_1 = require("zod");
function validateRequest(schema, part = "body") {
    return (req, res, next) => {
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
function validateParts(schemas) {
    return (req, res, next) => {
        const errors = [];
        for (const part of ["body", "query", "params"]) {
            const schema = schemas[part];
            if (!schema) {
                continue;
            }
            const result = schema.safeParse(req[part]);
            if (!result.success) {
                errors.push(...result.error.issues.map((issue) => ({
                    field: `${part}.${issue.path.join(".")}`,
                    message: issue.message,
                })));
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
function handleValidationError(error, res) {
    if (!(error instanceof zod_1.ZodError)) {
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
exports.default = validateRequest;
