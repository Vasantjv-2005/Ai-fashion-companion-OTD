"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const ai_controller_1 = require("./ai.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authMiddleware);
// Conversations
router.post("/conversations", ai_controller_1.createConversationController);
router.get("/conversations", ai_controller_1.getConversationsController);
router.get("/conversations/:conversationId/messages", ai_controller_1.getMessagesController);
router.delete("/conversations/:conversationId", ai_controller_1.deleteConversationController);
// Chat & Stylist advice
router.post("/chat", ai_controller_1.sendMessageController);
// Outfit intelligence pipeline
router.post("/pipeline", ai_controller_1.runPipelineController);
exports.default = router;
