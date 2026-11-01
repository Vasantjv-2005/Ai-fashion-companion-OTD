import mongoose, { Schema } from "mongoose";

const outfitPollOptionSchema = new Schema(
    {
        pollId: {
            type: Schema.Types.ObjectId,
            ref: "OutfitPoll",
            required: true,
        },

        outfitId: {
            type: Schema.Types.ObjectId,
            ref: "Outfit",
            default: undefined,
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

        label: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 150,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        imageFileId: {
            type: Schema.Types.ObjectId,
            default: undefined,
        },

        voteCount: {
            type: Number,
            min: 0,
            default: 0,
        },

        position: {
            type: Number,
            min: 0,
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: "outfit_poll_options",
        versionKey: false,
    },
);

outfitPollOptionSchema.index({ pollId: 1, position: 1 });
outfitPollOptionSchema.index({ pollId: 1, createdAt: 1 });

export type OutfitPollOptionDocument =
    mongoose.InferSchemaType<typeof outfitPollOptionSchema>;

export const OutfitPollOption =
    (mongoose.models.OutfitPollOption as mongoose.Model<OutfitPollOptionDocument>) ||
    mongoose.model<OutfitPollOptionDocument>(
        "OutfitPollOption",
        outfitPollOptionSchema,
    );

export default OutfitPollOption;
