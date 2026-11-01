"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAnalyticsController = getAnalyticsController;
exports.analyzeGapsController = analyzeGapsController;
exports.getGapsController = getGapsController;
exports.updateGapStatusController = updateGapStatusController;
exports.logUsageController = logUsageController;
exports.getItemStatsController = getItemStatsController;
const wardrobe_intelligence_service_1 = require("./wardrobe-intelligence.service");
const wardrobe_intelligence_validator_1 = require("./wardrobe-intelligence.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleIntelligenceError(error, res, next) {
    if (error instanceof wardrobe_intelligence_service_1.WardrobeIntelligenceServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function getAnalyticsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const analytics = await (0, wardrobe_intelligence_service_1.getWardrobeAnalytics)(userId);
        res.status(200).json({ success: true, data: analytics });
    }
    catch (error) {
        handleIntelligenceError(error, res, next);
    }
}
async function analyzeGapsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const gaps = await (0, wardrobe_intelligence_service_1.analyzeWardrobeGaps)(userId);
        res.status(200).json({ success: true, data: gaps });
    }
    catch (error) {
        handleIntelligenceError(error, res, next);
    }
}
async function getGapsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, wardrobe_intelligence_validator_1.validateGapQuery)(req.query);
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
        const gaps = await (0, wardrobe_intelligence_service_1.getWardrobeGaps)(userId, validation.data);
        res.status(200).json({ success: true, data: gaps });
    }
    catch (error) {
        handleIntelligenceError(error, res, next);
    }
}
async function updateGapStatusController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const gapId = req.params.id;
    if (!gapId) {
        res.status(400).json({ success: false, message: "Gap ID is required." });
        return;
    }
    const validation = (0, wardrobe_intelligence_validator_1.validateUpdateGapStatus)(req.body);
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
        const gap = await (0, wardrobe_intelligence_service_1.updateGapStatus)(userId, gapId, validation.data.status);
        res.status(200).json({ success: true, data: gap });
    }
    catch (error) {
        handleIntelligenceError(error, res, next);
    }
}
async function logUsageController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, wardrobe_intelligence_validator_1.validateLogUsage)(req.body);
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
        const usage = await (0, wardrobe_intelligence_service_1.logWardrobeUsage)(userId, validation.data);
        res.status(201).json({ success: true, data: usage });
    }
    catch (error) {
        handleIntelligenceError(error, res, next);
    }
}
async function getItemStatsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const itemId = req.params.itemId;
    if (!itemId) {
        res.status(400).json({ success: false, message: "Item ID is required." });
        return;
    }
    try {
        const stats = await (0, wardrobe_intelligence_service_1.getItemUsageStats)(userId, itemId);
        res.status(200).json({ success: true, data: stats });
    }
    catch (error) {
        handleIntelligenceError(error, res, next);
    }
}
