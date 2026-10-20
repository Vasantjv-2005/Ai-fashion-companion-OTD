
import type { Response, NextFunction } from "express";

import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

import {
    createWardrobeItem,
    getWardrobeItems,
    getWardrobeItemById,
    updateWardrobeItem,
    deleteWardrobeItem,
    WardrobeServiceError,
} from "./wardrobe.service";

import {
    createWardrobeItemSchema,
    updateWardrobeItemSchema,
    wardrobeItemIdSchema,
    wardrobeListQuerySchema,
} from "./wardrobe.validator";

function handleControllerError(
    error: unknown,
    res: Response,
): void {
    if (error instanceof WardrobeServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }

    res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing your wardrobe request.",
    });
}

function getAuthenticatedUserId(
    req: AuthenticatedRequest,
    res: Response,
): string | null {
    if (!req.user?.id) {
        res.status(401).json({
            success: false,
            message: "Authentication is required.",
        });
        return null;
    }

    return req.user.id;
}

export async function createWardrobeItemController(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
): Promise<void> {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const validation = createWardrobeItemSchema.safeParse(req.body);

    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }

    try {
        const item = await createWardrobeItem(userId, validation.data);

        res.status(201).json({
            success: true,
            message: "Wardrobe item created successfully.",
            data: item,
        });
    } catch (error: unknown) {
        handleControllerError(error, res);
    }
}

export async function getWardrobeItemsController(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
): Promise<void> {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const validation = wardrobeListQuerySchema.safeParse(req.query);

    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe query parameters.",
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }

    try {
        const result = await getWardrobeItems(userId, validation.data);

        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error: unknown) {
        handleControllerError(error, res);
    }
}

export async function getWardrobeItemByIdController(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
): Promise<void> {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const validation = wardrobeItemIdSchema.safeParse(req.params.id);

    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe item ID.",
        });
        return;
    }

    try {
        const item = await getWardrobeItemById(userId, validation.data);

        res.status(200).json({
            success: true,
            data: item,
        });
    } catch (error: unknown) {
        handleControllerError(error, res);
    }
}

export async function updateWardrobeItemController(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
): Promise<void> {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const idValidation = wardrobeItemIdSchema.safeParse(req.params.id);

    if (!idValidation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe item ID.",
        });
        return;
    }

    const bodyValidation = updateWardrobeItemSchema.safeParse(req.body);

    if (!bodyValidation.success) {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
            errors: bodyValidation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }

    try {
        const item = await updateWardrobeItem(
            userId,
            idValidation.data,
            bodyValidation.data,
        );

        res.status(200).json({
            success: true,
            message: "Wardrobe item updated successfully.",
            data: item,
        });
    } catch (error: unknown) {
        handleControllerError(error, res);
    }
}

export async function deleteWardrobeItemController(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
): Promise<void> {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const validation = wardrobeItemIdSchema.safeParse(req.params.id);

    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe item ID.",
        });
        return;
    }

    try {
        await deleteWardrobeItem(userId, validation.data);

        res.status(200).json({
            success: true,
            message: "Wardrobe item deleted successfully.",
        });
    } catch (error: unknown) {
        handleControllerError(error, res);
    }
}
