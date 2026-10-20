
import mongoose, { Schema } from "mongoose";

export const USER_TREND_INTERACTION_TYPES = [
    "view",
    "like",
    "save",
    "share",
    "dismiss",
    "click",
] as const;

export interface UserTrendInteractionDocument
    extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    trendId: mongoose.Types.ObjectId;
    interactionType:
    (typeof USER_TREND_INTERACTION_TYPES)[number];
    interactedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const userTrendInteractionSchema =
    new Schema<UserTrendInteractionDocument>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
            trendId: {
                type: Schema.Types.ObjectId,
                ref: "FashionTrend",
                required: true,
            },
            interactionType: {
                type: String,
                enum: USER_TREND_INTERACTION_TYPES,
                required: true,
            },
            interactedAt: {
                type: Date,
                default: Date.now,
                required: true,
            },
        },
        {
            timestamps: true,
            collection: "user_trend_interactions",
            versionKey: false,
        },
    );

// Efficiently retrieve a user's interactions with fashion trends.
userTrendInteractionSchema.index({
    userId: 1,
    interactedAt: -1,
});

// Find interactions for a specific trend.
userTrendInteractionSchema.index({
    trendId: 1,
    interactionType: 1,
});

// Support personalized trend recommendations.
userTrendInteractionSchema.index({
    userId: 1,
    trendId: 1,
    interactionType: 1,
});

const UserTrendInteraction =
    mongoose.models.UserTrendInteraction ||
    mongoose.model<UserTrendInteractionDocument>(
        "UserTrendInteraction",
        userTrendInteractionSchema,
    );

export default UserTrendInteraction;
