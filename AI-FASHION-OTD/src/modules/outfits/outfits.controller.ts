import type { Request, Response, NextFunction } from "express";

import {
    createOutfit,
    getOutfits,
    getOutfitById,
    updateOutfit,
    deleteOutfit,
    OutfitServiceError,
} from "./outfits.service";

import {
    validateCreateOutfit,
    validateUpdateOutfit,
} from "./outfits.validator";

import type {
    CreateOutfitInput,
} from "./outfits.validator";

function getUserId(req: Request): string | null {
    const user = (
        req as Request & {
            user?: { id?: string; _id?: string };
        }
    ).user;

    return user?.id ?? user?._id ?? null;
}

function getOutfitId(req: Request): string | null {
    const id = req.params.id;

    return typeof id === "string" ? id : null;
}

function handleOutfitError(
    error: unknown,
    res: Response,
    next: NextFunction,
): void {
    if (error instanceof OutfitServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }

    next(error);
}

/**
 * POST /api/outfits
 * Create a new outfit.
 */
export async function createOutfitController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    const validation = validateCreateOutfit(req.body);

    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid outfit data.",
            errors: validation.error.flatten(),
        });
        return;
    }

    try {
        const outfit = await createOutfit(userId, validation.data);

        res.status(201).json({
            success: true,
            message: "Outfit created successfully.",
            data: outfit,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}

/**
 * GET /api/outfits
 * Get the authenticated user's outfits.
 */
export async function getOutfitsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    const pageValue = req.query.page;
    const limitValue = req.query.limit;

    const page = pageValue === undefined ? 1 : Number(pageValue);
    const limit = limitValue === undefined ? 10 : Number(limitValue);

    if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
    ) {
        res.status(400).json({
            success: false,
            message:
                "Page must be a positive integer and limit must be between 1 and 100.",
        });
        return;
    }

    const occasionValue = req.query.occasion;
    const statusValue = req.query.status;

    const allowedOccasions: CreateOutfitInput["occasion"][] = [
        "casual",
        "work",
        "party",
        "wedding",
        "date",
        "travel",
        "gym",
        "formal",
        "other",
    ];

    const allowedStatuses: NonNullable<CreateOutfitInput["status"]>[] = [
        "generated",
        "saved",
        "worn",
    ];

    if (
        (occasionValue !== undefined &&
            (typeof occasionValue !== "string" ||
                !allowedOccasions.includes(
                    occasionValue as CreateOutfitInput["occasion"],
                ))) ||
        (statusValue !== undefined &&
            (typeof statusValue !== "string" ||
                !allowedStatuses.includes(
                    statusValue as NonNullable<CreateOutfitInput["status"]>,
                )))
    ) {
        res.status(400).json({
            success: false,
            message: "Invalid occasion or outfit status filter.",
        });
        return;
    }

    try {
        const filters: Parameters<typeof getOutfits>[1] = {
            page,
            limit,
        };

        if (typeof occasionValue === "string") {
            filters.occasion =
                occasionValue as CreateOutfitInput["occasion"];
        }

        if (typeof statusValue === "string") {
            filters.status =
                statusValue as CreateOutfitInput["status"];
        }

        const result = await getOutfits(userId, filters);

        res.status(200).json({
            success: true,
            data: result.outfits,
            pagination: result.pagination,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}

/**
 * GET /api/outfits/:id
 * Get a specific outfit.
 */
export async function getOutfitByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    const outfitId = getOutfitId(req);

    if (!outfitId) {
        res.status(400).json({
            success: false,
            message: "A valid outfit ID is required.",
        });
        return;
    }

    try {
        const outfit = await getOutfitById(userId, outfitId);

        res.status(200).json({
            success: true,
            data: outfit,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}

/**
 * PATCH /api/outfits/:id
 * Update a specific outfit.
 */
export async function updateOutfitController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    const outfitId = getOutfitId(req);

    if (!outfitId) {
        res.status(400).json({
            success: false,
            message: "A valid outfit ID is required.",
        });
        return;
    }

    const validation = validateUpdateOutfit(req.body);

    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid outfit update data.",
            errors: validation.error.flatten(),
        });
        return;
    }

    try {
        const outfit = await updateOutfit(
            userId,
            outfitId,
            validation.data,
        );

        res.status(200).json({
            success: true,
            message: "Outfit updated successfully.",
            data: outfit,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}

/**
 * DELETE /api/outfits/:id
 * Delete a specific outfit.
 */
export async function deleteOutfitController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    const outfitId = getOutfitId(req);

    if (!outfitId) {
        res.status(400).json({
            success: false,
            message: "A valid outfit ID is required.",
        });
        return;
    }

    try {
        const result = await deleteOutfit(userId, outfitId);

        res.status(200).json({
            success: true,
            ...result,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}


import { generateOutfitRecommendations } from "./outfit-generation.service";
import {
    logOutfitWear,
    getOutfitHistory,
    deleteOutfitHistory,
} from "./outfit-history.service";

/**
 * POST /api/outfits/generate
 * Generate outfit recommendations from wardrobe items.
 */
export async function generateOutfitsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    try {
        const result = await generateOutfitRecommendations(userId, req.body);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}

/**
 * POST /api/outfits/history
 * Log an outfit wear event.
 */
export async function logOutfitWearController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    try {
        const result = await logOutfitWear(userId, req.body);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}

/**
 * GET /api/outfits/history
 * Get outfit history logs.
 */
export async function getOutfitHistoryController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    try {
        const result = await getOutfitHistory(userId, req.query);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}

/**
 * DELETE /api/outfits/history/:id
 * Delete an outfit history log.
 */
export async function deleteOutfitHistoryController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);

    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }

    const rawId = req.params.id;
    const historyId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;

    if (!historyId) {
        res.status(400).json({
            success: false,
            message: "History ID is required.",
        });
        return;
    }

    try {
        await deleteOutfitHistory(userId, historyId);
        res.status(200).json({
            success: true,
            message: "Outfit history deleted successfully.",
        });
    } catch (error) {
        handleOutfitError(error, res, next);
    }
}
