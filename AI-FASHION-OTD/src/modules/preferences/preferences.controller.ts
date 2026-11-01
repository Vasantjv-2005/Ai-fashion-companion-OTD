import type { Request, Response, NextFunction } from "express";
import {
    getPreferences,
    updatePreferences,
    resetPreferences,
    PreferenceServiceError,
} from "./preferences.service";
import { validateUpdatePreferences } from "./preferences.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handlePreferenceError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof PreferenceServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function getPreferencesController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    try {
        const preferences = await getPreferences(userId);
        res.status(200).json({ success: true, data: preferences });
    } catch (error) {
        handlePreferenceError(error, res, next);
    }
}

export async function updatePreferencesController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateUpdatePreferences(req.body);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
            errors: validation.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            })),
        });
        return;
    }

    try {
        const preferences = await updatePreferences(userId, validation.data);
        res.status(200).json({ success: true, data: preferences });
    } catch (error) {
        handlePreferenceError(error, res, next);
    }
}

export async function resetPreferencesController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    try {
        const preferences = await resetPreferences(userId);
        res.status(200).json({
            success: true,
            data: preferences,
            message: "Preferences reset to default values.",
        });
    } catch (error) {
        handlePreferenceError(error, res, next);
    }
}

