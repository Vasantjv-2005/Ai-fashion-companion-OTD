import mongoose from "mongoose";
import UserPreference from "../../models/UserPreference";
import type { UpdatePreferencesDto } from "./preferences.validator";

export class PreferenceServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "PreferenceServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new PreferenceServiceError("Invalid user ID.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function getPreferences(userId: string) {
    const userObjectId = toObjectId(userId);

    let preferences = await UserPreference.findOne({ userId: userObjectId }).lean().exec();

    if (!preferences) {
        // Initialize default preferences
        const created = await UserPreference.create({
            userId: userObjectId,
            preferredStyles: ["casual"],
            preferredColors: [],
            preferredSeasons: ["all-season"],
            preferredCategories: [],
            excludedColors: [],
            budgetMin: 0,
            preferredFit: "no-preference",
            recommendationSettings: {
                useWeather: true,
                considerOccasion: true,
                avoidRecentOutfits: true,
            },
        });
        preferences = created.toObject();
    }

    return preferences;
}

export async function updatePreferences(
    userId: string,
    input: UpdatePreferencesDto,
) {
    const userObjectId = toObjectId(userId);

    const updateQuery: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(input)) {
        if (key === "recommendationSettings" && typeof value === "object" && value !== null) {
            for (const [settingKey, settingVal] of Object.entries(value)) {
                updateQuery[`recommendationSettings.${settingKey}`] = settingVal;
            }
        } else {
            updateQuery[key] = value;
        }
    }

    const preferences = await UserPreference.findOneAndUpdate(
        { userId: userObjectId },
        { $set: updateQuery },
        { new: true, upsert: true, runValidators: true },
    )
        .lean()
        .exec();

    return preferences;
}

export async function resetPreferences(userId: string) {
    const userObjectId = toObjectId(userId);

    await UserPreference.findOneAndDelete({ userId: userObjectId }).exec();

    return getPreferences(userId);
}

