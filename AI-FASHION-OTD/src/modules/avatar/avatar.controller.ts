import type { Request, Response, NextFunction } from "express";
import {
    getAvatar,
    createOrUpdateAvatar,
    uploadAvatarImage,
    deleteAvatar,
    AvatarServiceError,
} from "./avatar.service";
import {
    validateCreateAvatar,
    validateUpdateAvatar,
} from "./avatar.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleAvatarError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof AvatarServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function getAvatarController(
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
        const avatar = await getAvatar(userId);
        res.status(200).json({ success: true, data: avatar });
    } catch (error) {
        handleAvatarError(error, res, next);
    }
}

export async function createOrUpdateAvatarController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateCreateAvatar(req.body);
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
        const avatar = await createOrUpdateAvatar(userId, validation.data);
        res.status(200).json({ success: true, data: avatar });
    } catch (error) {
        handleAvatarError(error, res, next);
    }
}

export async function uploadAvatarImageController(
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
        const avatar = await uploadAvatarImage(userId, req.file);
        res.status(200).json({ success: true, data: avatar });
    } catch (error) {
        handleAvatarError(error, res, next);
    }
}

export async function deleteAvatarController(
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
        const result = await deleteAvatar(userId);
        res.status(200).json(result);
    } catch (error) {
        handleAvatarError(error, res, next);
    }
}

