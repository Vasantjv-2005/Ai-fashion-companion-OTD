import type { Request, Response, NextFunction } from "express";
import {
    createConversation,
    getUserConversations,
    getConversationMessages,
    sendChatMessage,
    deleteConversation,
    AIServiceError,
} from "./ai.service";
import { runOutfitPipeline, OutfitPipelineError } from "./outfit-pipeline.service";
import { validateSendMessage, validateOutfitPipeline } from "./ai.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleAIError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof AIServiceError || error instanceof OutfitPipelineError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function createConversationController(
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
        const conversation = await createConversation(userId, req.body.title);
        res.status(201).json({ success: true, data: conversation });
    } catch (error) {
        handleAIError(error, res, next);
    }
}

export async function getConversationsController(
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
        const conversations = await getUserConversations(userId);
        res.status(200).json({ success: true, data: conversations });
    } catch (error) {
        handleAIError(error, res, next);
    }
}

export async function getMessagesController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const conversationId = req.params.conversationId as string;
    if (!conversationId) {
        res.status(400).json({ success: false, message: "Conversation ID is required." });
        return;
    }

    try {
        const messages = await getConversationMessages(userId, conversationId);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        handleAIError(error, res, next);
    }
}

export async function sendMessageController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateSendMessage(req.body);
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
        const result = await sendChatMessage(userId, validation.data);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        handleAIError(error, res, next);
    }
}

export async function deleteConversationController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const conversationId = req.params.conversationId as string;
    if (!conversationId) {
        res.status(400).json({ success: false, message: "Conversation ID is required." });
        return;
    }

    try {
        const result = await deleteConversation(userId, conversationId);
        res.status(200).json(result);
    } catch (error) {
        handleAIError(error, res, next);
    }
}

export async function runPipelineController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateOutfitPipeline(req.body);
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
        const result = await runOutfitPipeline(userId, validation.data);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        handleAIError(error, res, next);
    }
}

