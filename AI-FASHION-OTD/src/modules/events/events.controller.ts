
import type { Request, Response, NextFunction } from "express";
import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    EventServiceError,
} from "./events.service";
import {
    validateCreateEvent,
    validateUpdateEvent,
    validateEventId,
    validateEventListQuery,
} from "./events.validator";

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
    };
}

function getUserId(req: AuthenticatedRequest): string {
    const userId = req.user?.id;

    if (!userId) {
        throw new EventServiceError(
            "Authentication is required.",
            401
        );
    }

    return userId;
}

function handleControllerError(
    error: unknown,
    res: Response,
    next: NextFunction
): void {
    if (error instanceof EventServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }

    if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
            errors: JSON.parse(JSON.stringify(error)).issues ?? [],
        });
        return;
    }

    next(error);
}

export async function createEventController(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = getUserId(req);
        const input = validateCreateEvent(req.body);
        const event = await createEvent(userId, input);

        res.status(201).json({
            success: true,
            message: "Event created successfully.",
            data: event,
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}

export async function getEventsController(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = getUserId(req);
        const options = validateEventListQuery(req.query);
        const result = await getEvents(userId, options);

        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}

export async function getEventByIdController(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = getUserId(req);
        const eventId = validateEventId(req.params.id);
        const event = await getEventById(userId, eventId);

        res.status(200).json({
            success: true,
            data: event,
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}

export async function updateEventController(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = getUserId(req);
        const eventId = validateEventId(req.params.id);
        const input = validateUpdateEvent(req.body);
        const event = await updateEvent(userId, eventId, input);

        res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            data: event,
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}

export async function deleteEventController(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const userId = getUserId(req);
        const eventId = validateEventId(req.params.id);

        await deleteEvent(userId, eventId);

        res.status(200).json({
            success: true,
            message: "Event deleted successfully.",
        });
    } catch (error) {
        handleControllerError(error, res, next);
    }
}
