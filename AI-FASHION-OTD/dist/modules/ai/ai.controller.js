"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConversationController = createConversationController;
exports.getConversationsController = getConversationsController;
exports.getMessagesController = getMessagesController;
exports.sendMessageController = sendMessageController;
exports.deleteConversationController = deleteConversationController;
exports.runPipelineController = runPipelineController;
const ai_service_1 = require("./ai.service");
const outfit_pipeline_service_1 = require("./outfit-pipeline.service");
const ai_validator_1 = require("./ai.validator");
function getUserId(req) {
    const user = req.user;
    return user?.id ?? user?._id ?? null;
}
function handleAIError(error, res, next) {
    if (error instanceof ai_service_1.AIServiceError || error instanceof outfit_pipeline_service_1.OutfitPipelineError) {
        res.status(error.statusCode).json({
            success: false,
            message: error.message,
        });
        return;
    }
    next(error);
}
async function createConversationController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const conversation = await (0, ai_service_1.createConversation)(userId, req.body.title);
        res.status(201).json({ success: true, data: conversation });
    }
    catch (error) {
        handleAIError(error, res, next);
    }
}
async function getConversationsController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    try {
        const conversations = await (0, ai_service_1.getUserConversations)(userId);
        res.status(200).json({ success: true, data: conversations });
    }
    catch (error) {
        handleAIError(error, res, next);
    }
}
async function getMessagesController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const conversationId = req.params.conversationId;
    if (!conversationId) {
        res.status(400).json({ success: false, message: "Conversation ID is required." });
        return;
    }
    try {
        const messages = await (0, ai_service_1.getConversationMessages)(userId, conversationId);
        res.status(200).json({ success: true, data: messages });
    }
    catch (error) {
        handleAIError(error, res, next);
    }
}
async function sendMessageController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, ai_validator_1.validateSendMessage)(req.body);
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
        const result = await (0, ai_service_1.sendChatMessage)(userId, validation.data);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        handleAIError(error, res, next);
    }
}
async function deleteConversationController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const conversationId = req.params.conversationId;
    if (!conversationId) {
        res.status(400).json({ success: false, message: "Conversation ID is required." });
        return;
    }
    try {
        const result = await (0, ai_service_1.deleteConversation)(userId, conversationId);
        res.status(200).json(result);
    }
    catch (error) {
        handleAIError(error, res, next);
    }
}
async function runPipelineController(req, res, next) {
    const userId = getUserId(req);
    if (!userId) {
        res.status(401).json({ success: false, message: "Authentication required." });
        return;
    }
    const validation = (0, ai_validator_1.validateOutfitPipeline)(req.body);
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
        const result = await (0, outfit_pipeline_service_1.runOutfitPipeline)(userId, validation.data);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        handleAIError(error, res, next);
    }
}
