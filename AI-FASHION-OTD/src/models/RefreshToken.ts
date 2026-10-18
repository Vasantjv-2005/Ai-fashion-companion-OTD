
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IRefreshToken extends Document {
    userId: mongoose.Types.ObjectId;
    tokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        tokenHash: {
            type: String,
            required: true,
            unique: true,
            select: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

// MongoDB automatically deletes expired records.
// The authentication service must still check expiresAt and revokedAt.
refreshTokenSchema.index(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 },
);

export const RefreshToken: Model<IRefreshToken> =
    (mongoose.models.RefreshToken as Model<IRefreshToken> | undefined) ??
    mongoose.model<IRefreshToken>("RefreshToken", refreshTokenSchema);

export default RefreshToken;
