"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyProfile = getMyProfile;
exports.createMyProfile = createMyProfile;
exports.updateMyProfile = updateMyProfile;
const profile_service_1 = require("./profile.service");
const profile_validator_1 = require("./profile.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
/**
 * Handles profile service errors consistently.
 * This also handles errors across module boundaries
 * where instanceof might not work as expected.
 */
function handleProfileError(error, res, next) {
    if (error instanceof Error &&
        error.name === "ProfileServiceError" &&
        "statusCode" in error &&
        typeof error.statusCode === "number") {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function getMyProfile(req, res, next) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const profile = await (0, profile_service_1.getProfile)(userId);
        res.status(200).json({
            success: true,
            message: "Profile retrieved successfully.",
            data: profile,
        });
    }
    catch (error) {
        handleProfileError(error, res, next);
    }
}
async function createMyProfile(req, res, next) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const validation = (0, profile_validator_1.validateUpdateProfile)(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid profile data.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
            return;
        }
        const profile = await (0, profile_service_1.createProfile)(userId, validation.data);
        res.status(201).json({
            success: true,
            message: "Profile created successfully.",
            data: profile,
        });
    }
    catch (error) {
        handleProfileError(error, res, next);
    }
}
async function updateMyProfile(req, res, next) {
    try {
        const userId = getUserId(req);
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Authentication required.",
            });
            return;
        }
        const validation = (0, profile_validator_1.validateUpdateProfile)(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                message: "Invalid profile data.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
            return;
        }
        const profile = await (0, profile_service_1.updateProfile)(userId, validation.data);
        res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: profile,
        });
    }
    catch (error) {
        handleProfileError(error, res, next);
    }
}
