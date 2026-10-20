
import mongoose, { Schema } from "mongoose";

export const VENUE_INTELLIGENCE_TYPES = [
    "dress_code",
    "weather",
    "occasion",
    "style_recommendation",
    "cultural_guidelines",
    "general",
] as const;

export interface VenueIntelligenceDocument
    extends mongoose.Document {
    venueId?: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    venueName: string;
    venueType?: string;
    occasion?: string;
    dressCode?: string;
    recommendedStyles: string[];
    recommendedColors: string[];
    recommendedClothing: string[];
    weatherSummary?: string;
    temperatureCelsius?: number;
    indoor?: boolean;
    intelligenceType:
    (typeof VENUE_INTELLIGENCE_TYPES)[number];
    summary: string;
    recommendations: string[];
    source?: string;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const venueIntelligenceSchema =
    new Schema<VenueIntelligenceDocument>(
        {
            venueId: {
                type: Schema.Types.ObjectId,
                ref: "Venue",
            },
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
                index: true,
            },
            venueName: {
                type: String,
                required: true,
                trim: true,
                maxlength: 200,
            },
            venueType: {
                type: String,
                trim: true,
                maxlength: 100,
            },
            occasion: {
                type: String,
                trim: true,
                maxlength: 100,
            },
            dressCode: {
                type: String,
                trim: true,
                maxlength: 200,
            },
            recommendedStyles: {
                type: [
                    {
                        type: String,
                        trim: true,
                        lowercase: true,
                    },
                ],
                default: [],
            },
            recommendedColors: {
                type: [
                    {
                        type: String,
                        trim: true,
                        lowercase: true,
                    },
                ],
                default: [],
            },
            recommendedClothing: {
                type: [
                    {
                        type: String,
                        trim: true,
                    },
                ],
                default: [],
            },
            weatherSummary: {
                type: String,
                trim: true,
                maxlength: 500,
            },
            temperatureCelsius: {
                type: Number,
                min: -100,
                max: 100,
            },
            indoor: {
                type: Boolean,
            },
            intelligenceType: {
                type: String,
                enum: VENUE_INTELLIGENCE_TYPES,
                default: "general",
                required: true,
            },
            summary: {
                type: String,
                required: true,
                trim: true,
                maxlength: 3000,
            },
            recommendations: {
                type: [
                    {
                        type: String,
                        trim: true,
                        maxlength: 500,
                    },
                ],
                default: [],
            },
            source: {
                type: String,
                trim: true,
                maxlength: 500,
            },
            expiresAt: {
                type: Date,
            },
        },
        {
            timestamps: true,
            collection: "venue_intelligence",
            versionKey: false,
        },
    );

venueIntelligenceSchema.index({
    userId: 1,
    createdAt: -1,
});

venueIntelligenceSchema.index({
    venueId: 1,
    intelligenceType: 1,
});

venueIntelligenceSchema.index({
    expiresAt: 1,
});

const VenueIntelligence =
    mongoose.models.VenueIntelligence ||
    mongoose.model<VenueIntelligenceDocument>(
        "VenueIntelligence",
        venueIntelligenceSchema,
    );

export default VenueIntelligence;
