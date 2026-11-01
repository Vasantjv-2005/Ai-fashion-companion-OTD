import type { Request, Response, NextFunction } from "express";
import {
    getTrends,
    getTrendById,
    recordTrendInteraction,
    getPersonalizedTrends,
    TrendServiceError,
} from "./trends.service";
import {
    validateTrendQuery,
    validateInteractTrend,
} from "./trends.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleTrendError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof TrendServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function getTrendsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const validation = validateTrendQuery(req.query);
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
        const result = await getTrends(validation.data);
        res.status(200).json({
            success: true,
            data: result.trends,
            pagination: result.pagination,
        });
    } catch (error) {
        handleTrendError(error, res, next);
    }
}

export async function getTrendByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const trendId = req.params.id as string;
    if (!trendId) {
        res.status(400).json({ success: false, message: "Trend ID is required." });
        return;
    }

    try {
        const trend = await getTrendById(trendId);
        res.status(200).json({ success: true, data: trend });
    } catch (error) {
        handleTrendError(error, res, next);
    }
}

export async function interactTrendController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateInteractTrend(req.body);
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
        const interaction = await recordTrendInteraction(userId, validation.data);
        res.status(200).json({ success: true, data: interaction });
    } catch (error) {
        handleTrendError(error, res, next);
    }
}

export async function getPersonalizedTrendsController(
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
        const trends = await getPersonalizedTrends(userId);
        res.status(200).json({ success: true, data: trends });
    } catch (error) {
        handleTrendError(error, res, next);
    }
}

