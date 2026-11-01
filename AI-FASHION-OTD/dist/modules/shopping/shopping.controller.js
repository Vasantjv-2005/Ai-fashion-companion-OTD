"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRecommendationController = createRecommendationController;
exports.getRecommendationsController = getRecommendationsController;
exports.updateRecommendationStatusController = updateRecommendationStatusController;
exports.generateGapShoppingListController = generateGapShoppingListController;
exports.deleteRecommendationController = deleteRecommendationController;
const shopping_service_1 = require("./shopping.service");
const shopping_validator_1 = require("./shopping.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleShoppingError(error, res, next) {
    if (error instanceof shopping_service_1.ShoppingServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function createRecommendationController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, shopping_validator_1.validateCreateRecommendation)(req.body);
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
        const item = await (0, shopping_service_1.createRecommendation)(userId, validation.data);
        res.status(201).json({ success: true, data: item });
    }
    catch (error) {
        handleShoppingError(error, res, next);
    }
}
async function getRecommendationsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, shopping_validator_1.validateShoppingQuery)(req.query);
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
        const result = await (0, shopping_service_1.getRecommendations)(userId, validation.data);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleShoppingError(error, res, next);
    }
}
async function updateRecommendationStatusController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const recId = req.params.id;
    if (!recId) {
        res.status(400).json({ success: false, message: "Recommendation ID is required." });
        return;
    }
    const validation = (0, shopping_validator_1.validateUpdateRecommendationStatus)(req.body);
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
        const updated = await (0, shopping_service_1.updateRecommendationStatus)(userId, recId, validation.data.status);
        res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        handleShoppingError(error, res, next);
    }
}
async function generateGapShoppingListController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const list = await (0, shopping_service_1.generateGapShoppingList)(userId);
        res.status(200).json({ success: true, data: list });
    }
    catch (error) {
        handleShoppingError(error, res, next);
    }
}
async function deleteRecommendationController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const recId = req.params.id;
    if (!recId) {
        res.status(400).json({ success: false, message: "Recommendation ID is required." });
        return;
    }
    try {
        const result = await (0, shopping_service_1.deleteRecommendation)(userId, recId);
        res.status(200).json(result);
    }
    catch (error) {
        handleShoppingError(error, res, next);
    }
}
