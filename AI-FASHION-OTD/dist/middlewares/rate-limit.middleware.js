"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRateLimiter = exports.authRateLimiter = exports.generalRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const standardRateLimitOptions = {
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    handler: (_req, res, _next, options) => {
        res.status(options.statusCode).json(options.message);
    },
};
exports.generalRateLimiter = (0, express_rate_limit_1.default)({
    ...standardRateLimitOptions,
    windowMs: 15 * 60 * 1000,
    limit: 200,
});
exports.authRateLimiter = (0, express_rate_limit_1.default)({
    ...standardRateLimitOptions,
    windowMs: 15 * 60 * 1000,
    limit: 20,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later.",
    },
});
exports.aiRateLimiter = (0, express_rate_limit_1.default)({
    ...standardRateLimitOptions,
    windowMs: 60 * 1000,
    limit: 15,
    message: {
        success: false,
        message: "Too many AI requests. Please wait before trying again.",
    },
});
exports.default = exports.generalRateLimiter;
