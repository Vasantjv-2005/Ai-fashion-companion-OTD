
import mongoose, { Schema } from "mongoose";

export const WARDROBE_GAP_STATUSES = [
    "identified",
    "recommended",
    "resolved",
    "dismissed",
] as const;

export const WARDROBE_GAP_PRIORITIES = [
    "low",
    "medium",
    "high",
] as const;

export interface WardrobeGapDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    category: string;
    title: string;
    description: string;
    reason: string;
    priority: (typeof WARDROBE_GAP_PRIORITIES)[number];
    status: (typeof WARDROBE_GAP_STATUSES)[number];
    suggestedColors: string[];
    suggestedStyles: string[];
    suggestedSeasons: string[];
    suggestedItemTypes: string[];
    relatedEventId?: mongoose.Types.ObjectId;
    relatedTrendId?: mongoose.Types.ObjectId;
    lastAnalyzedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const wardrobeGapSchema = new Schema<WardrobeGapDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            maxlength: 100,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        priority: {
            type: String,
            enum: WARDROBE_GAP_PRIORITIES,
            default: "medium",
            required: true,
        },
        status: {
            type: String,
            enum: WARDROBE_GAP_STATUSES,
            default: "identified",
            required: true,
        },
        suggestedColors: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        suggestedStyles: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        suggestedSeasons: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        suggestedItemTypes: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        relatedEventId: {
            type: Schema.Types.ObjectId,
            ref: "Event",
        },
        relatedTrendId: {
            type: Schema.Types.ObjectId,
            ref: "FashionTrend",
        },
        lastAnalyzedAt: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: "wardrobe_gaps",
        versionKey: false,
    },
);

// Retrieve wardrobe gaps for a user by status and priority.
wardrobeGapSchema.index({
    userId: 1,
    status: 1,
    priority: 1,
});

// Prevent duplicate active gaps for the same user and category.
wardrobeGapSchema.index(
    { userId: 1, category: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["identified", "recommended"] },
        },
    },
);

wardrobeGapSchema.index({
    userId: 1,
    lastAnalyzedAt: -1,
});

const WardrobeGap =
    mongoose.models.WardrobeGap ||
    mongoose.model<WardrobeGapDocument>(
        "WardrobeGap",
        wardrobeGapSchema,
    );

export default WardrobeGap;
