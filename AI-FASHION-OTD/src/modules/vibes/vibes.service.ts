import mongoose from "mongoose";
import UserVibe from "../../models/UserVibe";
import type { CreateVibeDto, UpdateVibeDto } from "./vibes.validator";
import type { PresetVibe } from "./vibes.types";

export class VibeServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "VibeServiceError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new VibeServiceError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export const PRESET_VIBES: PresetVibe[] = [
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

export async function setUserVibe(userId: string, input: CreateVibeDto) {
    const userObjectId = toObjectId(userId);

    // Deactivate prior vibes
    await UserVibe.updateMany(
        { userId: userObjectId, isActive: true },
        { $set: { isActive: false } },
    ).exec();

    const vibe = await UserVibe.create({
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

export async function getActiveVibe(userId: string) {
    const userObjectId = toObjectId(userId);

    const vibe = await UserVibe.findOne({
        userId: userObjectId,
        isActive: true,
    })
        .lean()
        .exec();

    return vibe;
}

export async function getUserVibes(userId: string) {
    const userObjectId = toObjectId(userId);

    return UserVibe.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();
}

export function getPresetVibes(): PresetVibe[] {
    return PRESET_VIBES;
}

export async function deleteVibe(userId: string, vibeId: string) {
    const userObjectId = toObjectId(userId);
    const vibeObjectId = toObjectId(vibeId);

    const vibe = await UserVibe.findOneAndDelete({
        _id: vibeObjectId,
        userId: userObjectId,
    }).exec();

    if (!vibe) {
        throw new VibeServiceError("Vibe record not found.", 404);
    }

    return { success: true, message: "Vibe record removed." };
}

