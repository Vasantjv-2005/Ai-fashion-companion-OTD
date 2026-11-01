import mongoose from "mongoose";
import Profile from "../../models/Profile";
import type { UpdateProfileInput } from "./profile.validator";

export class ProfileServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number
    ) {
        super(message);
        this.name = "ProfileServiceError";
    }
}

function toObjectId(userId: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(userId)) {
        throw new ProfileServiceError("Invalid user ID.", 400);
    }

    return new mongoose.Types.ObjectId(userId);
}

export async function getProfile(userId: string) {
    const profile = await Profile.findOne({
        userId: toObjectId(userId),
    })
        .lean()
        .exec();

    if (!profile) {
        throw new ProfileServiceError("Profile not found.", 404);
    }

    return profile;
}

export async function createProfile(
    userId: string,
    input: UpdateProfileInput
) {
    const userObjectId = toObjectId(userId);

    const existingProfile = await Profile.findOne({
        userId: userObjectId,
    }).exec();

    if (existingProfile) {
        throw new ProfileServiceError(
            "A profile already exists for this user.",
            409
        );
    }

    const profile = new Profile({
        userId: userObjectId,
        ...input,
    });

    await profile.save();

    return profile.toObject();
}

export async function updateProfile(
    userId: string,
    input: UpdateProfileInput
) {
    const profile = await Profile.findOneAndUpdate(
        { userId: toObjectId(userId) },
        { $set: input },
        { new: true, runValidators: true }
    )
        .lean()
        .exec();

    if (!profile) {
        throw new ProfileServiceError("Profile not found.", 404);
    }

    return profile;
}