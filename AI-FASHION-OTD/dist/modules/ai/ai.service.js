"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIServiceError = void 0;
exports.createConversation = createConversation;
exports.getUserConversations = getUserConversations;
exports.getConversationMessages = getConversationMessages;
exports.sendChatMessage = sendChatMessage;
exports.deleteConversation = deleteConversation;
const mongoose_1 = __importDefault(require("mongoose"));
const AIConversation_1 = __importDefault(require("../../models/AIConversation"));
const WardrobeItem_1 = __importDefault(require("../../models/WardrobeItem"));
const ai_client_1 = require("../../integrations/ai/ai.client");
const ai_memory_service_1 = require("./ai-memory.service");
class AIServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AIServiceError";
    }
}
exports.AIServiceError = AIServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new AIServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function createConversation(userId, title) {
    const userObjectId = toObjectId(userId);
    const conversation = await AIConversation_1.default.create({
        userId: userObjectId,
        title: title?.trim() || "New stylist consultation",
        status: "active",
        lastMessageAt: new Date(),
    });
    return conversation.toObject();
}
async function getUserConversations(userId) {
    const userObjectId = toObjectId(userId);
    return AIConversation_1.default.find({
        userId: userObjectId,
        status: "active",
    })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();
}
async function getConversationMessages(userId, conversationId) {
    toObjectId(userId);
    return (0, ai_memory_service_1.getConversationHistory)(userId, conversationId);
}
async function sendChatMessage(userId, input) {
    const userObjectId = toObjectId(userId);
    let conversationId = input.conversationId;
    if (!conversationId) {
        const newConv = await createConversation(userId, input.content.slice(0, 40) + (input.content.length > 40 ? "..." : ""));
        conversationId = newConv._id.toString();
    }
    else {
        const conv = await AIConversation_1.default.findOne({
            _id: toObjectId(conversationId),
            userId: userObjectId,
        }).exec();
        if (!conv) {
            throw new AIServiceError("Conversation not found or access denied.", 404);
        }
    }
    // Save user message
    await (0, ai_memory_service_1.saveMessage)(userId, conversationId, "user", input.content, input.metadata);
    // Extract any style/color preferences
    await (0, ai_memory_service_1.extractAndStoreMemory)(userId, input.content);
    // Attempt AI response
    let assistantReply;
    let providerName = "heuristic";
    let modelName = "fashion-companion-v1";
    if (process.env.AI_SERVICE_URL) {
        try {
            const history = await (0, ai_memory_service_1.getConversationHistory)(userId, conversationId, 10);
            const aiResult = await (0, ai_client_1.aiRequest)("chat", {
                messages: history.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
            });
            assistantReply = aiResult.reply;
            providerName = "external-ai";
            if (aiResult.model)
                modelName = aiResult.model;
        }
        catch (error) {
            if (error instanceof ai_client_1.AIClientError && error.statusCode === 503) {
                assistantReply = "The external AI service is currently unconfigured or offline. Here is guidance based on your wardrobe: pair neutrals with a pop of complementary color for an effortless look.";
            }
            else {
                throw error;
            }
        }
    }
    else {
        // Honest fallback when AI_SERVICE_URL is not provided
        const wardrobeCount = await WardrobeItem_1.default.countDocuments({ userId: userObjectId }).exec();
        assistantReply = `I am your personal AI stylist. You currently have ${wardrobeCount} pieces in your wardrobe. For advice on specific outfits, you can request an outfit generation or tell me the occasion! (Note: External AI model provider is currently unconfigured, using local fashion heuristics).`;
    }
    const savedAssistantMsg = await (0, ai_memory_service_1.saveMessage)(userId, conversationId, "assistant", assistantReply, { provider: providerName, model: modelName });
    return {
        conversationId,
        message: savedAssistantMsg,
    };
}
async function deleteConversation(userId, conversationId) {
    const userObjectId = toObjectId(userId);
    const convObjectId = toObjectId(conversationId);
    const conv = await AIConversation_1.default.findOneAndUpdate({ _id: convObjectId, userId: userObjectId }, { $set: { status: "archived" } }).exec();
    if (!conv) {
        throw new AIServiceError("Conversation not found.", 404);
    }
    return { success: true, message: "Conversation archived." };
}
