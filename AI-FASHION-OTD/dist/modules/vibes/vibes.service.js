"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRESET_VIBES = exports.VibeServiceError = void 0;
exports.setUserVibe = setUserVibe;
exports.getActiveVibe = getActiveVibe;
exports.getUserVibes = getUserVibes;
exports.getPresetVibes = getPresetVibes;
exports.deleteVibe = deleteVibe;
const mongoose_1 = __importDefault(require("mongoose"));
const UserVibe_1 = __importDefault(require("../../models/UserVibe"));
class VibeServiceError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
        this.name = "VibeServiceError";
    }
}
exports.VibeServiceError = VibeServiceError;
function toObjectId(id) {
    if (!mongoose_1.default.isValidObjectId(id)) {
        throw new VibeServiceError("Invalid ID format.", 400);
    }
    return new mongoose_1.default.Types.ObjectId(id);
}
exports.PRESET_VIBES = [
    {
        name: "Old Money Elegance",
        mood: "elegant",
        description: "Classic tailoring, neutral hues, luxury knits and timeless understated sophistication.",
        recommendedStyles: ["formal", "smart-casual", "minimalist"],
        recommendedColors: ["navy", "cream", "white", "olive", "beige"],
    },
    {
        name: "Urban Streetwear",
        mood: "streetwear",
        description: "Oversized silhouettes, layered hoodies, cargo styling and standout sneakers.",
        recommendedStyles: ["streetwear", "casual"],
        recommendedColors: ["black", "charcoal", "white", "khaki"],
    },
    {
        name: "Effortless Minimalist",
        mood: "minimalist",
        description: "Clean architectural lines, monochrome palette and capsule wardrobe staples.",
        recommendedStyles: ["minimalist", "casual"],
        recommendedColors: ["black", "white", "grey", "beige"],
    },
    {
        name: "Power Dressing",
        mood: "confident",
        description: "Structured blazers, sharp lines, tailored trousers and high-impact sophistication.",
        recommendedStyles: ["formal", "smart-casual"],
        recommendedColors: ["navy", "black", "burgundy", "camel"],
    },
    {
        name: "Weekend Athleisure",
        mood: "sporty",
        description: "Sleek joggers, performance jackets, comfortable trainers and elevated gym aesthetics.",
        recommendedStyles: ["sporty", "casual"],
        recommendedColors: ["grey", "black", "white", "sage"],
    },
];
async function setUserVibe(userId, input) {
    const userObjectId = toObjectId(userId);
    // Deactivate prior vibes
    await UserVibe_1.default.updateMany({ userId: userObjectId, isActive: true }, { $set: { isActive: false } }).exec();
    const vibe = await UserVibe_1.default.create({
        userId: userObjectId,
        mood: input.mood,
        preferredStyles: input.preferredStyles,
        preferredColors: input.preferredColors,
        preferredSeasons: input.preferredSeasons,
        occasion: input.occasion,
        notes: input.notes,
        isActive: true,
    });
    return vibe.toObject();
}
async function getActiveVibe(userId) {
    const userObjectId = toObjectId(userId);
    const vibe = await UserVibe_1.default.findOne({
        userId: userObjectId,
        isActive: true,
    })
        .lean()
        .exec();
    return vibe;
}
async function getUserVibes(userId) {
    const userObjectId = toObjectId(userId);
    return UserVibe_1.default.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
}
function getPresetVibes() {
    return exports.PRESET_VIBES;
}
async function deleteVibe(userId, vibeId) {
    const userObjectId = toObjectId(userId);
    const vibeObjectId = toObjectId(vibeId);
    const vibe = await UserVibe_1.default.findOneAndDelete({
        _id: vibeObjectId,
        userId: userObjectId,
    }).exec();
    if (!vibe) {
        throw new VibeServiceError("Vibe record not found.", 404);
    }
    return { success: true, message: "Vibe record removed." };
}
