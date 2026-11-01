"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadWardrobeItemImageController = uploadWardrobeItemImageController;
exports.deleteWardrobeItemImageController = deleteWardrobeItemImageController;
const wardrobe_image_service_1 = require("./wardrobe-image.service");
function handleImageControllerError(error, res) {
    if (error instanceof wardrobe_image_service_1.WardrobeImageServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing the wardrobe image.",
    });
}
function getAuthenticatedUserId(req, res) {
    if (!req.user?.id) {
        res.status(401).json({
            success: false,
            message: "Authentication is required.",
        });
        return null;
    }
    return req.user.id;
}
function getWardrobeItemId(param) {
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
async function uploadWardrobeItemImageController(req, res, _next) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId)
        return;
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
        const result = await (0, wardrobe_image_service_1.uploadWardrobeItemImage)(userId, itemId, {
            filename: file.originalname,
            contentType: file.mimetype,
            buffer: file.buffer,
        });
        res.status(200).json({
            success: true,
            message: "Wardrobe image uploaded successfully.",
            data: result,
        });
    }
    catch (error) {
        handleImageControllerError(error, res);
    }
}
/**
 * DELETE /api/wardrobe/:id/image
 * Deletes the image attached to a wardrobe item.
 */
async function deleteWardrobeItemImageController(req, res, _next) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId)
        return;
    const itemId = getWardrobeItemId(req.params.id);
    if (!itemId) {
        res.status(400).json({
            success: false,
            message: "A valid wardrobe item ID is required.",
        });
        return;
    }
    try {
        await (0, wardrobe_image_service_1.deleteWardrobeItemImage)(userId, itemId);
        res.status(200).json({
            success: true,
            message: "Wardrobe image deleted successfully.",
        });
    }
    catch (error) {
        handleImageControllerError(error, res);
    }
}
