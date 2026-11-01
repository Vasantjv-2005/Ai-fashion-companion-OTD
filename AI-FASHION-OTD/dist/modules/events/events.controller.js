"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventController = createEventController;
exports.getEventsController = getEventsController;
exports.getEventByIdController = getEventByIdController;
exports.updateEventController = updateEventController;
exports.deleteEventController = deleteEventController;
const events_service_1 = require("./events.service");
const events_validator_1 = require("./events.validator");
function getUserId(req) {
    const userId = req.user?.id;
    if (!userId) {
        throw new events_service_1.EventServiceError("Authentication is required.", 401);
    }
    return userId;
}
function handleControllerError(error, res, next) {
    if (error instanceof events_service_1.EventServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    if (error instanceof Error && error.name === "ZodError") {
        res.status(400).json({
            success: false,
            message: "Request validation failed.",
            errors: JSON.parse(JSON.stringify(error)).issues ?? [],
        });
        return;
    }
    next(error);
}
async function createEventController(req, res, next) {
    try {
        const userId = getUserId(req);
        const input = (0, events_validator_1.validateCreateEvent)(req.body);
        const event = await (0, events_service_1.createEvent)(userId, input);
        res.status(201).json({
            success: true,
            message: "Event created successfully.",
            data: event,
        });
    }
    catch (error) {
        handleControllerError(error, res, next);
    }
}
async function getEventsController(req, res, next) {
    try {
        const userId = getUserId(req);
        const options = (0, events_validator_1.validateEventListQuery)(req.query);
        const result = await (0, events_service_1.getEvents)(userId, options);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleControllerError(error, res, next);
    }
}
async function getEventByIdController(req, res, next) {
    try {
        const userId = getUserId(req);
        const eventId = (0, events_validator_1.validateEventId)(req.params.id);
        const event = await (0, events_service_1.getEventById)(userId, eventId);
        res.status(200).json({
            success: true,
            data: event,
        });
    }
    catch (error) {
        handleControllerError(error, res, next);
    }
}
async function updateEventController(req, res, next) {
    try {
        const userId = getUserId(req);
        const eventId = (0, events_validator_1.validateEventId)(req.params.id);
        const input = (0, events_validator_1.validateUpdateEvent)(req.body);
        const event = await (0, events_service_1.updateEvent)(userId, eventId, input);
        res.status(200).json({
            success: true,
            message: "Event updated successfully.",
            data: event,
        });
    }
    catch (error) {
        handleControllerError(error, res, next);
    }
}
async function deleteEventController(req, res, next) {
    try {
        const userId = getUserId(req);
        const eventId = (0, events_validator_1.validateEventId)(req.params.id);
        await (0, events_service_1.deleteEvent)(userId, eventId);
        res.status(200).json({
            success: true,
            message: "Event deleted successfully.",
        });
    }
    catch (error) {
        handleControllerError(error, res, next);
    }
}
