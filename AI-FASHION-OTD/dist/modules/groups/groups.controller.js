"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGroupEventController = createGroupEventController;
exports.getGroupEventsController = getGroupEventsController;
exports.getGroupEventByIdController = getGroupEventByIdController;
exports.updateGroupEventController = updateGroupEventController;
exports.updateRsvpController = updateRsvpController;
exports.createPollController = createPollController;
exports.getPollByIdController = getPollByIdController;
exports.voteOnPollController = voteOnPollController;
const groups_service_1 = require("./groups.service");
const groups_validator_1 = require("./groups.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleGroupError(error, res, next) {
    if (error instanceof groups_service_1.GroupServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
// Events
async function createGroupEventController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, groups_validator_1.validateCreateGroupEvent)(req.body);
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
        const event = await (0, groups_service_1.createGroupEvent)(userId, validation.data);
        res.status(201).json({ success: true, data: event });
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
async function getGroupEventsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const result = await (0, groups_service_1.getGroupEvents)(userId, req.query);
        res.status(200).json({
            success: true,
            data: result.events,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
async function getGroupEventByIdController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const eventId = req.params.id;
    if (!eventId) {
        res.status(400).json({ success: false, message: "Event ID is required." });
        return;
    }
    try {
        const event = await (0, groups_service_1.getGroupEventById)(userId, eventId);
        res.status(200).json({ success: true, data: event });
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
async function updateGroupEventController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const eventId = req.params.id;
    if (!eventId) {
        res.status(400).json({ success: false, message: "Event ID is required." });
        return;
    }
    const validation = (0, groups_validator_1.validateUpdateGroupEvent)(req.body);
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
        const event = await (0, groups_service_1.updateGroupEvent)(userId, eventId, validation.data);
        res.status(200).json({ success: true, data: event });
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
async function updateRsvpController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const eventId = req.params.id;
    if (!eventId) {
        res.status(400).json({ success: false, message: "Event ID is required." });
        return;
    }
    const validation = (0, groups_validator_1.validateRsvp)(req.body);
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
        const result = await (0, groups_service_1.updateMemberRsvp)(userId, eventId, validation.data.rsvp);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
// Polls
async function createPollController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, groups_validator_1.validateCreatePoll)(req.body);
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
        const poll = await (0, groups_service_1.createPoll)(userId, validation.data);
        res.status(201).json({ success: true, data: poll });
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
async function getPollByIdController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const pollId = req.params.pollId;
    if (!pollId) {
        res.status(400).json({ success: false, message: "Poll ID is required." });
        return;
    }
    try {
        const poll = await (0, groups_service_1.getPollById)(userId, pollId);
        res.status(200).json({ success: true, data: poll });
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
async function voteOnPollController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const pollId = req.params.pollId;
    if (!pollId) {
        res.status(400).json({ success: false, message: "Poll ID is required." });
        return;
    }
    const validation = (0, groups_validator_1.validateVotePoll)(req.body);
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
        const result = await (0, groups_service_1.voteOnPoll)(userId, pollId, validation.data.optionId);
        res.status(200).json(result);
    }
    catch (error) {
        handleGroupError(error, res, next);
    }
}
