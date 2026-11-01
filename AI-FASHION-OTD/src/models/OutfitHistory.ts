import mongoose, { Schema } from "mongoose";

const outfitHistorySchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        outfitId: {
            type: Schema.Types.ObjectId,
            ref: "Outfit",
            default: undefined,
        },

        outfitName: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },

        wardrobeItemIds: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "WardrobeItem",
                },
            ],
            default: [],
        },

        occasion: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
            default: "casual",
        },

        wornAt: {
            type: Date,
            required: true,
            default: Date.now,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: undefined,
        },

        feedback: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
    },
    {
        timestamps: true,
        collection: "outfit_histories",
        versionKey: false,
    },
);

outfitHistorySchema.index({ userId: 1, wornAt: -1 });
outfitHistorySchema.index({ userId: 1, outfitId: 1 });

export type OutfitHistoryDocument =
    mongoose.InferSchemaType<typeof outfitHistorySchema>;

export const OutfitHistory =
    (mongoose.models.OutfitHistory as mongoose.Model<OutfitHistoryDocument>) ||
    mongoose.model<OutfitHistoryDocument>(
        "OutfitHistory",
        outfitHistorySchema,
    );

export default OutfitHistory;
