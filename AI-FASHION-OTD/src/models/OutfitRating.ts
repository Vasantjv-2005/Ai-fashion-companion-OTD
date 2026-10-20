import mongoose, { Schema } from "mongoose";

const outfitRatingSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        outfitId: {
            type: Schema.Types.ObjectId,
            ref: "Outfit",
            required: true,
            index: true,
        },

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
            validate: {
                validator: Number.isInteger,
                message: "Rating must be a whole number between 1 and 5.",
            },
        },

        feedback: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        occasion: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
            default: "casual",
        },

        wouldWearAgain: {
            type: Boolean,
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "outfit_ratings",
        versionKey: false,
    }
);

// One rating per user for each outfit.
outfitRatingSchema.index(
    { userId: 1, outfitId: 1 },
    { unique: true }
);

outfitRatingSchema.index({ outfitId: 1, createdAt: -1 });

export type OutfitRatingDocument =
    mongoose.InferSchemaType<typeof outfitRatingSchema>;

export const OutfitRating =
    (mongoose.models.OutfitRating as mongoose.Model<OutfitRatingDocument>) ||
    mongoose.model<OutfitRatingDocument>(
        "OutfitRating",
        outfitRatingSchema
    );

export default OutfitRating;
