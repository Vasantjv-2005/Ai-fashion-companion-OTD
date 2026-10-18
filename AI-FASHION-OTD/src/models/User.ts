
import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUser extends Document {
    name: string;
    email: string;
    passwordHash: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 2,
            maxlength: 100,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            maxlength: 254,
            index: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    },
);

export const User: Model<IUser> =
    (mongoose.models.User as Model<IUser> | undefined) ??
    mongoose.model<IUser>("User", userSchema);

export default User;
