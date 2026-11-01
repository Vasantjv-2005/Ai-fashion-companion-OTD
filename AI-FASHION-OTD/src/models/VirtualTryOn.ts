import mongoose, { Schema } from "mongoose";

export const VIRTUAL_TRY_ON_STATUSES = [
    "pending",
    "processing",
    "completed",
    "failed",
] as const;

export type VirtualTryOnStatus = (typeof VIRTUAL_TRY_ON_STATUSES)[number];

export const VIRTUAL_TRY_ON_TYPES = [
    "single_item",
    "full_outfit",
] as const;

export type VirtualTryOnType = (typeof VIRTUAL_TRY_ON_TYPES)[number];

export interface VirtualTryOnDocument extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    wardrobeItemIds: mongoose.Types.ObjectId[];
    tryOnType: VirtualTryOnType;
    userImageUrl: string;
    generatedImageUrl?: string;
    status: VirtualTryOnStatus;
    aiProvider?: string;
    prompt?: string;
    errorMessage?: string;
    processingTimeMs?: number;
    createdAt: Date;
    updatedAt: Date;
}

const virtualTryOnSchema = new Schema<VirtualTryOnDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        wardrobeItemIds: [
            {
                type: Schema.Types.ObjectId,
                ref: "WardrobeItem",
            },
        ],
        tryOnType: {
            type: String,
            enum: VIRTUAL_TRY_ON_TYPES,
            default: "single_item",
            required: true,
        },
        userImageUrl: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2048,
        },
        generatedImageUrl: {
            type: String,
            trim: true,
            maxlength: 2048,
        },
        status: {
            type: String,
            enum: VIRTUAL_TRY_ON_STATUSES,
            default: "pending",
            required: true,
        },
        aiProvider: {
            type: String,
            trim: true,
            maxlength: 100,
        },
        prompt: {
            type: String,
            trim: true,
            maxlength: 3000,
        },
        errorMessage: {
            type: String,
            trim: true,
            maxlength: 2000,
        },
        processingTimeMs: {
            type: Number,
            min: 0,
        },
    },
    {
        timestamps: true,
        collection: "virtual_try_ons",
        versionKey: false,
    },
);

virtualTryOnSchema.index({
    userId: 1,
    createdAt: -1,
});

virtualTryOnSchema.index({
    userId: 1,
    status: 1,
});

export const VirtualTryOn =
    mongoose.models.VirtualTryOn ||
    mongoose.model<VirtualTryOnDocument>(
        "VirtualTryOn",
        virtualTryOnSchema,
    );

export default VirtualTryOn;
