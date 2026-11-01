"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTryOnController = createTryOnController;
exports.getTryOnController = getTryOnController;
exports.listTryOnsController = listTryOnsController;
exports.deleteTryOnController = deleteTryOnController;
const virtual_try_on_service_1 = require("./virtual-try-on.service");
const virtual_try_on_validator_1 = require("./virtual-try-on.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleTryOnError(error, res, next) {
    if (error instanceof virtual_try_on_service_1.VirtualTryOnServiceError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function createTryOnController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    let parsedBody = req.body;
    if (typeof req.body.wardrobeItemIds === "string") {
        try {
            parsedBody = {
                ...req.body,
                wardrobeItemIds: JSON.parse(req.body.wardrobeItemIds),
            };
        }
        catch {
            // let validator catch it
        }
    }
    const validation = (0, virtual_try_on_validator_1.validateCreateTryOn)(parsedBody);
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
        const result = await (0, virtual_try_on_service_1.createTryOnSession)(userId, validation.data, req.file);
        res.status(201).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        handleTryOnError(error, res, next);
    }
}
async function getTryOnController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const tryOnId = req.params.id;
    if (!tryOnId) {
        res.status(400).json({ success: false, message: "Try-on ID is required." });
        return;
    }
    try {
        const result = await (0, virtual_try_on_service_1.getTryOnSession)(userId, tryOnId);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        handleTryOnError(error, res, next);
    }
}
async function listTryOnsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const result = await (0, virtual_try_on_service_1.getUserTryOns)(userId, req.query);
        res.status(200).json({
            success: true,
            data: result.items,
            pagination: result.pagination,
        });
    }
    catch (error) {
        handleTryOnError(error, res, next);
    }
}
async function deleteTryOnController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const tryOnId = req.params.id;
    if (!tryOnId) {
        res.status(400).json({ success: false, message: "Try-on ID is required." });
        return;
    }
    try {
        const result = await (0, virtual_try_on_service_1.deleteTryOnSession)(userId, tryOnId);
        res.status(200).json(result);
    }
    catch (error) {
        handleTryOnError(error, res, next);
    }
}
