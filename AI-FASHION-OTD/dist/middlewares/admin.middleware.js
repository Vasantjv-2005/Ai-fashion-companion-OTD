"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminMiddleware = adminMiddleware;
/**
 * Protects routes that should only be accessible to administrators.
 *
 * Requires authMiddleware to run first.
 * The authenticated user's role must come from a trusted source.
 */
function adminMiddleware(req, res, next) {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Authentication is required.",
        });
        return;
    }
    const userWithRole = req.user;
    if (userWithRole.role !== "admin") {
        res.status(403).json({
            success: false,
            message: "Administrator access is required.",
        });
        return;
    }
    next();
}
exports.default = adminMiddleware;
