import mongoose, { Schema } from "mongoose";

const USER_PREFERENCE_STYLES = [
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

const USER_PREFERENCE_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
] as const;

const USER_PREFERENCE_CATEGORIES = [
    "tops",
    "bottoms",
    "dresses",
    "outerwear",
    "shoes",
    "accessories",
    "activewear",
    "ethnic-wear",
    "other",
] as const;

const userPreferenceSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true,
        },

        preferredStyles: {
            type: [
                {
                    type: String,
                    enum: USER_PREFERENCE_STYLES,
                },
            ],
            default: ["casual"],
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
                    enum: USER_PREFERENCE_SEASONS,
                },
            ],
            default: ["all-season"],
        },

        preferredCategories: {
            type: [
                {
                    type: String,
                    enum: USER_PREFERENCE_CATEGORIES,
                },
            ],
            default: [],
        },

        excludedColors: {
            type: [
                {
                    type: String,
                    trim: true,
                    maxlength: 50,
                },
            ],
            default: [],
        },

        budgetMin: {
            type: Number,
            min: 0,
            default: 0,
        },

        budgetMax: {
            type: Number,
            min: 0,
            default: undefined,
        },

        preferredFit: {
            type: String,
            enum: ["slim", "regular", "relaxed", "oversized", "no-preference"],
            default: "no-preference",
        },

        recommendationSettings: {
            useWeather: {
                type: Boolean,
                default: true,
            },
            considerOccasion: {
                type: Boolean,
                default: true,
            },
            avoidRecentOutfits: {
                type: Boolean,
                default: true,
            },
        },
    },
    {
        timestamps: true,
        collection: "user_preferences",
        versionKey: false,
    }
);

userPreferenceSchema.index({ userId: 1 }, { unique: true });

export type UserPreferenceDocument = mongoose.InferSchemaType<
    typeof userPreferenceSchema
>;

export const UserPreference =
    (mongoose.models.UserPreference as mongoose.Model<UserPreferenceDocument>) ||
    mongoose.model<UserPreferenceDocument>(
        "UserPreference",
        userPreferenceSchema
    );

export default UserPreference;
