import mongoose from "mongoose";
import AIConversation from "../../models/AIConversation";
import AIMessage from "../../models/AIMessage";
import WardrobeItem from "../../models/WardrobeItem";
import { aiRequest, AIClientError } from "../../integrations/ai/ai.client";
import {
    extractAndStoreMemory,
    getConversationHistory,
    saveMessage,
} from "./ai-memory.service";
import type { SendMessageDto, StylistAdviceDto } from "./ai.validator";
import type { StylistAdviceResponse } from "./ai.types";

export class AIServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "AIServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new AIServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function createConversation(userId: string, title?: string) {
    const userObjectId = toObjectId(userId);

    const conversation = await AIConversation.create({
        userId: userObjectId,
        title: title?.trim() || "New stylist consultation",
        status: "active",
        lastMessageAt: new Date(),
    });

    return conversation.toObject();
}

export async function getUserConversations(userId: string) {
    const userObjectId = toObjectId(userId);

    return AIConversation.find({
        userId: userObjectId,
        status: "active",
    })
        .sort({ updatedAt: -1 })
        .lean()
        .exec();
}

export async function getConversationMessages(userId: string, conversationId: string) {
    toObjectId(userId);
    return getConversationHistory(userId, conversationId);
}

export async function sendChatMessage(userId: string, input: SendMessageDto) {
    const userObjectId = toObjectId(userId);

    let conversationId = input.conversationId;

    if (!conversationId) {
        const newConv = await createConversation(
            userId,
            input.content.slice(0, 40) + (input.content.length > 40 ? "..." : ""),
        );
        conversationId = newConv._id.toString();
    } else {
        const conv = await AIConversation.findOne({
            _id: toObjectId(conversationId),
            userId: userObjectId,
        }).exec();

        if (!conv) {
            throw new AIServiceError("Conversation not found or access denied.", 404);
        }
    }

    // Save user message
    await saveMessage(userId, conversationId, "user", input.content, input.metadata);

    // Extract any style/color preferences
    await extractAndStoreMemory(userId, input.content);

    // Attempt AI response
    let assistantReply: string;
    let providerName = "heuristic";
    let modelName = "fashion-companion-v1";

    if (process.env.AI_SERVICE_URL) {
        try {
            const history = await getConversationHistory(userId, conversationId, 10);
            const aiResult = await aiRequest<{ reply: string; model?: string }>(
                "chat",
                {
                    messages: history.map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                },
            );
            assistantReply = aiResult.reply;
            providerName = "external-ai";
            if (aiResult.model) modelName = aiResult.model;
        } catch (error) {
            if (error instanceof AIClientError && error.statusCode === 503) {
                assistantReply = "The external AI service is currently unconfigured or offline. Here is guidance based on your wardrobe: pair neutrals with a pop of complementary color for an effortless look.";
            } else {
                throw error;
            }
        }
    } else {
        // Honest fallback when AI_SERVICE_URL is not provided
        const wardrobeCount = await WardrobeItem.countDocuments({ userId: userObjectId }).exec();
        assistantReply = `I am your personal AI stylist. You currently have ${wardrobeCount} pieces in your wardrobe. For advice on specific outfits, you can request an outfit generation or tell me the occasion! (Note: External AI model provider is currently unconfigured, using local fashion heuristics).`;
    }

    const savedAssistantMsg = await saveMessage(
        userId,
        conversationId,
        "assistant",
        assistantReply,
        { provider: providerName, model: modelName },
    );

    return {
        conversationId,
        message: savedAssistantMsg,
    };
}

export async function deleteConversation(userId: string, conversationId: string) {
    const userObjectId = toObjectId(userId);
    const convObjectId = toObjectId(conversationId);

    const conv = await AIConversation.findOneAndUpdate(
        { _id: convObjectId, userId: userObjectId },
        { $set: { status: "archived" } },
    ).exec();

    if (!conv) {
        throw new AIServiceError("Conversation not found.", 404);
    }

    return { success: true, message: "Conversation archived." };
}
