import type { Request, Response, NextFunction } from "express";
import {
    shareOutfit,
    getSocialFeed,
    getShareById,
    toggleLikePost,
    addCommentToPost,
    getPostComments,
    deleteShare,
    SocialServiceError,
} from "./social.service";
import {
    validateShareOutfit,
    validateAddComment,
    validateSocialFeedQuery,
} from "./social.validator";

function getUserId(req: Request): string | null {
    const user = (req as Request & { user?: { id?: string; _id?: string } }).user;
    return user?.id ?? user?._id ?? null;
}

function handleSocialError(error: unknown, res: Response, next: NextFunction): void {
    if (error instanceof SocialServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}

export async function shareOutfitController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const validation = validateShareOutfit(req.body);
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
        const share = await shareOutfit(userId, validation.data);
        res.status(201).json({ success: true, data: share });
    } catch (error) {
        handleSocialError(error, res, next);
    }
}

export async function getSocialFeedController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req) || undefined;

    const validation = validateSocialFeedQuery(req.query);
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
        const result = await getSocialFeed(userId, validation.data);
        res.status(200).json({
            success: true,
            data: result.feed,
            pagination: result.pagination,
        });
    } catch (error) {
        handleSocialError(error, res, next);
    }
}

export async function getShareByIdController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req) || undefined;
    const shareId = req.params.id as string;

    if (!shareId) {
        res.status(400).json({ success: false, message: "Share ID is required." });
        return;
    }

    try {
        const share = await getShareById(shareId, userId);
        res.status(200).json({ success: true, data: share });
    } catch (error) {
        handleSocialError(error, res, next);
    }
}

export async function toggleLikePostController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const postId = req.params.id as string;
    if (!postId) {
        res.status(400).json({ success: false, message: "Post ID is required." });
        return;
    }

    try {
        const result = await toggleLikePost(userId, postId);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        handleSocialError(error, res, next);
    }
}

export async function addCommentController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const postId = req.params.id as string;
    if (!postId) {
        res.status(400).json({ success: false, message: "Post ID is required." });
        return;
    }

    const validation = validateAddComment(req.body);
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
        const comment = await addCommentToPost(userId, postId, validation.data);
        res.status(201).json({ success: true, data: comment });
    } catch (error) {
        handleSocialError(error, res, next);
    }
}

export async function getPostCommentsController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const postId = req.params.id as string;
    if (!postId) {
        res.status(400).json({ success: false, message: "Post ID is required." });
        return;
    }

    try {
        const comments = await getPostComments(postId);
        res.status(200).json({ success: true, data: comments });
    } catch (error) {
        handleSocialError(error, res, next);
    }
}

export async function deleteShareController(
    req: Request,
    res: Response,
    next: NextFunction,
): Promise<void> {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }

    const shareId = req.params.id as string;
    if (!shareId) {
        res.status(400).json({ success: false, message: "Share ID is required." });
        return;
    }

    try {
        const result = await deleteShare(userId, shareId);
        res.status(200).json(result);
    } catch (error) {
        handleSocialError(error, res, next);
    }
}

