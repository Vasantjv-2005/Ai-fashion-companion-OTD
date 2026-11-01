import mongoose, { Schema, Document, Model } from "mongoose";

export const PROFILE_STYLES = [
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

export type ProfileStyle = (typeof PROFILE_STYLES)[number];

export const PROFILE_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
] as const;

export type ProfileSeason = (typeof PROFILE_SEASONS)[number];

export interface IProfile extends Document {
    userId: mongoose.Types.ObjectId;
    displayName?: string;
    bio?: string;
    avatarFileId?: mongoose.Types.ObjectId;
    preferredStyles: ProfileStyle[];
    preferredColors: string[];
    preferredSeasons: ProfileSeason[];
    preferredCategories: string[];
    bodyType?: string;
    heightCm?: number;
    fashionGoals: string[];
    isProfileComplete: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProfileSchema = new Schema<IProfile>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
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
    },
);

export type ProfileDocument = IProfile;

export const Profile: Model<IProfile> =
    mongoose.models.Profile ||
    mongoose.model<IProfile>("Profile", ProfileSchema);

export default Profile;
