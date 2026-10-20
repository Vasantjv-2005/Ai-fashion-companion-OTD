
import type { Response, NextFunction } from "express";

import type { AuthenticatedRequest } from "../../middlewares/auth.middleware";

import {
    uploadWardrobeItemImage,
    deleteWardrobeItemImage,
    WardrobeImageServiceError,
} from "./wardrobe-image.service";

function handleImageControllerError(
    error: unknown,
    res: Response,
): void {
    if (error instanceof WardrobeImageServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }

    res.status(500).json({
        success: false,
        message:
            "An unexpected error occurred while processing the wardrobe image.",
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

function getWardrobeItemId(
    param: string | string[] | undefined,
): string | null {
    if (typeof param !== "string" || !param.trim()) {
        return null;
    }

    return param.trim();
}

/**
 * POST /api/wardrobe/:id/image
 * Uploads or replaces the image for a wardrobe item.
 * Requires upload middleware to populate req.file.
 */
export async function uploadWardrobeItemImageController(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
): Promise<void> {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const itemId = getWardrobeItemId(req.params.id);

    if (!itemId) {
        res.status(400).json({
            success: false,
            message: "A valid wardrobe item ID is required.",
        });
        return;
    }

    const file = req.file;

    if (!file) {
        res.status(400).json({
            success: false,
            message: "Please upload an image using the 'image' field.",
        });
        return;
    }

    try {
        const result = await uploadWardrobeItemImage(
            userId,
            itemId,
            {
                filename: file.originalname,
                contentType: file.mimetype,
                buffer: file.buffer,
            },
        );

        res.status(200).json({
            success: true,
            message: "Wardrobe image uploaded successfully.",
            data: result,
        });
    } catch (error: unknown) {
        handleImageControllerError(error, res);
    }
}

/**
 * DELETE /api/wardrobe/:id/image
 * Deletes the image attached to a wardrobe item.
 */
export async function deleteWardrobeItemImageController(
    req: AuthenticatedRequest,
    res: Response,
    _next: NextFunction,
): Promise<void> {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId) return;

    const itemId = getWardrobeItemId(req.params.id);

    if (!itemId) {
        res.status(400).json({
            success: false,
            message: "A valid wardrobe item ID is required.",
        });
        return;
    }

    try {
        await deleteWardrobeItemImage(userId, itemId);

        res.status(200).json({
            success: true,
            message: "Wardrobe image deleted successfully.",
        });
    } catch (error: unknown) {
        handleImageControllerError(error, res);
    }
}
