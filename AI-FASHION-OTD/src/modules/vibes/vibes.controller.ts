import type { Request, Response, NextFunction } from "express";
import {
    setUserVibe,
    getActiveVibe,
    getUserVibes,
    getPresetVibes,
    deleteVibe,
    VibeServiceError,
} from "./vibes.service";
import { validateCreateVibe } from "./vibes.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleVibeError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof VibeServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function setUserVibeController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateCreateVibe(req.body);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Validation failed.",
            errors: validation.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            })),
        });
        return;
    }

    try {
        const vibe = await setUserVibe(userId, validation.data);
        res.status(201).json({ success: true, data: vibe });
    } catch (error) {
        handleVibeError(error, res, next);
    }
}

export async function getActiveVibeController(
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
        const vibe = await getActiveVibe(userId);
        res.status(200).json({ success: true, data: vibe });
    } catch (error) {
        handleVibeError(error, res, next);
    }
}

export async function getUserVibesController(
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
        const vibes = await getUserVibes(userId);
        res.status(200).json({ success: true, data: vibes });
    } catch (error) {
        handleVibeError(error, res, next);
    }
}

export function getPresetVibesController(
    _req: Request,
    res: Response,
): void {
    const presets = getPresetVibes();
    res.status(200).json({ success: true, data: presets });
}

export async function deleteVibeController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const vibeId = req.params.id as string;
    if (!vibeId) {
        res.status(400).json({ success: false, message: "Vibe ID is required." });
        return;
    }

    try {
        const result = await deleteVibe(userId, vibeId);
        res.status(200).json(result);
    } catch (error) {
        handleVibeError(error, res, next);
    }
}

