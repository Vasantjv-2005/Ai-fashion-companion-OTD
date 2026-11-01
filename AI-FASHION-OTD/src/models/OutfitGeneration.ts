import mongoose, { Schema } from "mongoose";

const GENERATION_STATUSES = [
    "pending",
    "processing",
    "completed",
    "failed",
] as const;

export type GenerationStatus = (typeof GENERATION_STATUSES)[number];

const outfitGenerationSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        occasion: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
            default: "casual",
        },

        requestedStyle: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 100,
            default: "casual",
        },

        season: {
            type: String,
            trim: true,
            lowercase: true,
            maxlength: 50,
            default: "all-season",
        },

        wardrobeItemIds: {
            type: [
                {
                    type: Schema.Types.ObjectId,
                    ref: "WardrobeItem",
                },
            ],
            default: [],
        },

        generatedOutfits: {
            type: [
                {
                    name: {
                        type: String,
                        trim: true,
                        maxlength: 100,
                    },
                    description: {
                        type: String,
                        trim: true,
                        maxlength: 1000,
                    },
                    wardrobeItemIds: [
                        {
                            type: Schema.Types.ObjectId,
                            ref: "WardrobeItem",
                        },
                    ],
                    style: {
                        type: String,
                        trim: true,
                        maxlength: 100,
                    },
                    explanation: {
                        type: String,
                        trim: true,
                        maxlength: 2000,
                    },
                    score: {
                        type: Number,
                        min: 0,
                        max: 100,
                    },
                },
            ],
            default: [],
        },

        status: {
            type: String,
            enum: GENERATION_STATUSES,
            default: "pending",
            required: true,
        },

        aiProvider: {
            type: String,
            trim: true,
            maxlength: 100,
            default: undefined,
        },

        modelName: {
            type: String,
            trim: true,
            maxlength: 100,
            default: undefined,
        },

        promptVersion: {
            type: String,
            trim: true,
            maxlength: 50,
            default: undefined,
        },

        errorMessage: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: undefined,
        },

        generatedAt: {
            type: Date,
            default: undefined,
        },

        processingTimeMs: {
            type: Number,
            min: 0,
            default: undefined,
        },
    },
    {
        timestamps: true,
        collection: "outfit_generations",
        versionKey: false,
    },
);

outfitGenerationSchema.index({ userId: 1, createdAt: -1 });
outfitGenerationSchema.index({ userId: 1, status: 1 });

export type OutfitGenerationDocument =
    mongoose.InferSchemaType<typeof outfitGenerationSchema>;

export const OutfitGeneration =
    (mongoose.models.OutfitGeneration as mongoose.Model<OutfitGenerationDocument>) ||
    mongoose.model<OutfitGenerationDocument>(
        "OutfitGeneration",
        outfitGenerationSchema,
    );

export default OutfitGeneration;
