import mongoose, { Schema } from "mongoose";

export const OUTFIT_STYLES = [
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

export type OutfitStyle = (typeof OUTFIT_STYLES)[number];

export const OUTFIT_SEASONS = [
    "spring",
    "summer",
    "autumn",
    "winter",
    "all-season",
] as const;

export type OutfitSeason = (typeof OUTFIT_SEASONS)[number];

const outfitSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        wardrobeItemIds: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "WardrobeItem",
                },
            ],
            required: true,
            validate: {
                validator: (items: mongoose.Types.ObjectId[]) =>
                    items.length > 0,
                message: "An outfit must contain at least one wardrobe item.",
            },
        },

        occasion: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
            default: "casual",
        },

        style: {
            type: String,
            enum: OUTFIT_STYLES,
            default: "casual",
        },

        season: {
            type: String,
            enum: OUTFIT_SEASONS,
            default: "all-season",
        },

        isFavorite: {
            type: Boolean,
            default: false,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        wornAt: {
            type: Date,
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "outfits",
        versionKey: false,
    },
);

outfitSchema.index({ userId: 1, createdAt: -1 });
outfitSchema.index({ userId: 1, isFavorite: 1 });

export type OutfitDocument = mongoose.InferSchemaType<
    typeof outfitSchema
>;

export const Outfit =
    (mongoose.models.Outfit as mongoose.Model<OutfitDocument>) ||
    mongoose.model<OutfitDocument>("Outfit", outfitSchema);

export default Outfit;
