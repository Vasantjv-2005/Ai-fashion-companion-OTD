"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWardrobeItemController = createWardrobeItemController;
exports.getWardrobeItemsController = getWardrobeItemsController;
exports.getWardrobeItemByIdController = getWardrobeItemByIdController;
exports.updateWardrobeItemController = updateWardrobeItemController;
exports.deleteWardrobeItemController = deleteWardrobeItemController;
const wardrobe_service_1 = require("./wardrobe.service");
const wardrobe_validator_1 = require("./wardrobe.validator");
function handleControllerError(error, res) {
    if (error instanceof wardrobe_service_1.WardrobeServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: "An unexpected error occurred while processing your wardrobe request.",
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
async function createWardrobeItemController(req, res, _next) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId)
        return;
    const validation = wardrobe_validator_1.createWardrobeItemSchema.safeParse(req.body);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    try {
        const item = await (0, wardrobe_service_1.createWardrobeItem)(userId, validation.data);
        res.status(201).json({
            success: true,
            message: "Wardrobe item created successfully.",
            data: item,
        });
    }
    catch (error) {
        handleControllerError(error, res);
    }
}
async function getWardrobeItemsController(req, res, _next) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId)
        return;
    const validation = wardrobe_validator_1.wardrobeListQuerySchema.safeParse(req.query);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe query parameters.",
            errors: validation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    try {
        const result = await (0, wardrobe_service_1.getWardrobeItems)(userId, validation.data);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleControllerError(error, res);
    }
}
async function getWardrobeItemByIdController(req, res, _next) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId)
        return;
    const validation = wardrobe_validator_1.wardrobeItemIdSchema.safeParse(req.params.id);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe item ID.",
        });
        return;
    }
    try {
        const item = await (0, wardrobe_service_1.getWardrobeItemById)(userId, validation.data);
        res.status(200).json({
            success: true,
            data: item,
        });
    }
    catch (error) {
        handleControllerError(error, res);
    }
}
async function updateWardrobeItemController(req, res, _next) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId)
        return;
    const idValidation = wardrobe_validator_1.wardrobeItemIdSchema.safeParse(req.params.id);
    if (!idValidation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe item ID.",
        });
        return;
    }
    const bodyValidation = wardrobe_validator_1.updateWardrobeItemSchema.safeParse(req.body);
    if (!bodyValidation.success) {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
            errors: bodyValidation.error.issues.map((issue) => ({
                field: issue.path.join("."),
                message: issue.message,
            })),
        });
        return;
    }
    try {
        const item = await (0, wardrobe_service_1.updateWardrobeItem)(userId, idValidation.data, bodyValidation.data);
        res.status(200).json({
            success: true,
            message: "Wardrobe item updated successfully.",
            data: item,
        });
    }
    catch (error) {
        handleControllerError(error, res);
    }
}
async function deleteWardrobeItemController(req, res, _next) {
    const userId = getAuthenticatedUserId(req, res);
    if (!userId)
        return;
    const validation = wardrobe_validator_1.wardrobeItemIdSchema.safeParse(req.params.id);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid wardrobe item ID.",
        });
        return;
    }
    try {
        await (0, wardrobe_service_1.deleteWardrobeItem)(userId, validation.data);
        res.status(200).json({
            success: true,
            message: "Wardrobe item deleted successfully.",
        });
    }
    catch (error) {
        handleControllerError(error, res);
    }
}
