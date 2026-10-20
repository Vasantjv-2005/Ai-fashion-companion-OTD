
import mongoose, { Schema } from "mongoose";

export const VENUE_TYPES = [
    "restaurant",
    "cafe",
    "office",
    "college",
    "hotel",
    "wedding_hall",
    "party_hall",
    "outdoor",
    "shopping_mall",
    "other",
] as const;

export interface VenueDocument extends mongoose.Document {
    name: string;
    venueType: (typeof VENUE_TYPES)[number];
    description?: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    dressCode?: string;
    indoor: boolean;
    suitableOccasions: string[];
    imageUrl?: string;
    websiteUrl?: string;
    createdBy?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const venueSchema = new Schema<VenueDocument>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        venueType: {
            type: String,
            enum: VENUE_TYPES,
            default: "other",
            required: true,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        address: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        city: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        state: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        country: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        latitude: {
            type: Number,
            min: -90,
            max: 90,
        },
        longitude: {
            type: Number,
            min: -180,
            max: 180,
        },
        dressCode: {
            type: String,
            trim: true,
            maxlength: 200,
        },
        indoor: {
            type: Boolean,
            default: true,
        },
        suitableOccasions: {
            type: [
                {
                    type: String,
                    trim: true,
                    lowercase: true,
                },
            ],
            default: [],
        },
        imageUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
        },
        websiteUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
    },
    {
        timestamps: true,
        collection: "venues",
        versionKey: false,
    },
);

venueSchema.index({
    city: 1,
    venueType: 1,
    isActive: 1,
});

venueSchema.index({
    createdBy: 1,
    createdAt: -1,
});

const Venue =
    mongoose.models.Venue ||
    mongoose.model<VenueDocument>("Venue", venueSchema);

export default Venue;
