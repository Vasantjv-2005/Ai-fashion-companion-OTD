
import mongoose, { Schema } from "mongoose";

export const SHOPPING_RECOMMENDATION_STATUSES = [
    "suggested",
    "viewed",
    "saved",
    "purchased",
    "dismissed",
] as const;

export const SHOPPING_RECOMMENDATION_SOURCES = [
    "ai",
    "wardrobe_gap",
    "fashion_trend",
    "manual",
] as const;

export interface ShoppingRecommendationDocument
    extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    productName: string;
    brand?: string;
    description?: string;
    category: string;
    color?: string;
    style?: string;
    season?: string;
    productUrl: string;
    imageUrl?: string;
    price?: number;
    currency: string;
    source: (typeof SHOPPING_RECOMMENDATION_SOURCES)[number];
    status: (typeof SHOPPING_RECOMMENDATION_STATUSES)[number];
    recommendationReason?: string;
    relatedWardrobeItemIds: mongoose.Types.ObjectId[];
    relatedTrendId?: mongoose.Types.ObjectId;
    rating?: number;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const shoppingRecommendationSchema =
    new Schema<ShoppingRecommendationDocument>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
                index: true,
            },
            productName: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200,
            },
            brand: {
                type: String,
                trim: true,
                maxlength: 100,
            },
            description: {
                type: String,
                trim: true,
                maxlength: 2000,
            },
            category: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
                maxlength: 100,
            },
            color: {
                type: String,
                trim: true,
                lowercase: true,
            },
            style: {
                type: String,
                trim: true,
                lowercase: true,
            },
            season: {
                type: String,
                trim: true,
                lowercase: true,
            },
            productUrl: {
                type: String,
                required: true,
                trim: true,
                maxlength: 2048,
            },
            imageUrl: {
                type: String,
                trim: true,
                maxlength: 2048,
            },
            price: {
                type: Number,
                min: 0,
            },
            currency: {
                type: String,
                default: "INR",
                uppercase: true,
                trim: true,
                minlength: 3,
                maxlength: 3,
            },
            source: {
                type: String,
                enum: SHOPPING_RECOMMENDATION_SOURCES,
                default: "ai",
                required: true,
            },
            status: {
                type: String,
                enum: SHOPPING_RECOMMENDATION_STATUSES,
                default: "suggested",
                required: true,
            },
            recommendationReason: {
                type: String,
                trim: true,
                maxlength: 1000,
            },
            relatedWardrobeItemIds: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "WardrobeItem",
                },
            ],
            relatedTrendId: {
                type: Schema.Types.ObjectId,
                ref: "FashionTrend",
            },
            rating: {
                type: Number,
                min: 1,
                max: 5,
            },
            expiresAt: {
                type: Date,
            },
        },
        {
            timestamps: true,
            collection: "shopping_recommendations",
            versionKey: false,
        },
    );

shoppingRecommendationSchema.index({
    userId: 1,
    status: 1,
    createdAt: -1,
});

shoppingRecommendationSchema.index({
    userId: 1,
    category: 1,
});

shoppingRecommendationSchema.index({
    expiresAt: 1,
});

const ShoppingRecommendation =
    mongoose.models.ShoppingRecommendation ||
    mongoose.model<ShoppingRecommendationDocument>(
        "ShoppingRecommendation",
        shoppingRecommendationSchema,
    );

export default ShoppingRecommendation;
