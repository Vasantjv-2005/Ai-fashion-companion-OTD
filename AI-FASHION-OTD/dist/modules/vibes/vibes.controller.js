"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserVibeController = setUserVibeController;
exports.getActiveVibeController = getActiveVibeController;
exports.getUserVibesController = getUserVibesController;
exports.getPresetVibesController = getPresetVibesController;
exports.deleteVibeController = deleteVibeController;
const vibes_service_1 = require("./vibes.service");
const vibes_validator_1 = require("./vibes.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleVibeError(error, res, next) {
    if (error instanceof vibes_service_1.VibeServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function setUserVibeController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, vibes_validator_1.validateCreateVibe)(req.body);
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
        const vibe = await (0, vibes_service_1.setUserVibe)(userId, validation.data);
        res.status(201).json({ success: true, data: vibe });
    }
    catch (error) {
        handleVibeError(error, res, next);
    }
}
async function getActiveVibeController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const vibe = await (0, vibes_service_1.getActiveVibe)(userId);
        res.status(200).json({ success: true, data: vibe });
    }
    catch (error) {
        handleVibeError(error, res, next);
    }
}
async function getUserVibesController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const vibes = await (0, vibes_service_1.getUserVibes)(userId);
        res.status(200).json({ success: true, data: vibes });
    }
    catch (error) {
        handleVibeError(error, res, next);
    }
}
function getPresetVibesController(_req, res) {
    const presets = (0, vibes_service_1.getPresetVibes)();
    res.status(200).json({ success: true, data: presets });
}
async function deleteVibeController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const vibeId = req.params.id;
    if (!vibeId) {
        res.status(400).json({ success: false, message: "Vibe ID is required." });
        return;
    }
    try {
        const result = await (0, vibes_service_1.deleteVibe)(userId, vibeId);
        res.status(200).json(result);
    }
    catch (error) {
        handleVibeError(error, res, next);
    }
}
