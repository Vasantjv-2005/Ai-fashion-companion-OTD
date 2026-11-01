import mongoose, { Schema } from "mongoose";

export const USER_VIBE_MOODS = [
    "casual",
    "confident",
    "elegant",
    "sporty",
    "minimalist",
    "streetwear",
    "romantic",
    "professional",
    "creative",
    "adventurous",
] as const;

export type UserVibeMood = (typeof USER_VIBE_MOODS)[number];

export const USER_VIBE_OCCASIONS = [
    "daily",
    "work",
    "college",
    "party",
    "date",
    "wedding",
    "travel",
    "fitness",
    "special_event",
] as const;

export type UserVibeOccasion = (typeof USER_VIBE_OCCASIONS)[number];

export interface UserVibeDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    mood: UserVibeMood;
    preferredStyles: string[];
    preferredColors: string[];
    preferredSeasons: string[];
    occasion?: UserVibeOccasion;
    notes?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userVibeSchema = new Schema<UserVibeDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        mood: {
            type: String,
            enum: USER_VIBE_MOODS,
            required: true,
        },
        preferredStyles: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        preferredColors: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        preferredSeasons: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        occasion: {
            type: String,
            enum: USER_VIBE_OCCASIONS,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: "user_vibes",
        versionKey: false,
    },
);

userVibeSchema.index({
    userId: 1,
    isActive: 1,
    updatedAt: -1,
});

export const UserVibe =
    mongoose.models.UserVibe ||
    mongoose.model<UserVibeDocument>("UserVibe", userVibeSchema);

export default UserVibe;
