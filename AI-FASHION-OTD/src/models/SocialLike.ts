
import mongoose, { Schema } from "mongoose";

export interface SocialLikeDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    postId?: mongoose.Types.ObjectId;
    commentId?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const socialLikeSchema = new Schema<SocialLikeDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        postId: {
            type: Schema.Types.ObjectId,
            ref: "OutfitShare",
            default: undefined,
        },
        commentId: {
            type: Schema.Types.ObjectId,
            ref: "SocialComment",
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "social_likes",
        versionKey: false,
    },
);

// A like must belong to either a post or a comment, but not both.
socialLikeSchema.pre("validate", function () {
    const hasPost = Boolean(this.postId);
    const hasComment = Boolean(this.commentId);

    if (hasPost === hasComment) {
        this.invalidate(
            "postId",
            "A like must belong to exactly one post or comment.",
        );
    }
});

// Prevent duplicate likes on the same post.
socialLikeSchema.index(
    { userId: 1, postId: 1 },
    {
        unique: true,
        partialFilterExpression: { postId: { $type: "objectId" } },
    },
);

// Prevent duplicate likes on the same comment.
socialLikeSchema.index(
    { userId: 1, commentId: 1 },
    {
        unique: true,
        partialFilterExpression: { commentId: { $type: "objectId" } },
    },
);

socialLikeSchema.index({ postId: 1, createdAt: -1 });
socialLikeSchema.index({ commentId: 1, createdAt: -1 });

const SocialLike =
    mongoose.models.SocialLike ||
    mongoose.model<SocialLikeDocument>("SocialLike", socialLikeSchema);

export default SocialLike;
