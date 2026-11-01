import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware";
import {
    createConversationController,
    getConversationsController,
    getMessagesController,
    sendMessageController,
    deleteConversationController,
    runPipelineController,
} from "./ai.controller";

const router = Router();

router.use(authMiddleware);

// Conversations
router.post("/conversations", createConversationController);
router.get("/conversations", getConversationsController);
router.get("/conversations/:conversationId/messages", getMessagesController);
router.delete("/conversations/:conversationId", deleteConversationController);

// Chat & Stylist advice
router.post("/chat", sendMessageController);

// Outfit intelligence pipeline
router.post("/pipeline", runPipelineController);

export default router;

