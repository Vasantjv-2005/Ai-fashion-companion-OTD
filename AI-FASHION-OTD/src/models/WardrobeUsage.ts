
import mongoose, { Schema } from "mongoose";

export const WARDROBE_USAGE_OCCASIONS = [
    "daily",
    "work",
    "college",
    "party",
    "date",
    "wedding",
    "travel",
    "fitness",
    "special_event",
    "other",
] as const;

export interface WardrobeUsageDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    wardrobeItemId: mongoose.Types.ObjectId;
    outfitId?: mongoose.Types.ObjectId;
    eventId?: mongoose.Types.ObjectId;
    occasion: (typeof WARDROBE_USAGE_OCCASIONS)[number];
    usedAt: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const wardrobeUsageSchema = new Schema<WardrobeUsageDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        wardrobeItemId: {
            type: Schema.Types.ObjectId,
            ref: "WardrobeItem",
            required: true,
        },
        outfitId: {
            type: Schema.Types.ObjectId,
            ref: "Outfit",
        },
        eventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
        },
        occasion: {
            type: String,
            enum: WARDROBE_USAGE_OCCASIONS,
            default: "daily",
            required: true,
        },
        usedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
        },
    },
    {
        timestamps: true,
        collection: "wardrobe_usage",
        versionKey: false,
    },
);

// Find a user's clothing usage history.
wardrobeUsageSchema.index({
    userId: 1,
    usedAt: -1,
});

// Analyze how often an item is worn.
wardrobeUsageSchema.index({
    wardrobeItemId: 1,
    usedAt: -1,
});

// Retrieve clothing usage associated with an outfit.
wardrobeUsageSchema.index({
    outfitId: 1,
    usedAt: -1,
});

// Support usage analysis by occasion.
wardrobeUsageSchema.index({
    userId: 1,
    occasion: 1,
    usedAt: -1,
});

const WardrobeUsage =
    mongoose.models.WardrobeUsage ||
    mongoose.model<WardrobeUsageDocument>(
        "WardrobeUsage",
        wardrobeUsageSchema,
    );

export default WardrobeUsage;
