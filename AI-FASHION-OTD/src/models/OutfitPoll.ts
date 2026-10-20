import mongoose, { Schema } from "mongoose";

const OUTFIT_POLL_VISIBILITY = [
    "private",
    "followers",
    "public",
] as const;

const outfitPollSchema = new Schema(
    {
        creatorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        visibility: {
            type: String,
            enum: OUTFIT_POLL_VISIBILITY,
            default: "private",
            required: true,
        },

        allowMultipleVotes: {
            type: Boolean,
            default: false,
        },

        endsAt: {
            type: Date,
            default: undefined,
        },

        isClosed: {
            type: Boolean,
            default: false,
            index: true,
        },

        closedAt: {
            type: Date,
            default: undefined,
        },

        totalVotes: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: "outfit_polls",
        versionKey: false,
    }
);

outfitPollSchema.index({ creatorId: 1, createdAt: -1 });
outfitPollSchema.index({ isClosed: 1, endsAt: 1 });

export type OutfitPollDocument =
    mongoose.InferSchemaType<typeof outfitPollSchema>;

export const OutfitPoll =
    (mongoose.models.OutfitPoll as mongoose.Model<OutfitPollDocument>) ||
    mongoose.model<OutfitPollDocument>(
        "OutfitPoll",
        outfitPollSchema
    );

export default OutfitPoll;
