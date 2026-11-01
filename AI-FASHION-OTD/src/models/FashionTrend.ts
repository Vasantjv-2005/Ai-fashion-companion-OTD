import mongoose, { Schema } from "mongoose";

export const FASHION_TREND_CATEGORIES = [
    "clothing",
    "colors",
    "footwear",
    "accessories",
    "hairstyles",
    "patterns",
    "fabrics",
    "styling",
    "other",
] as const;

export type FashionTrendCategory = (typeof FASHION_TREND_CATEGORIES)[number];

const fashionTrendSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 150,
        },

        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
            maxlength: 180,
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },

        category: {
            type: String,
            enum: FASHION_TREND_CATEGORIES,
            required: true,
        },

        season: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 50,
            default: "all-season",
        },

        year: {
            type: Number,
            min: 2000,
            max: 2100,
            default: () => new Date().getFullYear(),
        },

        colors: {
            type: [String],
            default: [],
        },

        tags: {
            type: [String],
            default: [],
        },

        imageUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
            default: undefined,
        },

        sourceName: {
            type: String,
            trim: true,
            maxlength: 150,
            default: undefined,
        },

        sourceUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
            default: undefined,
        },

        popularityScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0,
        },

        startsAt: {
            type: Date,
            default: undefined,
        },

        endsAt: {
            type: Date,
            default: undefined,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: "fashion_trends",
        versionKey: false,
    },
);

fashionTrendSchema.index({ category: 1, isActive: 1 });
fashionTrendSchema.index({ year: -1, popularityScore: -1 });

export type FashionTrendDocument =
    mongoose.InferSchemaType<typeof fashionTrendSchema>;

export const FashionTrend =
    (mongoose.models.FashionTrend as mongoose.Model<FashionTrendDocument>) ||
    mongoose.model<FashionTrendDocument>(
        "FashionTrend",
        fashionTrendSchema,
    );

export default FashionTrend;
