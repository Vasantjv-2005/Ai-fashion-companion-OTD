import type { Request, Response, NextFunction } from "express";
import {
    createProfile,
    getProfile,
    updateProfile,
    ProfileServiceError,
} from "./profile.service";
import { validateUpdateProfile } from "./profile.validator";

function getUserId(req: Request): string | null {
    const user = (
        req as Request & {
            user?: {
                id?: string;
                _id?: string;
            };
        }
    ).user;

    return user?.id ?? user?._id ?? null;
}

/**
 * Handles profile service errors consistently.
 * This also handles errors across module boundaries
 * where instanceof might not work as expected.
 */
function handleProfileError(
    error: unknown,
    res: Response,
    next: NextFunction,
): void {
    if (
        error instanceof Error &&
        error.name === "ProfileServiceError" &&
        "statusCode" in error &&
        typeof error.statusCode === "number"
    ) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }

    next(error);
}

export async function getMyProfile(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req);

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const profile = await getProfile(userId);

        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully.",
            data: profile,
        });
    } catch (error) {
        handleProfileError(error, res, next);
    }
}

export async function createMyProfile(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req);

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const validation = validateUpdateProfile(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid profile data.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
            return;
        }

        const profile = await createProfile(userId, validation.data);

        res.status(201).json({
            success: true,
            message: "Profile created successfully.",
            data: profile,
        });
    } catch (error) {
        handleProfileError(error, res, next);
    }
}

export async function updateMyProfile(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    try {
        const userId = getUserId(req);

        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }

        const validation = validateUpdateProfile(req.body);

        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid profile data.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
            return;
        }

        const profile = await updateProfile(userId, validation.data);

        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: profile,
        });
    } catch (error) {
        handleProfileError(error, res, next);
    }
}
