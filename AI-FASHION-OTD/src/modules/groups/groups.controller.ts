import type { Request, Response, NextFunction } from "express";
import {
    createGroupEvent,
    getGroupEvents,
    getGroupEventById,
    updateGroupEvent,
    updateMemberRsvp,
    createPoll,
    getPollById,
    voteOnPoll,
    GroupServiceError,
} from "./groups.service";
import {
    validateCreateGroupEvent,
    validateUpdateGroupEvent,
    validateRsvp,
    validateCreatePoll,
    validateVotePoll,
} from "./groups.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleGroupError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof GroupServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

// Events
export async function createGroupEventController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateCreateGroupEvent(req.body);
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
        const event = await createGroupEvent(userId, validation.data);
        res.status(201).json({ success: true, data: event });
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

export async function getGroupEventsController(
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
        const result = await getGroupEvents(userId, req.query);
        res.status(200).json({
            success: true,
            data: result.events,
            pagination: result.pagination,
        });
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

export async function getGroupEventByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const eventId = req.params.id as string;
    if (!eventId) {
        res.status(400).json({ success: false, message: "Event ID is required." });
        return;
    }

    try {
        const event = await getGroupEventById(userId, eventId);
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

export async function updateGroupEventController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const eventId = req.params.id as string;
    if (!eventId) {
        res.status(400).json({ success: false, message: "Event ID is required." });
        return;
    }

    const validation = validateUpdateGroupEvent(req.body);
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
        const event = await updateGroupEvent(userId, eventId, validation.data);
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

export async function updateRsvpController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const eventId = req.params.id as string;
    if (!eventId) {
        res.status(400).json({ success: false, message: "Event ID is required." });
        return;
    }

    const validation = validateRsvp(req.body);
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
        const result = await updateMemberRsvp(userId, eventId, validation.data.rsvp);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

// Polls
export async function createPollController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateCreatePoll(req.body);
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
        const poll = await createPoll(userId, validation.data);
        res.status(201).json({ success: true, data: poll });
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

export async function getPollByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const pollId = req.params.pollId as string;
    if (!pollId) {
        res.status(400).json({ success: false, message: "Poll ID is required." });
        return;
    }

    try {
        const poll = await getPollById(userId, pollId);
        res.status(200).json({ success: true, data: poll });
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

export async function voteOnPollController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const pollId = req.params.pollId as string;
    if (!pollId) {
        res.status(400).json({ success: false, message: "Poll ID is required." });
        return;
    }

    const validation = validateVotePoll(req.body);
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
        const result = await voteOnPoll(userId, pollId, validation.data.optionId);
        res.status(200).json(result);
    } catch (error) {
        handleGroupError(error, res, next);
    }
}

