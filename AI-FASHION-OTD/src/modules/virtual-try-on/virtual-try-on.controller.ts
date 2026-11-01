import type { Request, Response, NextFunction } from "express";
import {
    createTryOnSession,
    getTryOnSession,
    getUserTryOns,
    deleteTryOnSession,
    VirtualTryOnServiceError,
} from "./virtual-try-on.service";
import { validateCreateTryOn } from "./virtual-try-on.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleTryOnError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof VirtualTryOnServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function createTryOnController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    let parsedBody = req.body;
    if (typeof req.body.wardrobeItemIds === "string") {
        try {
            parsedBody = {
                ...req.body,
                wardrobeItemIds: JSON.parse(req.body.wardrobeItemIds),
            };
        } catch {
            // let validator catch it
        }
    }

    const validation = validateCreateTryOn(parsedBody);
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
        const result = await createTryOnSession(userId, validation.data, req.file);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        handleTryOnError(error, res, next);
    }
}

export async function getTryOnController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const tryOnId = req.params.id as string;
    if (!tryOnId) {
        res.status(400).json({ success: false, message: "Try-on ID is required." });
        return;
    }

    try {
        const result = await getTryOnSession(userId, tryOnId);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        handleTryOnError(error, res, next);
    }
}

export async function listTryOnsController(
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
        const result = await getUserTryOns(userId, req.query);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        handleTryOnError(error, res, next);
    }
}

export async function deleteTryOnController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const tryOnId = req.params.id as string;
    if (!tryOnId) {
        res.status(400).json({ success: false, message: "Try-on ID is required." });
        return;
    }

    try {
        const result = await deleteTryOnSession(userId, tryOnId);
        res.status(200).json(result);
    } catch (error) {
        handleTryOnError(error, res, next);
    }
}

