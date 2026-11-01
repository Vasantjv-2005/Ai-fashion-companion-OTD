import mongoose, { Schema } from "mongoose";

const outfitPollVoteSchema = new Schema(
    {
        pollId: {
            type: Schema.Types.ObjectId,
            ref: "OutfitPoll",
            required: true,
        },

        optionId: {
            type: Schema.Types.ObjectId,
            ref: "OutfitPollOption",
            required: true,
        },

        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        votedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: "outfit_poll_votes",
        versionKey: false,
    },
);

// Prevent duplicate votes for the same option by the same user.
outfitPollVoteSchema.index(
    { pollId: 1, optionId: 1, userId: 1 },
    { unique: true },
);

// Efficiently retrieve votes for a poll.
outfitPollVoteSchema.index({ pollId: 1, votedAt: -1 });

export type OutfitPollVoteDocument =
    mongoose.InferSchemaType<typeof outfitPollVoteSchema>;

export const OutfitPollVote =
    (mongoose.models.OutfitPollVote as mongoose.Model<OutfitPollVoteDocument>) ||
    mongoose.model<OutfitPollVoteDocument>(
        "OutfitPollVote",
        outfitPollVoteSchema,
    );

export default OutfitPollVote;
