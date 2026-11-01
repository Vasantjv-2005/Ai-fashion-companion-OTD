"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTrendsController = getTrendsController;
exports.getTrendByIdController = getTrendByIdController;
exports.interactTrendController = interactTrendController;
exports.getPersonalizedTrendsController = getPersonalizedTrendsController;
const trends_service_1 = require("./trends.service");
const trends_validator_1 = require("./trends.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleTrendError(error, res, next) {
    if (error instanceof trends_service_1.TrendServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function getTrendsController(req, res, next) {
    const validation = (0, trends_validator_1.validateTrendQuery)(req.query);
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
        const result = await (0, trends_service_1.getTrends)(validation.data);
        res.status(200).json({
            success: true,
            data: result.trends,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleTrendError(error, res, next);
    }
}
async function getTrendByIdController(req, res, next) {
    const trendId = req.params.id;
    if (!trendId) {
        res.status(400).json({ success: false, message: "Trend ID is required." });
        return;
    }
    try {
        const trend = await (0, trends_service_1.getTrendById)(trendId);
        res.status(200).json({ success: true, data: trend });
    }
    catch (error) {
        handleTrendError(error, res, next);
    }
}
async function interactTrendController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, trends_validator_1.validateInteractTrend)(req.body);
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
        const interaction = await (0, trends_service_1.recordTrendInteraction)(userId, validation.data);
        res.status(200).json({ success: true, data: interaction });
    }
    catch (error) {
        handleTrendError(error, res, next);
    }
}
async function getPersonalizedTrendsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const trends = await (0, trends_service_1.getPersonalizedTrends)(userId);
        res.status(200).json({ success: true, data: trends });
    }
    catch (error) {
        handleTrendError(error, res, next);
    }
}
