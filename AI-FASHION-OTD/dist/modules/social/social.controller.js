"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shareOutfitController = shareOutfitController;
exports.getSocialFeedController = getSocialFeedController;
exports.getShareByIdController = getShareByIdController;
exports.toggleLikePostController = toggleLikePostController;
exports.addCommentController = addCommentController;
exports.getPostCommentsController = getPostCommentsController;
exports.deleteShareController = deleteShareController;
const social_service_1 = require("./social.service");
const social_validator_1 = require("./social.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleSocialError(error, res, next) {
    if (error instanceof social_service_1.SocialServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function shareOutfitController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, social_validator_1.validateShareOutfit)(req.body);
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
        const share = await (0, social_service_1.shareOutfit)(userId, validation.data);
        res.status(201).json({ success: true, data: share });
    }
    catch (error) {
        handleSocialError(error, res, next);
    }
}
async function getSocialFeedController(req, res, next) {
    const userId = getUserId(req) || undefined;
    const validation = (0, social_validator_1.validateSocialFeedQuery)(req.query);
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
        const result = await (0, social_service_1.getSocialFeed)(userId, validation.data);
        res.status(200).json({
            success: true,
            data: result.feed,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleSocialError(error, res, next);
    }
}
async function getShareByIdController(req, res, next) {
    const userId = getUserId(req) || undefined;
    const shareId = req.params.id;
    if (!shareId) {
        res.status(400).json({ success: false, message: "Share ID is required." });
        return;
    }
    try {
        const share = await (0, social_service_1.getShareById)(shareId, userId);
        res.status(200).json({ success: true, data: share });
    }
    catch (error) {
        handleSocialError(error, res, next);
    }
}
async function toggleLikePostController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const postId = req.params.id;
    if (!postId) {
        res.status(400).json({ success: false, message: "Post ID is required." });
        return;
    }
    try {
        const result = await (0, social_service_1.toggleLikePost)(userId, postId);
        res.status(200).json({ success: true, ...result });
    }
    catch (error) {
        handleSocialError(error, res, next);
    }
}
async function addCommentController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const postId = req.params.id;
    if (!postId) {
        res.status(400).json({ success: false, message: "Post ID is required." });
        return;
    }
    const validation = (0, social_validator_1.validateAddComment)(req.body);
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
        const comment = await (0, social_service_1.addCommentToPost)(userId, postId, validation.data);
        res.status(201).json({ success: true, data: comment });
    }
    catch (error) {
        handleSocialError(error, res, next);
    }
}
async function getPostCommentsController(req, res, next) {
    const postId = req.params.id;
    if (!postId) {
        res.status(400).json({ success: false, message: "Post ID is required." });
        return;
    }
    try {
        const comments = await (0, social_service_1.getPostComments)(postId);
        res.status(200).json({ success: true, data: comments });
    }
    catch (error) {
        handleSocialError(error, res, next);
    }
}
async function deleteShareController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const shareId = req.params.id;
    if (!shareId) {
        res.status(400).json({ success: false, message: "Share ID is required." });
        return;
    }
    try {
        const result = await (0, social_service_1.deleteShare)(userId, shareId);
        res.status(200).json(result);
    }
    catch (error) {
        handleSocialError(error, res, next);
    }
}
