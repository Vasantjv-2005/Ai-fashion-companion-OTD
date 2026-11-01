import mongoose, { Schema } from "mongoose";

const AVATAR_SOURCES = [
    "upload",
    "generated",
    "preset",
] as const;

export type AvatarSource = (typeof AVATAR_SOURCES)[number];

const avatarSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        imageFileId: {
            type: Schema.Types.ObjectId,
            default: undefined,
        },

        imageUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
            default: undefined,
        },

        source: {
            type: String,
            enum: AVATAR_SOURCES,
            default: "upload",
            required: true,
        },

        displayName: {
            type: String,
            trim: true,
            maxlength: 100,
            default: "",
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: undefined,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: "avatars",
        versionKey: false,
    },
);

export type AvatarDocument = mongoose.InferSchemaType<typeof avatarSchema>;

export const Avatar =
    (mongoose.models.Avatar as mongoose.Model<AvatarDocument>) ||
    mongoose.model<AvatarDocument>("Avatar", avatarSchema);

export default Avatar;
