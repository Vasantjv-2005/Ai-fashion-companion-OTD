import mongoose, { Schema } from "mongoose";

const SHARE_RECIPIENT_STATUSES = [
    "pending",
    "accepted",
    "declined",
    "revoked",
] as const;

const shareRecipientSchema = new Schema(
    {
        shareId: {
            type: Schema.Types.ObjectId,
            ref: "OutfitShare",
            required: true,
            index: true,
        },

        senderId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        recipientId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        status: {
            type: String,
            enum: SHARE_RECIPIENT_STATUSES,
            default: "pending",
            required: true,
        },

        permission: {
            type: String,
            enum: ["view"],
            default: "view",
            required: true,
        },

        message: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        sentAt: {
            type: Date,
            default: Date.now,
            required: true,
        },

        respondedAt: {
            type: Date,
            default: undefined,
        },

        viewedAt: {
            type: Date,
            default: undefined,
        },

        expiresAt: {
            type: Date,
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "share_recipients",
        versionKey: false,
    }
);

// Prevent duplicate recipient records for the same share.
shareRecipientSchema.index(
    { shareId: 1, recipientId: 1 },
    { unique: true }
);

shareRecipientSchema.index({ recipientId: 1, status: 1 });

export type ShareRecipientDocument =
    mongoose.InferSchemaType<typeof shareRecipientSchema>;

export const ShareRecipient =
    (mongoose.models.ShareRecipient as mongoose.Model<ShareRecipientDocument>) ||
    mongoose.model<ShareRecipientDocument>(
        "ShareRecipient",
        shareRecipientSchema
    );

export default ShareRecipient;
