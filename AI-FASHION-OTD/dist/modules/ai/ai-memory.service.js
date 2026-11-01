"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIMemoryServiceError = void 0;
exports.getConversationHistory = getConversationHistory;
exports.saveMessage = saveMessage;
exports.extractAndStoreMemory = extractAndStoreMemory;
const mongoose_1 = __importDefault(require("mongoose"));
const AIConversation_1 = __importDefault(require("../../models/AIConversation"));
const AIMessage_1 = __importDefault(require("../../models/AIMessage"));
const UserPreference_1 = __importDefault(require("../../models/UserPreference"));
class AIMemoryServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AIMemoryServiceError";
    }
}
exports.AIMemoryServiceError = AIMemoryServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new AIMemoryServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function getConversationHistory(userId, conversationId, limit = 20) {
    const userObjectId = toObjectId(userId);
    const messages = await AIMessage_1.default.find({
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
async function saveMessage(userId, conversationId, role, content, metadata) {
    const userObjectId = toObjectId(userId);
    const message = await AIMessage_1.default.create({
        userId: userObjectId,
        conversationId,
        role,
        content: content.trim(),
        metadata,
    });
    // Update conversation timestamp
    await AIConversation_1.default.findOneAndUpdate({ _id: toObjectId(conversationId), userId: userObjectId }, { $set: { lastMessageAt: new Date() } }).exec();
    return message.toObject();
}
async function extractAndStoreMemory(userId, userMessage) {
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
    const detectedStyles = knownStyles.filter((style) => text.includes(style) || (style === "formal" && text.includes("business")));
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
        const updateOps = {};
        if (detectedStyles.length > 0) {
            updateOps.$addToSet = {
                preferredStyles: { $each: detectedStyles },
            };
        }
        if (detectedColors.length > 0) {
            if (!updateOps.$addToSet)
                updateOps.$addToSet = {};
            updateOps.$addToSet.preferredColors = {
                $each: detectedColors,
            };
        }
        await UserPreference_1.default.findOneAndUpdate({ userId: userObjectId }, updateOps, { upsert: true }).exec();
    }
    return {
        detectedStyles,
        detectedColors,
    };
}
