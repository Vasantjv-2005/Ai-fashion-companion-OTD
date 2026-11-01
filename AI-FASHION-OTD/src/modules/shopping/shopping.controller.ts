import type { Request, Response, NextFunction } from "express";
import {
    createRecommendation,
    getRecommendations,
    updateRecommendationStatus,
    generateGapShoppingList,
    deleteRecommendation,
    ShoppingServiceError,
} from "./shopping.service";
import {
    validateCreateRecommendation,
    validateUpdateRecommendationStatus,
    validateShoppingQuery,
} from "./shopping.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleShoppingError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof ShoppingServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function createRecommendationController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateCreateRecommendation(req.body);
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
        const item = await createRecommendation(userId, validation.data);
        res.status(201).json({ success: true, data: item });
    } catch (error) {
        handleShoppingError(error, res, next);
    }
}

export async function getRecommendationsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateShoppingQuery(req.query);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid query parameters.",
            errors: validation.error.issues.map((i) => ({
                field: i.path.join("."),
                message: i.message,
            })),
        });
        return;
    }

    try {
        const result = await getRecommendations(userId, validation.data);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        handleShoppingError(error, res, next);
    }
}

export async function updateRecommendationStatusController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const recId = req.params.id as string;
    if (!recId) {
        res.status(400).json({ success: false, message: "Recommendation ID is required." });
        return;
    }

    const validation = validateUpdateRecommendationStatus(req.body);
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
        const updated = await updateRecommendationStatus(userId, recId, validation.data.status);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        handleShoppingError(error, res, next);
    }
}

export async function generateGapShoppingListController(
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
        const list = await generateGapShoppingList(userId);
        res.status(200).json({ success: true, data: list });
    } catch (error) {
        handleShoppingError(error, res, next);
    }
}

export async function deleteRecommendationController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const recId = req.params.id as string;
    if (!recId) {
        res.status(400).json({ success: false, message: "Recommendation ID is required." });
        return;
    }

    try {
        const result = await deleteRecommendation(userId, recId);
        res.status(200).json(result);
    } catch (error) {
        handleShoppingError(error, res, next);
    }
}

