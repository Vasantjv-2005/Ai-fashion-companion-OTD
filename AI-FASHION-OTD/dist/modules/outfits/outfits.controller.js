"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOutfitController = createOutfitController;
exports.getOutfitsController = getOutfitsController;
exports.getOutfitByIdController = getOutfitByIdController;
exports.updateOutfitController = updateOutfitController;
exports.deleteOutfitController = deleteOutfitController;
exports.generateOutfitsController = generateOutfitsController;
exports.logOutfitWearController = logOutfitWearController;
exports.getOutfitHistoryController = getOutfitHistoryController;
exports.deleteOutfitHistoryController = deleteOutfitHistoryController;
const outfits_service_1 = require("./outfits.service");
const outfits_validator_1 = require("./outfits.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function getOutfitId(req) {
    const id = req.params.id;
    return typeof id === "string" ? id : null;
}
function handleOutfitError(error, res, next) {
    if (error instanceof outfits_service_1.OutfitServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
/**
 * POST /api/outfits
 * Create a new outfit.
 */
async function createOutfitController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    const validation = (0, outfits_validator_1.validateCreateOutfit)(req.body);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid outfit data.",
            errors: validation.error.flatten(),
        });
        return;
    }
    try {
        const outfit = await (0, outfits_service_1.createOutfit)(userId, validation.data);
        res.status(201).json({
            success: true,
            message: "Outfit created successfully.",
            data: outfit,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
/**
 * GET /api/outfits
 * Get the authenticated user's outfits.
 */
async function getOutfitsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    const pageValue = req.query.page;
    const limitValue = req.query.limit;
    const page = pageValue === undefined ? 1 : Number(pageValue);
    const limit = limitValue === undefined ? 10 : Number(limitValue);
    if (!Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100) {
        res.status(400).json({
            success: false,
            message: "Page must be a positive integer and limit must be between 1 and 100.",
        });
        return;
    }
    const occasionValue = req.query.occasion;
    const statusValue = req.query.status;
    const allowedOccasions = [
        "casual",
        "work",
        "party",
        "wedding",
        "date",
        "travel",
        "gym",
        "formal",
        "other",
    ];
    const allowedStatuses = [
        "generated",
        "saved",
        "worn",
    ];
    if ((occasionValue !== undefined &&
        (typeof occasionValue !== "string" ||
            !allowedOccasions.includes(occasionValue))) ||
        (statusValue !== undefined &&
            (typeof statusValue !== "string" ||
                !allowedStatuses.includes(statusValue)))) {
        res.status(400).json({
            success: false,
            message: "Invalid occasion or outfit status filter.",
        });
        return;
    }
    try {
        const filters = {
            page,
            limit,
        };
        if (typeof occasionValue === "string") {
            filters.occasion =
                occasionValue;
        }
        if (typeof statusValue === "string") {
            filters.status =
                statusValue;
        }
        const result = await (0, outfits_service_1.getOutfits)(userId, filters);
        res.status(200).json({
            success: true,
            data: result.outfits,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
/**
 * GET /api/outfits/:id
 * Get a specific outfit.
 */
async function getOutfitByIdController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    const outfitId = getOutfitId(req);
    if (!outfitId) {
        res.status(400).json({
            success: false,
            message: "A valid outfit ID is required.",
        });
        return;
    }
    try {
        const outfit = await (0, outfits_service_1.getOutfitById)(userId, outfitId);
        res.status(200).json({
            success: true,
            data: outfit,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
/**
 * PATCH /api/outfits/:id
 * Update a specific outfit.
 */
async function updateOutfitController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    const outfitId = getOutfitId(req);
    if (!outfitId) {
        res.status(400).json({
            success: false,
            message: "A valid outfit ID is required.",
        });
        return;
    }
    const validation = (0, outfits_validator_1.validateUpdateOutfit)(req.body);
    if (!validation.success) {
        res.status(400).json({
            success: false,
            message: "Invalid outfit update data.",
            errors: validation.error.flatten(),
        });
        return;
    }
    try {
        const outfit = await (0, outfits_service_1.updateOutfit)(userId, outfitId, validation.data);
        res.status(200).json({
            success: true,
            message: "Outfit updated successfully.",
            data: outfit,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
/**
 * DELETE /api/outfits/:id
 * Delete a specific outfit.
 */
async function deleteOutfitController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    const outfitId = getOutfitId(req);
    if (!outfitId) {
        res.status(400).json({
            success: false,
            message: "A valid outfit ID is required.",
        });
        return;
    }
    try {
        const result = await (0, outfits_service_1.deleteOutfit)(userId, outfitId);
        res.status(200).json({
            success: true,
            ...result,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
const outfit_generation_service_1 = require("./outfit-generation.service");
const outfit_history_service_1 = require("./outfit-history.service");
/**
 * POST /api/outfits/generate
 * Generate outfit recommendations from wardrobe items.
 */
async function generateOutfitsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    try {
        const result = await (0, outfit_generation_service_1.generateOutfitRecommendations)(userId, req.body);
        res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
/**
 * POST /api/outfits/history
 * Log an outfit wear event.
 */
async function logOutfitWearController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    try {
        const result = await (0, outfit_history_service_1.logOutfitWear)(userId, req.body);
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
/**
 * GET /api/outfits/history
 * Get outfit history logs.
 */
async function getOutfitHistoryController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    try {
        const result = await (0, outfit_history_service_1.getOutfitHistory)(userId, req.query);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
/**
 * DELETE /api/outfits/history/:id
 * Delete an outfit history log.
 */
async function deleteOutfitHistoryController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({
            success: false,
            message: "Authentication required.",
        });
        return;
    }
    const rawId = req.params.id;
    const historyId = typeof rawId === "string" ? rawId : Array.isArray(rawId) ? rawId[0] : null;
    if (!historyId) {
        res.status(400).json({
            success: false,
            message: "History ID is required.",
        });
        return;
    }
    try {
        await (0, outfit_history_service_1.deleteOutfitHistory)(userId, historyId);
        res.status(200).json({
            success: true,
            message: "Outfit history deleted successfully.",
        });
    }
    catch (error) {
        handleOutfitError(error, res, next);
    }
}
