import mongoose, { Schema } from "mongoose";

const PROFILE_STYLES = [
    "casual",
    "formal",
    "smart-casual",
    "streetwear",
    "sporty",
    "traditional",
    "party",
    "minimalist",
    "other",
] as const;

const PROFILE_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
] as const;

const profileSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        displayName: {
            type: String,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        bio: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        avatarFileId: {
            type: Schema.Types.ObjectId,
            default: undefined,
        },

        preferredStyles: {
            type: [
                {
                    type: String,
                    enum: PROFILE_STYLES,
                },
            ],
            default: [],
        },

        preferredColors: {
            type: [
                {
                    type: String,
                    trim: true,
                    maxlength: 50,
                },
            ],
            default: [],
        },

        preferredSeasons: {
            type: [
                {
                    type: String,
                    enum: PROFILE_SEASONS,
                },
            ],
            default: [],
        },

        preferredCategories: {
            type: [String],
            default: [],
        },

        bodyType: {
            type: String,
            trim: true,
            maxlength: 50,
            default: undefined,
        },

        heightCm: {
            type: Number,
            min: 50,
            max: 300,
            default: undefined,
        },

        fashionGoals: {
            type: [String],
            default: [],
        },

        isProfileComplete: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
        collection: "profiles",
        versionKey: false,
    }
);

profileSchema.index({ userId: 1 }, { unique: true });

export type ProfileDocument = mongoose.InferSchemaType<
    typeof profileSchema
>;

export const Profile =
    (mongoose.models.Profile as mongoose.Model<ProfileDocument>) ||
    mongoose.model<ProfileDocument>("Profile", profileSchema);

export default Profile;
