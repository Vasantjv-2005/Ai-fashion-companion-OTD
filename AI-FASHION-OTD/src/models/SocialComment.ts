
import mongoose, { Schema } from "mongoose";

export interface SocialCommentDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    postId: mongoose.Types.ObjectId;
    parentCommentId?: mongoose.Types.ObjectId;
    content: string;
    likes: mongoose.Types.ObjectId[];
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const socialCommentSchema = new Schema<SocialCommentDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        postId: {
            type: Schema.Types.ObjectId,
            ref: "OutfitShare",
            required: true,
            index: true,
        },
        parentCommentId: {
            type: Schema.Types.ObjectId,
            ref: "SocialComment",
            default: undefined,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 1,
            maxlength: 2000,
        },
        likes: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        isEdited: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: "social_comments",
        versionKey: false,
    },
);

socialCommentSchema.index({
    postId: 1,
    createdAt: -1,
});

socialCommentSchema.index({
    parentCommentId: 1,
    createdAt: 1,
});

socialCommentSchema.index({
    userId: 1,
    createdAt: -1,
});

const SocialComment =
    mongoose.models.SocialComment ||
    mongoose.model<SocialCommentDocument>(
        "SocialComment",
        socialCommentSchema,
    );

export default SocialComment;
