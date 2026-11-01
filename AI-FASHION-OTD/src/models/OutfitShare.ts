import mongoose, { Schema } from "mongoose";

export const OUTFIT_SHARE_VISIBILITY = [
    "private",
    "followers",
    "public",
] as const;

export type OutfitShareVisibility = (typeof OUTFIT_SHARE_VISIBILITY)[number];

const outfitShareSchema = new Schema(
    {
        outfitId: {
            type: Schema.Types.ObjectId,
            ref: "Outfit",
            required: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            trim: true,
            maxlength: 150,
            default: "",
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        visibility: {
            type: String,
            enum: OUTFIT_SHARE_VISIBILITY,
            default: "private",
            required: true,
        },

        shareToken: {
            type: String,
            unique: true,
            sparse: true,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        expiresAt: {
            type: Date,
            default: undefined,
        },

        viewCount: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: "outfit_shares",
        versionKey: false,
    },
);

outfitShareSchema.index({ userId: 1, createdAt: -1 });
outfitShareSchema.index({ outfitId: 1, isActive: 1 });

export type OutfitShareDocument =
    mongoose.InferSchemaType<typeof outfitShareSchema>;

export const OutfitShare =
    (mongoose.models.OutfitShare as mongoose.Model<OutfitShareDocument>) ||
    mongoose.model<OutfitShareDocument>(
        "OutfitShare",
        outfitShareSchema,
    );

export default OutfitShare;
