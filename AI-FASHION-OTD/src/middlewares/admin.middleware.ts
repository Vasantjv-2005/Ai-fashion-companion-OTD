
import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "./auth.middleware";

/**
 * Protects routes that should only be accessible to administrators.
 *
 * Requires authMiddleware to run first.
 * The authenticated user's role must come from a trusted source.
 */
export function adminMiddleware(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void {
    if (!req.user) {
        res.status(401).json({
            success: false,
            message: "Authentication is required.",
        });
        return;
    }

    const userWithRole = req.user as typeof req.user & {
        role?: string;
    };

    if (userWithRole.role !== "admin") {
        res.status(403).json({
            success: false,
            message: "Administrator access is required.",
        });
        return;
    }

    next();
}

export default adminMiddleware;
