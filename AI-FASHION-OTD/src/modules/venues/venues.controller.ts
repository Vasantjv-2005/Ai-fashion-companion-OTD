import type { Request, Response, NextFunction } from "express";
import {
    createVenue,
    getVenues,
    getVenueById,
    getVenueIntelligence,
    VenueServiceError,
} from "./venues.service";
import {
    validateCreateVenue,
    validateVenueQuery,
    validateVenueIntelligenceQuery,
} from "./venues.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleVenueError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof VenueServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function createVenueController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateCreateVenue(req.body);
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
        const venue = await createVenue(userId, validation.data);
        res.status(201).json({ success: true, data: venue });
    } catch (error) {
        handleVenueError(error, res, next);
    }
}

export async function getVenuesController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const validation = validateVenueQuery(req.query);
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
        const result = await getVenues(validation.data);
        res.status(200).json({
            success: true,
            data: result.venues,
            pagination: result.pagination,
        });
    } catch (error) {
        handleVenueError(error, res, next);
    }
}

export async function getVenueByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const venueId = req.params.id as string;
    if (!venueId) {
        res.status(400).json({ success: false, message: "Venue ID is required." });
        return;
    }

    try {
        const venue = await getVenueById(venueId);
        res.status(200).json({ success: true, data: venue });
    } catch (error) {
        handleVenueError(error, res, next);
    }
}

export async function getVenueIntelligenceController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const venueId = req.params.id as string;
    if (!venueId) {
        res.status(400).json({ success: false, message: "Venue ID is required." });
        return;
    }

    const validation = validateVenueIntelligenceQuery(req.query);
    const occasion = validation.success ? validation.data.occasion : undefined;

    try {
        const intelligence = await getVenueIntelligence(userId, venueId, occasion);
        res.status(200).json({ success: true, data: intelligence });
    } catch (error) {
        handleVenueError(error, res, next);
    }
}

