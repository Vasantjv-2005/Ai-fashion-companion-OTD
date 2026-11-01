"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVenueController = createVenueController;
exports.getVenuesController = getVenuesController;
exports.getVenueByIdController = getVenueByIdController;
exports.getVenueIntelligenceController = getVenueIntelligenceController;
const venues_service_1 = require("./venues.service");
const venues_validator_1 = require("./venues.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleVenueError(error, res, next) {
    if (error instanceof venues_service_1.VenueServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function createVenueController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, venues_validator_1.validateCreateVenue)(req.body);
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
        const venue = await (0, venues_service_1.createVenue)(userId, validation.data);
        res.status(201).json({ success: true, data: venue });
    }
    catch (error) {
        handleVenueError(error, res, next);
    }
}
async function getVenuesController(req, res, next) {
    const validation = (0, venues_validator_1.validateVenueQuery)(req.query);
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
        const result = await (0, venues_service_1.getVenues)(validation.data);
        res.status(200).json({
            success: true,
            data: result.venues,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleVenueError(error, res, next);
    }
}
async function getVenueByIdController(req, res, next) {
    const venueId = req.params.id;
    if (!venueId) {
        res.status(400).json({ success: false, message: "Venue ID is required." });
        return;
    }
    try {
        const venue = await (0, venues_service_1.getVenueById)(venueId);
        res.status(200).json({ success: true, data: venue });
    }
    catch (error) {
        handleVenueError(error, res, next);
    }
}
async function getVenueIntelligenceController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const venueId = req.params.id;
    if (!venueId) {
        res.status(400).json({ success: false, message: "Venue ID is required." });
        return;
    }
    const validation = (0, venues_validator_1.validateVenueIntelligenceQuery)(req.query);
    const occasion = validation.success ? validation.data.occasion : undefined;
    try {
        const intelligence = await (0, venues_service_1.getVenueIntelligence)(userId, venueId, occasion);
        res.status(200).json({ success: true, data: intelligence });
    }
    catch (error) {
        handleVenueError(error, res, next);
    }
}
