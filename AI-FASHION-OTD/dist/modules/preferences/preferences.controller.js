"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreferencesController = getPreferencesController;
exports.updatePreferencesController = updatePreferencesController;
exports.resetPreferencesController = resetPreferencesController;
const preferences_service_1 = require("./preferences.service");
const preferences_validator_1 = require("./preferences.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handlePreferenceError(error, res, next) {
    if (error instanceof preferences_service_1.PreferenceServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function getPreferencesController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const preferences = await (0, preferences_service_1.getPreferences)(userId);
        res.status(200).json({ success: true, data: preferences });
    }
    catch (error) {
        handlePreferenceError(error, res, next);
    }
}
async function updatePreferencesController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, preferences_validator_1.validateUpdatePreferences)(req.body);
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
        const preferences = await (0, preferences_service_1.updatePreferences)(userId, validation.data);
        res.status(200).json({ success: true, data: preferences });
    }
    catch (error) {
        handlePreferenceError(error, res, next);
    }
}
async function resetPreferencesController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const preferences = await (0, preferences_service_1.resetPreferences)(userId);
        res.status(200).json({
            success: true,
            data: preferences,
            message: "Preferences reset to default values.",
        });
    }
    catch (error) {
        handlePreferenceError(error, res, next);
    }
}
