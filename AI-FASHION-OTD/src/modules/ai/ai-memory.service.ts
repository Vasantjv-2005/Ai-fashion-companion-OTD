import mongoose from "mongoose";
import AIConversation from "../../models/AIConversation";
import AIMessage from "../../models/AIMessage";
import UserPreference from "../../models/UserPreference";

export class AIMemoryServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "AIMemoryServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new AIMemoryServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function getConversationHistory(
    userId: string,
    conversationId: string,
    limit = 20,
) {
    const userObjectId = toObjectId(userId);

    const messages = await AIMessage.find({
        userId: userObjectId,
        conversationId,
        isDeleted: false,
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean()
        .exec();

    return messages.reverse();
}

export async function saveMessage(
    userId: string,
    conversationId: string,
    role: "user" | "assistant" | "system",
    content: string,
    metadata?: Record<string, unknown>,
) {
    const userObjectId = toObjectId(userId);

    const message = await AIMessage.create({
        userId: userObjectId,
        conversationId,
        role,
        content: content.trim(),
        metadata,
    });

    // Update conversation timestamp
    await AIConversation.findOneAndUpdate(
        { _id: toObjectId(conversationId), userId: userObjectId },
        { $set: { lastMessageAt: new Date() } },
    ).exec();

    return message.toObject();
}

export async function extractAndStoreMemory(
    userId: string,
    userMessage: string,
) {
    const userObjectId = toObjectId(userId);
    const text = userMessage.toLowerCase();

    const knownStyles = [
        "casual",
        "formal",
        "smart-casual",
        "streetwear",
        "sporty",
        "traditional",
        "party",
        "minimalist",
    ];

    const detectedStyles = knownStyles.filter((style) =>
        text.includes(style) || (style === "formal" && text.includes("business")),
    );

    const knownColors = [
        "black",
        "white",
        "blue",
        "red",
        "green",
        "grey",
        "beige",
        "navy",
        "yellow",
        "pink",
        "brown",
    ];

    const detectedColors = knownColors.filter((color) => text.includes(color));

    if (detectedStyles.length > 0 || detectedColors.length > 0) {
        const updateOps: Record<string, unknown> = {};
        if (detectedStyles.length > 0) {
            updateOps.$addToSet = {
                preferredStyles: { $each: detectedStyles },
            };
        }
        if (detectedColors.length > 0) {
            if (!updateOps.$addToSet) updateOps.$addToSet = {};
            (updateOps.$addToSet as Record<string, unknown>).preferredColors = {
                $each: detectedColors,
            };
        }

        await UserPreference.findOneAndUpdate(
            { userId: userObjectId },
            updateOps,
            { upsert: true },
        ).exec();
    }

    return {
        detectedStyles,
        detectedColors,
    };
}

