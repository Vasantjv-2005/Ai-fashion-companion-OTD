import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRefreshToken extends Document {
    userId: mongoose.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

// TTL index: automatically expire refresh-token documents.
RefreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
);

export const RefreshToken: Model<IRefreshToken> =
    mongoose.models.RefreshToken ||
    mongoose.model<IRefreshToken>("RefreshToken", RefreshTokenSchema);

export default RefreshToken;

