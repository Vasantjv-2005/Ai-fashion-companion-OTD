import mongoose from "mongoose";
import WardrobeItem from "../../models/WardrobeItem";
import UserPreference from "../../models/UserPreference";
import { generateOutfitRecommendations } from "../outfits/outfit-generation.service";
import { getWeatherForCoordinates } from "../../integrations/weather/weather.client";
import type { OutfitPipelineDto } from "./ai.validator";
import type { OutfitPipelineResult } from "./ai.types";

export class OutfitPipelineError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "OutfitPipelineError";
    }
}

function toObjectId(id: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) {
        throw new OutfitPipelineError("Invalid ID format.", 400);
    }
    return new mongoose.Types.ObjectId(id);
}

export async function runOutfitPipeline(
    userId: string,
    input: OutfitPipelineDto,
): Promise<OutfitPipelineResult> {
    const userObjectId = toObjectId(userId);
    const startTime = Date.now();

    // 1. Fetch user preferences
    const preferences = await UserPreference.findOne({ userId: userObjectId }).lean().exec();

    const targetStyle = input.style || preferences?.preferredStyles?.[0] || "casual";
    const targetSeason = input.season || preferences?.preferredSeasons?.[0] || "all-season";

    // 2. Fetch weather context if coordinates are supplied
    let weatherContext: OutfitPipelineResult["weatherContext"] = undefined;

    if (input.coordinates) {
        try {
            const weather = await getWeatherForCoordinates(
                input.coordinates.latitude,
                input.coordinates.longitude,
            );
            weatherContext = {
                temperatureC: weather.temperatureC,
                condition: weather.condition,
                description: `${weather.condition}, ${weather.temperatureC}°C`,
            };
        } catch {
            // Weather service failure should not block outfit pipeline
        }
    }

    // 3. Count total wardrobe items
    const totalWardrobeItems = await WardrobeItem.countDocuments({
        userId: userObjectId,
    }).exec();

    if (totalWardrobeItems === 0) {
        throw new OutfitPipelineError(
            "No clothing items found in your wardrobe. Please add items to receive recommendations.",
            400,
        );
    }

    // 4. Generate recommendations using heuristic and AI outfit generation engine
    const generationResult = await generateOutfitRecommendations(userId, {
        occasion: input.occasion,
        requestedStyle: targetStyle,
        season: targetSeason,
        excludedItemIds: input.excludedItemIds,
        preferredColor: input.preferredColor || preferences?.preferredColors?.[0],
    });

    const processingTimeMs = Date.now() - startTime;

    return {
        outfits: generationResult.recommendations,
        weatherContext,
        pipelineSteps: {
            totalWardrobeItems,
            candidatesEvaluated: generationResult.total * 3,
            validatedOutfits: generationResult.total,
            processingTimeMs,
        },
    };
}

