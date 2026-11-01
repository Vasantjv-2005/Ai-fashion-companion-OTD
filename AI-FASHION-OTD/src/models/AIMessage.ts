import mongoose, { Schema } from "mongoose";

export const AI_MESSAGE_ROLES = [
    "user",
    "assistant",
    "system",
] as const;

export type AIMessageRole = (typeof AI_MESSAGE_ROLES)[number];

const aiMessageSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        conversationId: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        role: {
            type: String,
            enum: AI_MESSAGE_ROLES,
            required: true,
        },

        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 20000,
        },

        aiProvider: {
            type: String,
            trim: true,
            maxlength: 100,
            default: undefined,
        },

        modelName: {
            type: String,
            trim: true,
            maxlength: 100,
            default: undefined,
        },

        promptTokens: {
            type: Number,
            min: 0,
            default: undefined,
        },

        completionTokens: {
            type: Number,
            min: 0,
            default: undefined,
        },

        responseTimeMs: {
            type: Number,
            min: 0,
            default: undefined,
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: undefined,
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: "ai_messages",
        versionKey: false,
    },
);

aiMessageSchema.index({
    userId: 1,
    conversationId: 1,
    createdAt: 1,
});

export type AIMessageDocument =
    mongoose.InferSchemaType<typeof aiMessageSchema>;

export const AIMessage =
    (mongoose.models.AIMessage as mongoose.Model<AIMessageDocument>) ||
    mongoose.model<AIMessageDocument>(
        "AIMessage",
        aiMessageSchema,
    );

export default AIMessage;
