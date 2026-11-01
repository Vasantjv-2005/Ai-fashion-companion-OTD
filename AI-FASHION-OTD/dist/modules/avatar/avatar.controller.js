"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAvatarController = getAvatarController;
exports.createOrUpdateAvatarController = createOrUpdateAvatarController;
exports.uploadAvatarImageController = uploadAvatarImageController;
exports.deleteAvatarController = deleteAvatarController;
const avatar_service_1 = require("./avatar.service");
const avatar_validator_1 = require("./avatar.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleAvatarError(error, res, next) {
    if (error instanceof avatar_service_1.AvatarServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function getAvatarController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const avatar = await (0, avatar_service_1.getAvatar)(userId);
        res.status(200).json({ success: true, data: avatar });
    }
    catch (error) {
        handleAvatarError(error, res, next);
    }
}
async function createOrUpdateAvatarController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, avatar_validator_1.validateCreateAvatar)(req.body);
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
        const avatar = await (0, avatar_service_1.createOrUpdateAvatar)(userId, validation.data);
        res.status(200).json({ success: true, data: avatar });
    }
    catch (error) {
        handleAvatarError(error, res, next);
    }
}
async function uploadAvatarImageController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const avatar = await (0, avatar_service_1.uploadAvatarImage)(userId, req.file);
        res.status(200).json({ success: true, data: avatar });
    }
    catch (error) {
        handleAvatarError(error, res, next);
    }
}
async function deleteAvatarController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const result = await (0, avatar_service_1.deleteAvatar)(userId);
        res.status(200).json(result);
    }
    catch (error) {
        handleAvatarError(error, res, next);
    }
}
