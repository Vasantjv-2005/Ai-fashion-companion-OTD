"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreferenceServiceError = void 0;
exports.getPreferences = getPreferences;
exports.updatePreferences = updatePreferences;
exports.resetPreferences = resetPreferences;
const mongoose_1 = __importDefault(require("mongoose"));
const UserPreference_1 = __importDefault(require("../../models/UserPreference"));
class PreferenceServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "PreferenceServiceError";
    }
}
exports.PreferenceServiceError = PreferenceServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new PreferenceServiceError("Invalid user ID.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
async function getPreferences(userId) {
    const userObjectId = toObjectId(userId);
    let preferences = await UserPreference_1.default.findOne({ userId: userObjectId }).lean().exec();
    if (!preferences) {
        // Initialize default preferences
        const created = await UserPreference_1.default.create({
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
async function updatePreferences(userId, input) {
    const userObjectId = toObjectId(userId);
    const updateQuery = {};
    for (const [key, value] of Object.entries(input)) {
        if (key === "recommendationSettings" && typeof value === "object" && value !== null) {
            for (const [settingKey, settingVal] of Object.entries(value)) {
                updateQuery[`recommendationSettings.${settingKey}`] = settingVal;
            }
        }
        else {
            updateQuery[key] = value;
        }
    }
    const preferences = await UserPreference_1.default.findOneAndUpdate({ userId: userObjectId }, { $set: updateQuery }, { new: true, upsert: true, runValidators: true })
        .lean()
        .exec();
    return preferences;
}
async function resetPreferences(userId) {
    const userObjectId = toObjectId(userId);
    await UserPreference_1.default.findOneAndDelete({ userId: userObjectId }).exec();
    return getPreferences(userId);
}
